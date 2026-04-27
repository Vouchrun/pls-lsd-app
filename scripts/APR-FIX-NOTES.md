# Staking APR Fix — Technical Documentation

## Problem

The **1 Year Avg APR** (and potentially the 7 Day Avg APR) was displaying **0%** in the Vouch LSD application.

## Root Causes

### Primary: `web3.eth.getBlock()` BigInt overflow

Web3.js v1.x internally calls `hexToNumber()` on every field in the block response,
including `totalDifficulty`. On PulseChain, `totalDifficulty` exceeds `Number.MAX_SAFE_INTEGER`
(2^53 ≈ 9 quadrillion), causing `web3.eth.getBlock()` to throw:

```
Error: Number can only safely store up to 53 bits
```

Both `updateApr` and `updateYearlyApr` called `getBlock()` to get timestamps, and both
their catch blocks silently returned the default APR value of 0.

Timeline: This started failing when PulseChain's totalDifficulty crossed 2^53, which
happened approximately 2 days before the bug was reported.

### Secondary: uint256 precision loss

The original code used JavaScript `Number()` division on uint256 values:

```javascript
const beginRate = beginValues.totalEth / beginValues.lsdTokenSupply;
```

These values (e.g., `153793933861413171598552575289`) exceed `Number.MAX_SAFE_INTEGER`
and silently lose precision. The fix uses BigInt division with a precision scaling factor.

### Secondary: `getPastEvents('allEvents')` slow on Geth

The original code used `getPastEvents('allEvents', ...)` which requests ALL events
from the contract and filters client-side. On Geth-based RPCs (vouch.run), this
queried ~3.15 million blocks of unfiltered logs, causing a 30-second timeout.
Erigon-based RPCs (pulsechain.com, g4mm4.io) handled this in ~2 seconds due to
their optimized log index.

Changing to `getPastEvents('BalancesUpdated', ...)` includes the topic hash in
the RPC filter, allowing Geth to use bloom filters for massive speed improvement.

### Secondary: Missing guards

- `beginRate !== 1` check was missing in `updateYearlyApr` (was present in `updateApr`)
- `Math.floor(daysBetweenBlocks)` could produce 0, causing division by zero

## Test Results

Test script: `scripts/test-yearly-apr.mjs`

All 3 configured RPCs were tested:

| Approach | vouch.run (Geth) | pulsechain.com (Erigon) | g4mm4.io (Erigon) |
|---|---|---|---|
| 1. allEvents single query | FAIL (30s timeout) | OK (2.3s) | OK (1.5s) |
| 2. Topic-filtered single query | OK (23.8s) | OK (1.4s) | OK (1.6s) |
| **3. Snapshot + first-event** | **OK (2.4s)** | **OK (1.0s)** | **OK (0.7s)** |
| 4. Batched sequential 50K | OK (99.7s) | OK (29.8s) | OK (23.6s) |
| 5. Batched concurrent 5 | OK (48.5s) | OK (6.6s) | OK (5.3s) |

All successful approaches returned APR ≈ **11.40%** (snapshot approach returns ≈ 11.40%
with ~374 days; batched approaches return ≈ 11.40% with ~373.9 days).

## Changes Made

### File: `redux/reducers/LsdEthSlice.ts`

#### Added: `bigIntDivide()` utility

```typescript
function bigIntDivide(numerator: string, denominator: string): number {
  if (!denominator || denominator === '0') return NaN;
  const PRECISION = 10n ** 18n;
  const scaled = (BigInt(numerator) * PRECISION) / BigInt(denominator);
  return Number(scaled) / 1e18;
}
```

Performs safe division of uint256 values represented as strings, using BigInt
with 18-decimal precision.

#### Removed: `decodeBalancesUpdatedLog` import

No longer needed — event `returnValues` are already decoded by Web3.js when
using `getPastEvents('BalancesUpdated', ...)` instead of `getPastEvents('allEvents', ...)`.

