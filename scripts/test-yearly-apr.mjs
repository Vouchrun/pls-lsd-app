/**
 * Test script to diagnose why yearlyApr is showing 0
 * and validate batched-query fixes.
 *
 * Key fixes tested:
 * - Uses event.returnValues.time instead of web3.eth.getBlock() (avoids BN.js overflow)
 * - Uses BigInt-safe division for uint256 rate calculations
 * - Uses balancesSnapshot() for current values instead of last event
 *
 * Tests 3 RPCs × 5 approaches:
 * 1. Current single-query approach with allEvents (baseline, expected to fail on Geth)
 * 2. Single query with topic filter only (BalancesUpdated) — tests if Geth handles it
 * 3. balancesSnapshot() + first-event search with topic-filtered chunks (preferred)
 * 4. Full batched scan (sequential 50K chunks, fallback)
 * 5. Full batched scan (5 concurrent 50K chunks, fast fallback)
 *
 * Outputs results to scripts/test-results.json
 */

import Web3 from 'web3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RPCS = [
  { name: 'vouch.run', url: 'https://rpc.vouch.run' },
  { name: 'pulsechain.com', url: 'https://rpc.pulsechain.com' },
  { name: 'g4mm4.io', url: 'https://rpc-pulsechain.g4mm4.io' },
];

const NETWORK_BALANCE_CONTRACT = '0xC3116bB002F94d2E4bB8E4D83252ee021552dEB8';
const DEPLOYMENT_BLOCK = 21740533;
const BLOCK_SECONDS = 10;