#### Changed: `updateApr` (7-day APR)

- **`getPastEvents('allEvents')` → `getPastEvents('BalancesUpdated')`**: Topic-filtered
  query sends the event signature to the RPC for server-side filtering
- **`decodeBalancesUpdatedLog()` → `event.returnValues.totalEth` etc.**: Direct property
  access, values already decoded as strings
- **`Number() division → `bigIntDivide()`**: BigInt-safe division for uint256 values
- **`web3.eth.getBlock()` → `event.returnValues.time`**: Uses event timestamp instead
  of block query, avoids the BigInt overflow crash. Also uses actual days between
  events instead of hardcoded `/7`
- **Added `daysBetween > 0` guard**: Prevents division by zero

#### Changed: `updateYearlyApr` (1-year APR)

Complete rewrite using the snapshot approach:

1. **Calls `balancesSnapshot()` contract method** for current `totalEth` and
   `totalLsdToken` values (1 instant RPC call, no event scan needed)
2. **Searches for the first `BalancesUpdated` event** in 50K-block chunks,
   stopping as soon as the earliest event in the range is found. Falls back to
   10K-block chunks if a 50K chunk query fails
3. **Uses `event.returnValues.time` for timestamps** instead of `getBlock()`
4. **Uses `bigIntDivide()` for rate calculations** instead of Number division
5. **Uses `Date.now() / 1000` for current timestamp** instead of `getBlock()`
6. **Added `beginRate !== 1`, `daysBetween > 0`, and `currentRate !== 1` guards**

### No changes needed to:

- `config/abi/networkBalance.json` — already contains `balancesSnapshot` ABI
- `config/contract.ts` — no changes needed
- `config/env.ts` — no changes needed
- `redux/store.ts` — no changes needed
- `hooks/useApr.ts` — no changes needed
- `pages/[tokenName].tsx` — no changes needed

## How to Replicate / Test

1. Install dependencies: `npm install`
2. Run the test script: `node scripts/test-yearly-apr.mjs`
3. Results are written to `scripts/test-results.json`
4. The script tests 3 RPCs × 5 approaches and compares results

## Settings That May Need Adjusting for Other Chains

- `config/appConf/prod.json` → `blockSeconds`: Block time in seconds (10 for PulseChain)
- `config/appConf/prod.json` → `networkBalanceContractDeploymentBlock`: The block number
  where the NetworkBalance contract was deployed. Used to cap the yearly search range.
- `config/appConf/prod.json` → `contracts.networkBalanceContract.address`: The contract address
- `config/appConf/app.json` → `apr`: Default APR fallback value (currently 0)
- `CHUNK_SIZE` constant in `updateYearlyApr`: Currently 50000 blocks. Reduce if RPCs
  enforce stricter limits. Increase for faster queries on permissive RPCs.
- `SMALLER_CHUNK` constant in `updateYearlyApr`: Currently 10000 blocks. Fallback chunk
  size when the primary chunk fails.

## Key Technical Notes for Other Applications

1. **Never use `web3.eth.getBlock()` on chains with large totalDifficulty** — it crashes
   in Web3.js v1.x. Use event `returnValues.time` instead, or use raw RPC calls that
   only parse the fields you need.

2. **Never use `Number()` to divide uint256 values** — they exceed JS safe integer range.
   Use BigInt with: `Number((BigInt(a) * 10n**18n) / BigInt(b)) / 1e18`

3. **Use topic-filtered event queries** — `getPastEvents('BalancesUpdated', ...)` instead
   of `getPastEvents('allEvents', ...)` lets the RPC use bloom filters for 10-100x
   speed improvement, especially on Geth nodes.

4. **Use the `balancesSnapshot()` contract method** when you need current state — it's
   a single RPC call instead of scanning millions of blocks for the latest event.

5. **Chunk large block range queries** — RPCs may enforce block range limits. Start with
   the smallest range and expand, or break into chunks with fallback.