const NETWORK_BALANCE_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'uint256', name: 'block', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'totalEth', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'lsdTokenSupply', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'time', type: 'uint256' },
    ],
    name: 'BalancesUpdated',
    type: 'event',
  },
  {
    inputs: [],
    name: 'balancesSnapshot',
    outputs: [
      { internalType: 'uint256', name: '_block', type: 'uint256' },
      { internalType: 'uint256', name: '_totalEth', type: 'uint256' },
      { internalType: 'uint256', name: '_totalLsdToken', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

function bigIntDivide(numerator, denominator) {
  if (denominator === 0n) return NaN;
  const PRECISION = 10n ** 18n;
  const scaled = (numerator * PRECISION) / denominator;
  return Number(scaled) / 1e18;
}

function computeApr(beginRate, endRate, daysBetween) {
  if (isNaN(beginRate) || isNaN(endRate)) return { error: 'NaN rate' };
  if (endRate === 1) return { error: 'endRate is 1' };
  if (beginRate === 1) return { error: 'beginRate is 1' };
  if (daysBetween === 0) return { error: 'daysBetweenBlocks is 0' };
  const apr = ((endRate - beginRate) / daysBetween) * 365 * 100;
  return { apr, beginRate, endRate, daysBetween };
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getTopicHash(web3) {
  return web3.utils.keccak256('BalancesUpdated(uint256,uint256,uint256,uint256)');
}

function filterBalancesUpdatedEvents(events, topicHash) {
  return events
    .filter((e) => e.raw && e.raw.topics && e.raw.topics.length === 1 && e.raw.topics[0] === topicHash)
    .sort((a, b) => {
      const aNum = typeof a.blockNumber === 'number' ? a.blockNumber : parseInt(a.blockNumber);
      const bNum = typeof b.blockNumber === 'number' ? b.blockNumber : parseInt(b.blockNumber);
      return aNum - bNum;
    });
}

function extractEventValues(event) {
  return {
    totalEth: event.returnValues.totalEth,
    lsdTokenSupply: event.returnValues.lsdTokenSupply,
    block: event.returnValues.block,
    time: event.returnValues.time,
  };
}

async function getBlockTimestampSafe(web3, blockNumber) {
  // Use raw RPC call to avoid Web3 v1.x hexToNumber overflow on totalDifficulty
  // Web3 v1.x HTTPProvider.send() uses callbacks, so we wrap in a Promise
  const blockNumHex = '0x' + BigInt(blockNumber).toString(16);
  return new Promise((resolve, reject) => {
    web3.currentProvider.send({
      jsonrpc: '2.0',
      method: 'eth_getBlockByNumber',
      params: [blockNumHex, false],
      id: Date.now(),
    }, (err, response) => {
      if (err) return reject(err);
      if (response.error) return reject(new Error(response.error.message));
      const block = response.result;
      if (!block) return reject(new Error(`Block ${blockNumber} not found`));
      // timestamp is hex string like "0x680e...", safe to parse
      resolve(Number(parseInt(block.timestamp, 16)));
    });
  });
}

// ============================================================
// Approach 1: Current single-query (baseline)
// ============================================================
async function testCurrentApproach(web3, contract, currentBlock) {
  const start = Date.now();
  try {
    const blocksFor365Days = Math.floor(
      (1 / BLOCK_SECONDS) * 60 * 60 * 24 * 365
    );
    const startBlock = Math.max(DEPLOYMENT_BLOCK, currentBlock - blocksFor365Days);
    const topicHash = getTopicHash(web3);

    console.log(`  Querying blocks ${startBlock} to ${currentBlock} (${currentBlock - startBlock} blocks)...`);

    const events = await contract.getPastEvents('allEvents', {
      fromBlock: startBlock,
      toBlock: currentBlock,
    });

    const balancesUpdatedEvents = filterBalancesUpdatedEvents(events, topicHash);
    const elapsed = Date.now() - start;

    if (balancesUpdatedEvents.length <= 1) {
      return {
        success: false,
        elapsed,
        error: `Only ${balancesUpdatedEvents.length} events found`,
        totalEventsSearched: events.length,
        blockRange: currentBlock - startBlock,
      };
    }

    const beginEvent = balancesUpdatedEvents[0];
    const endEvent = balancesUpdatedEvents[balancesUpdatedEvents.length - 1];

    // Use event's time field instead of getBlock to avoid BN overflow
    const beginTimestamp = Number(beginEvent.returnValues.time);
    const endTimestamp = Number(endEvent.returnValues.time);
    const daysBetweenBlocks = (endTimestamp - beginTimestamp) / (60 * 60 * 24);

    const beginValues = extractEventValues(beginEvent);
    const endValues = extractEventValues(endEvent);

    const beginRate = bigIntDivide(BigInt(beginValues.totalEth), BigInt(beginValues.lsdTokenSupply));
    const endRate = bigIntDivide(BigInt(endValues.totalEth), BigInt(endValues.lsdTokenSupply));
    const result = computeApr(beginRate, endRate, daysBetweenBlocks);

    return {
      success: true,
      elapsed,
      blockRange: currentBlock - startBlock,
      totalEventsSearched: events.length,
      balancesUpdatedEventsFound: balancesUpdatedEvents.length,
      firstEventBlock: beginEvent.blockNumber,
      lastEventBlock: endEvent.blockNumber,
      daysBetween: daysBetweenBlocks,
      ...result,
    };
  } catch (err) {
    return {
      success: false,
      elapsed: Date.now() - start,
      error: err.message,
      errorName: err.name,
    };
  }
}

// ============================================================
// Approach 2: balancesSnapshot() + first-event search (preferred)
// ============================================================
async function testSnapshotApproach(web3, contract, currentBlock) {
  const start = Date.now();
  const steps = [];

  try {
    // Step 1: Get current snapshot from contract
    steps.push('call balancesSnapshot()');
    const snapshot = await contract.methods.balancesSnapshot().call();

    const currentTotalEth = snapshot._totalEth || snapshot['1'];
    const currentTotalLsdToken = snapshot._totalLsdToken || snapshot['2'];
    const currentRate = bigIntDivide(BigInt(currentTotalEth), BigInt(currentTotalLsdToken));

    steps.push(`snapshot: totalEth=${currentTotalEth.substring(0, 20)}..., totalLsdToken=${currentTotalLsdToken.substring(0, 20)}..., rate=${currentRate.toFixed(10)}`);

    if (currentTotalLsdToken === '0' || currentTotalEth === '0') {
      return {
        success: false,
        elapsed: Date.now() - start,
        error: 'balancesSnapshot returned 0 values',
        steps,
      };
    }

    // Step 2: Search for first event in chunks
    const blocksFor365Days = Math.floor(
      (1 / BLOCK_SECONDS) * 60 * 60 * 24 * 365
    );
    const startBlock = Math.max(DEPLOYMENT_BLOCK, currentBlock - blocksFor365Days);
    const topicHash = getTopicHash(web3);

    const CHUNK_SIZE = 50000;
    let firstEvent = null;
    let chunksQueried = 0;

    steps.push(`searching for first event from block ${startBlock} in ${CHUNK_SIZE}-block chunks`);

    for (let from = startBlock; from <= currentBlock; from += CHUNK_SIZE) {
      const to = Math.min(from + CHUNK_SIZE - 1, currentBlock);
      chunksQueried++;

      try {
        const events = await contract.getPastEvents('allEvents', {
          fromBlock: from,
          toBlock: to,
        });

        const balancesUpdatedEvents = filterBalancesUpdatedEvents(events, topicHash);

        if (balancesUpdatedEvents.length > 0) {
          firstEvent = balancesUpdatedEvents[0];
          steps.push(`found first event at block ${firstEvent.blockNumber} after ${chunksQueried} chunk(s)`);
          break;
        }
      } catch (err) {
        steps.push(`chunk ${from}-${to} failed: ${err.message}`);
        const SMALLER_CHUNK = 10000;
        for (let innerFrom = from; innerFrom <= to; innerFrom += SMALLER_CHUNK) {
          const innerTo = Math.min(innerFrom + SMALLER_CHUNK - 1, to);
          try {
            const innerEvents = await contract.getPastEvents('allEvents', {
              fromBlock: innerFrom,
              toBlock: innerTo,
            });
            const innerBalancesUpdated = filterBalancesUpdatedEvents(innerEvents, topicHash);
            if (innerBalancesUpdated.length > 0) {
              firstEvent = innerBalancesUpdated[0];
              steps.push(`found first event at block ${firstEvent.blockNumber} (smaller chunk fallback)`);
              break;
            }
          } catch (innerErr) {
            steps.push(`smaller chunk ${innerFrom}-${innerTo} also failed: ${innerErr.message}`);
          }
        }
        if (firstEvent) break;
      }

      await sleep(200);
    }

    if (!firstEvent) {
      return {
        success: false,
        elapsed: Date.now() - start,
        error: 'No BalancesUpdated events found in any chunk',
        chunksQueried,
        steps,
      };
    }

    // Step 3: Calculate APR from first event to current snapshot
    const historicalValues = extractEventValues(firstEvent);
    const beginRate = bigIntDivide(BigInt(historicalValues.totalEth), BigInt(historicalValues.lsdTokenSupply));

    // Use event's time field for historical timestamp
    const beginTimestamp = Number(historicalValues.time);
    // Get current block timestamp via raw RPC (avoids Web3 BN overflow)
    const currentTimestamp = await getBlockTimestampSafe(web3, currentBlock);
    const daysBetween = (currentTimestamp - beginTimestamp) / (60 * 60 * 24);

    const result = computeApr(beginRate, currentRate, daysBetween);

    return {
      success: true,
      elapsed: Date.now() - start,
      chunksQueried,
      firstEventBlock: firstEvent.blockNumber,
      currentBlock,
      daysBetween,
      usedSnapshotInsteadOfLastEvent: true,
      beginTotalEth: historicalValues.totalEth.substring(0, 25) + '...',
      beginLsdTokenSupply: historicalValues.lsdTokenSupply.substring(0, 25) + '...',
      steps,
      ...result,
    };
  } catch (err) {
    return {
      success: false,
      elapsed: Date.now() - start,
      error: err.message + (err.stack ? '\n' + err.stack.split('\n').slice(0, 3).join('\n') : ''),
      errorName: err.name,
      steps,
    };
  }
}

// ============================================================
// Approach 3: Topic-filtered single query (tests Geth compatibility)
// ============================================================
async function testTopicFilteredSingleQuery(web3, contract, currentBlock) {
  const start = Date.now();
  try {
    const blocksFor365Days = Math.floor(
      (1 / BLOCK_SECONDS) * 60 * 60 * 24 * 365
    );
    const startBlock = Math.max(DEPLOYMENT_BLOCK, currentBlock - blocksFor365Days);

    console.log(`  Querying blocks ${startBlock} to ${currentBlock} (${currentBlock - startBlock} blocks) with topic filter...`);

    // Use 'BalancesUpdated' instead of 'allEvents' — this sends the topic
    // hash to the RPC so it can use bloom filters for server-side filtering
    const events = await contract.getPastEvents('BalancesUpdated', {
      fromBlock: startBlock,
      toBlock: currentBlock,
    });

    const elapsed = Date.now() - start;

    if (events.length <= 1) {
      return {
        success: false,
        elapsed,
        error: `Only ${events.length} events found`,
        balancesUpdatedEventsFound: events.length,
        blockRange: currentBlock - startBlock,
      };
    }

    // Events are already filtered to BalancesUpdated only
    const beginEvent = events[0];
    const endEvent = events[events.length - 1];

    const beginValues = extractEventValues(beginEvent);
    const endValues = extractEventValues(endEvent);
    const beginTimestamp = Number(beginValues.time);
    const endTimestamp = Number(endValues.time);
    const daysBetweenBlocks = (endTimestamp - beginTimestamp) / (60 * 60 * 24);

    const beginRate = bigIntDivide(BigInt(beginValues.totalEth), BigInt(beginValues.lsdTokenSupply));
    const endRate = bigIntDivide(BigInt(endValues.totalEth), BigInt(endValues.lsdTokenSupply));
    const result = computeApr(beginRate, endRate, daysBetweenBlocks);

    return {
      success: true,
      elapsed,
      blockRange: currentBlock - startBlock,
      balancesUpdatedEventsFound: events.length,
      firstEventBlock: beginEvent.blockNumber,
      lastEventBlock: endEvent.blockNumber,
      daysBetween: daysBetweenBlocks,
      ...result,
    };
  } catch (err) {
    return {
      success: false,
      elapsed: Date.now() - start,
      error: err.message,
      errorName: err.name,
    };
  }
}

// ============================================================
// Approach 4 & 5: Full batched scan
// ============================================================
async function testBatchedScan(web3, contract, currentBlock, concurrency = 1) {
  const start = Date.now();
  const steps = [];

  try {
    const blocksFor365Days = Math.floor(
      (1 / BLOCK_SECONDS) * 60 * 60 * 24 * 365
    );
    const startBlock = Math.max(DEPLOYMENT_BLOCK, currentBlock - blocksFor365Days);
    const topicHash = getTopicHash(web3);

    const CHUNK_SIZE = 50000;
    const chunks = [];
    for (let from = startBlock; from <= currentBlock; from += CHUNK_SIZE) {
      const to = Math.min(from + CHUNK_SIZE - 1, currentBlock);
      chunks.push({ from, to });
    }

    steps.push(`total chunks: ${chunks.length}, concurrency: ${concurrency}`);

    let firstEvent = null;
    let lastEvent = null;
    let totalEventsSearched = 0;
    let chunksQueried = 0;
    let chunksFailed = 0;

    const processChunk = async (chunk) => {
      try {
        const events = await contract.getPastEvents('allEvents', {
          fromBlock: chunk.from,
          toBlock: chunk.to,
        });
        return { events, chunk, fallback: false };
      } catch (err) {
        const SMALL_CHUNK = 10000;
        const allInner = [];
        for (let innerFrom = chunk.from; innerFrom <= chunk.to; innerFrom += SMALL_CHUNK) {
          const innerTo = Math.min(innerFrom + SMALL_CHUNK - 1, chunk.to);
          try {
            const innerEvents = await contract.getPastEvents('allEvents', {
              fromBlock: innerFrom,
              toBlock: innerTo,
            });
            allInner.push(...innerEvents);
          } catch {
            // Skip failed small chunks
          }
        }
        return { events: allInner, chunk, fallback: true };
      }
    };

    if (concurrency === 1) {
      for (const chunk of chunks) {
        const result = await processChunk(chunk);
        chunksQueried++;
        totalEventsSearched += result.events.length;

        const balancesUpdated = filterBalancesUpdatedEvents(result.events, topicHash);

        if (balancesUpdated.length > 0) {
          if (!firstEvent || balancesUpdated[0].blockNumber < firstEvent.blockNumber) {
            firstEvent = balancesUpdated[0];
          }
          if (!lastEvent || balancesUpdated[balancesUpdated.length - 1].blockNumber > lastEvent.blockNumber) {
            lastEvent = balancesUpdated[balancesUpdated.length - 1];
          }
        }
        await sleep(100);
      }
    } else {
      for (let i = 0; i < chunks.length; i += concurrency) {
        const batch = chunks.slice(i, i + concurrency);
        const results = await Promise.allSettled(
          batch.map((chunk) => processChunk(chunk))
        );

        for (const result of results) {
          chunksQueried++;
          if (result.status === 'fulfilled') {
            totalEventsSearched += result.value.events.length;
            const balancesUpdated = filterBalancesUpdatedEvents(result.value.events, topicHash);
            if (balancesUpdated.length > 0) {
              if (!firstEvent || balancesUpdated[0].blockNumber < firstEvent.blockNumber) {
                firstEvent = balancesUpdated[0];
              }
              if (!lastEvent || balancesUpdated[balancesUpdated.length - 1].blockNumber > lastEvent.blockNumber) {
                lastEvent = balancesUpdated[balancesUpdated.length - 1];
              }
            }
          } else {
            chunksFailed++;
          }
        }
        await sleep(100);
      }
    }

    if (!firstEvent || !lastEvent) {
      return {
        success: false,
        elapsed: Date.now() - start,
        error: `Not enough events (first: ${firstEvent ? 'yes' : 'no'}, last: ${lastEvent ? 'yes' : 'no'})`,
        chunksQueried,
        chunksFailed,
        totalEventsSearched,
        steps,
      };
    }

    // Use event time fields instead of getBlock
    const beginValues = extractEventValues(firstEvent);
    const endValues = extractEventValues(lastEvent);
    const beginTimestamp = Number(beginValues.time);
    const endTimestamp = Number(endValues.time);
    const daysBetweenBlocks = (endTimestamp - beginTimestamp) / (60 * 60 * 24);

    const beginRate = bigIntDivide(BigInt(beginValues.totalEth), BigInt(beginValues.lsdTokenSupply));
    const endRate = bigIntDivide(BigInt(endValues.totalEth), BigInt(endValues.lsdTokenSupply));
    const result = computeApr(beginRate, endRate, daysBetweenBlocks);

    return {
      success: true,
      elapsed: Date.now() - start,
      chunksQueried,
      chunksFailed,
      totalEventsSearched,
      firstEventBlock: firstEvent.blockNumber,
      lastEventBlock: lastEvent.blockNumber,
      daysBetween: daysBetweenBlocks,
      steps,
      ...result,
    };
  } catch (err) {
    return {
      success: false,
      elapsed: Date.now() - start,
      error: err.message + (err.stack ? '\n' + err.stack.split('\n').slice(0, 3).join('\n') : ''),
      errorName: err.name,
      steps,
    };
  }
}

// ============================================================
// Main runner
// ============================================================
async function main() {
  const output = {
    timestamp: new Date().toISOString(),
    rpcResults: {},
  };

  for (const rpc of RPCS) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`Testing RPC: ${rpc.name} (${rpc.url})`);
    console.log('='.repeat(70));

    let web3;
    try {
      web3 = new Web3(new Web3.providers.HttpProvider(rpc.url, {
        timeout: 60000,
      }));
      const currentBlock = await web3.eth.getBlockNumber();
      console.log(`Connected. Current block: ${currentBlock}`);
    } catch (err) {
      console.log(`FAILED to connect: ${err.message}`);
      output.rpcResults[rpc.name] = { connected: false, error: err.message };
      continue;
    }

    const currentBlock = await web3.eth.getBlockNumber();
    const contract = new web3.eth.Contract(NETWORK_BALANCE_ABI, NETWORK_BALANCE_CONTRACT);

    const rpcResult = {
      connected: true,
      currentBlock,
      approaches: {},
    };

    // Approach 1: Current single-query approach (allEvents)
    console.log(`\n--- Approach 1: Single query, allEvents (current code, ~3.15M blocks) ---`);
    const app1 = await testCurrentApproach(web3, contract, currentBlock);
    console.log(`Result: ${app1.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Time: ${(app1.elapsed / 1000).toFixed(1)}s`);
    if (app1.error) console.log(`Error: ${String(app1.error).substring(0, 120)}`);
    if (app1.success) console.log(`APR: ${app1.apr?.toFixed(4)}%  (days: ${app1.daysBetween?.toFixed(1)})`);
    rpcResult.approaches['1_singleQueryAllEvents'] = app1;

    await sleep(2000);

    // Approach 2: Topic-filtered single query (BalancesUpdated only)
    console.log(`\n--- Approach 2: Single query, BalancesUpdated topic filter (~3.15M blocks) ---`);
    const app2 = await testTopicFilteredSingleQuery(web3, contract, currentBlock);
    console.log(`Result: ${app2.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Time: ${(app2.elapsed / 1000).toFixed(1)}s`);
    if (app2.error) console.log(`Error: ${String(app2.error).substring(0, 120)}`);
    if (app2.success) console.log(`APR: ${app2.apr?.toFixed(4)}%  (days: ${app2.daysBetween?.toFixed(1)}, events: ${app2.balancesUpdatedEventsFound})`);
    rpcResult.approaches['2_singleQueryTopicFilter'] = app2;

    await sleep(2000);

    // Approach 3: Snapshot + first event
    console.log(`\n--- Approach 3: balancesSnapshot() + first-event search ---`);
    const app3 = await testSnapshotApproach(web3, contract, currentBlock);
    console.log(`Result: ${app3.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Time: ${(app3.elapsed / 1000).toFixed(1)}s`);
    if (app3.error) console.log(`Error: ${String(app3.error).substring(0, 120)}`);
    if (app3.success) {
      console.log(`APR: ${app3.apr?.toFixed(4)}%  (days: ${app3.daysBetween?.toFixed(1)}, chunks: ${app3.chunksQueried})`);
    }
    rpcResult.approaches['3_snapshotFirstEvent'] = app3;

    await sleep(2000);

    // Approach 4: Full batched scan (sequential)
    console.log(`\n--- Approach 4: Full batched scan (sequential 50K chunks) ---`);
    console.log(`This may take a while...`);
    const app4 = await testBatchedScan(web3, contract, currentBlock, 1);
    console.log(`Result: ${app4.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Time: ${(app4.elapsed / 1000).toFixed(1)}s`);
    if (app4.error) console.log(`Error: ${String(app4.error).substring(0, 120)}`);
    if (app4.success) {
      console.log(`APR: ${app4.apr?.toFixed(4)}%  (days: ${app4.daysBetween?.toFixed(1)}, chunks: ${app4.chunksQueried})`);
    }
    rpcResult.approaches['4_batchedSequential'] = app4;

    await sleep(2000);

    // Approach 5: Full batched scan (5 concurrent)
    console.log(`\n--- Approach 5: Full batched scan (5 concurrent 50K chunks) ---`);
    console.log(`This may take a while...`);
    const app5 = await testBatchedScan(web3, contract, currentBlock, 5);
    console.log(`Result: ${app5.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Time: ${(app5.elapsed / 1000).toFixed(1)}s`);
    if (app5.error) console.log(`Error: ${String(app5.error).substring(0, 120)}`);
    if (app5.success) {
      console.log(`APR: ${app5.apr?.toFixed(4)}%  (days: ${app5.daysBetween?.toFixed(1)}, chunks: ${app5.chunksQueried})`);
    }
    rpcResult.approaches['5_batchedConcurrent5'] = app5;

    output.rpcResults[rpc.name] = rpcResult;
  }

  // Summary
  console.log(`\n\n${'='.repeat(70)}`);
  console.log('SUMMARY');
  console.log('='.repeat(70));

  for (const [rpcName, rpcResult] of Object.entries(output.rpcResults)) {
    console.log(`\n${rpcName}:`);
    if (!rpcResult.connected) {
      console.log(`  Could not connect: ${rpcResult.error}`);
      continue;
    }
    for (const [approach, result] of Object.entries(rpcResult.approaches)) {
      const status = result.success ? 'OK' : 'FAIL';
      const apr = result.apr ? `${result.apr.toFixed(4)}%` : 'N/A';
      const time = result.elapsed ? `${(result.elapsed / 1000).toFixed(1)}s` : 'N/A';
      const errStr = result.error ? ` Error: ${String(result.error).substring(0, 80)}` : '';
      console.log(`  ${approach}: [${status}] APR=${apr} Time=${time}${errStr}`);
    }
  }

  const outputPath = path.join(__dirname, 'test-results.json');
  const serializableOutput = JSON.parse(JSON.stringify(output, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
  fs.writeFileSync(outputPath, JSON.stringify(serializableOutput, null, 2));
  console.log(`\nResults written to ${outputPath}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});