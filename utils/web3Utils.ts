import Web3 from 'web3';
import { getEthereumRpc, getLsdEthMetamaskParam, getAllRpcUrls, getRpcAtIndex } from 'config/env';
import snackbarUtil from './snackbarUtils';
import { AbiItem } from 'web3-utils';
import { getStorage, saveStorage, removeStorage } from './storageUtils';
import { STORAGE_KEY_CUSTOM_RPC } from './storageUtils';

declare const window: any;

// Storage keys for RPC management
const STORAGE_KEY_WORKING_RPC = 'working_rpc';
const STORAGE_KEY_BAD_RPCS = 'bad_rpcs';

// A failed endpoint is retried after this window. Previously a failed RPC was
// blacklisted permanently, so a transient outage could stick forever.
const BAD_RPC_TTL = 30 * 60 * 1000; // 30 minutes

// RPC fallback state management
let currentRpcIndex = 0;
let lastRpcSwitchTime = 0;
const RPC_SWITCH_COOLDOWN = 30000; // 30 seconds in milliseconds
let cachedCustomRpc: string | null = null;
let lastRpcUrl: string | null = null; // Track the last RPC URL used
let badRpcs: Map<string, number> = new Map(); // rpcUrl -> time it was marked bad
// Last RPC that answered successfully in THIS session. Deliberately not
// persisted: a stale "working" RPC must never override the endpoint the user
// explicitly selected (see updateCachedCustomRpc).
let workingRpc: string | null = null;

/**
 * Get the custom RPC from storage.
 * Always re-reads localStorage so a change made in another tab (or by the
 * settings drawer) is picked up without a reload.
 */
function getCustomRpc(): string | null {
  if (typeof window === 'undefined') {
    return cachedCustomRpc;
  }
  try {
    const stored = getStorage(STORAGE_KEY_CUSTOM_RPC);
    cachedCustomRpc = stored && stored.trim() ? stored.trim() : null;
  } catch (e) {
    console.error('Error loading custom RPC:', e);
  }
  return cachedCustomRpc;
}

/**
 * Load bad RPCs from storage, dropping entries older than BAD_RPC_TTL.
 * The legacy array format is discarded: those entries carry no timestamp and
 * could otherwise never recover.
 */
function loadBadRpcs(): Map<string, number> {
  const badRpcsMap = new Map<string, number>();
  const now = Date.now();
  try {
    const badRpcsJson = getStorage(STORAGE_KEY_BAD_RPCS);
    if (!badRpcsJson) {
      return badRpcsMap;
    }
    const parsed = JSON.parse(badRpcsJson);
    if (parsed && !Array.isArray(parsed) && typeof parsed === 'object') {
      Object.keys(parsed).forEach((rpcUrl) => {
        const markedAt = typeof parsed[rpcUrl] === 'number' ? parsed[rpcUrl] : 0;
        if (now - markedAt < BAD_RPC_TTL) {
          badRpcsMap.set(rpcUrl, markedAt);
        }
      });
    }
  } catch (e) {
    console.error('Error loading bad RPCs:', e);
  }
  return badRpcsMap;
}

/**
 * Save bad RPCs to storage as { rpcUrl: markedAt }
 */
function saveBadRpcs(badRpcsMap: Map<string, number>) {
  try {
    const serialized: Record<string, number> = {};
    badRpcsMap.forEach((markedAt, rpcUrl) => {
      serialized[rpcUrl] = markedAt;
    });
    saveStorage(STORAGE_KEY_BAD_RPCS, JSON.stringify(serialized));
  } catch (e) {
    console.error('Error saving bad RPCs:', e);
  }
}

/**
 * Check whether an RPC is currently marked as bad (expired marks are dropped)
 */
function isRpcMarkedBad(rpcUrl: string): boolean {
  const markedAt = badRpcs.get(rpcUrl);
  if (markedAt === undefined) {
    return false;
  }
  if (Date.now() - markedAt >= BAD_RPC_TTL) {
    badRpcs.delete(rpcUrl);
    saveBadRpcs(badRpcs);
    return false;
  }
  return true;
}

/**
 * Mark an RPC as bad/blocked
 */
function markRpcAsBad(rpcUrl: string) {
  badRpcs.set(rpcUrl, Date.now());
  saveBadRpcs(badRpcs);
  console.warn(`Marked RPC as bad: ${rpcUrl}`);
  
  // If this was the working RPC, clear it
  if (workingRpc === rpcUrl) {
    workingRpc = null;
  }
}

/**
 * Remember the RPC that last answered successfully for this session only.
 * Persisting this caused a previously "working" RPC to override the user's
 * explicit selection on every page load.
 */
function setSessionWorkingRpc(rpcUrl: string) {
  workingRpc = rpcUrl;
}

/**
 * Initialize RPC state from storage
 */
function initializeRpcState() {
  badRpcs = loadBadRpcs();
  // Purge the legacy persisted "working RPC". It must never take priority over
  // the custom RPC (tried first) or the configured primary.
  removeStorage(STORAGE_KEY_WORKING_RPC);
  workingRpc = null;
  currentRpcIndex = 0;
}

/**
 * Clear all bad RPCs (useful for recovery or testing)
 */
export function clearBadRpcs() {
  badRpcs.clear();
  saveBadRpcs(badRpcs);
  console.log('Cleared all bad RPCs');
}

/**
 * Get list of bad RPCs (for debugging)
 */
export function getBadRpcs(): string[] {
  return Array.from(badRpcs.keys());
}

/**
 * Get current working RPC
 */
export function getWorkingRpc(): string | null {
  return workingRpc;
}

// Initialize on module load
if (typeof window !== 'undefined') {
  initializeRpcState();
}

/**
 * Update the cached custom RPC (call this when custom RPC changes).
 * The explicit selection always wins: stale failover state is discarded and the
 * new endpoint becomes active immediately.
 */
export function updateCachedCustomRpc(customRpc: string | null) {
  const normalizedRpc = customRpc && customRpc.trim() ? customRpc.trim() : null;

  if (normalizedRpc) {
    saveStorage(STORAGE_KEY_CUSTOM_RPC, normalizedRpc);
    // A freshly selected endpoint must not inherit an old "bad" mark.
    if (badRpcs.delete(normalizedRpc)) {
      saveBadRpcs(badRpcs);
    }
    workingRpc = normalizedRpc;
    // Custom RPC is always placed first, so its index is 0.
    currentRpcIndex = 0;
  } else {
    removeStorage(STORAGE_KEY_CUSTOM_RPC);
    workingRpc = null;
    currentRpcIndex = 0;
  }

  cachedCustomRpc = normalizedRpc;
  ethWeb3 = undefined;
  lastRpcUrl = null;
}

/**
 * Find the next working RPC (skips bad RPCs)
 * @returns RPC URL if found, null if all RPCs are bad
 */
function findNextWorkingRpc(currentRpc?: string): string | null {
  const customRpc = getCustomRpc();
  const allRpcs = getAllRpcUrls(customRpc);
  
  // Filter out bad RPCs
  const workingRpcs = allRpcs.filter(rpc => !isRpcMarkedBad(rpc));
  
  if (workingRpcs.length === 0) {
    console.error('All RPCs are marked as bad. Resetting bad RPCs list.');
    // Reset bad RPCs if all are bad (maybe they recovered)
    badRpcs.clear();
    saveBadRpcs(badRpcs);
    return allRpcs[0] || null;
  }
  
  // If we have a current RPC and it's not bad, prefer it
  if (currentRpc && !isRpcMarkedBad(currentRpc) && workingRpcs.includes(currentRpc)) {
    return currentRpc;
  }
  
  // The user's explicit custom RPC always has priority
  if (customRpc && !isRpcMarkedBad(customRpc) && workingRpcs.includes(customRpc)) {
    return customRpc;
  }
  
  // Then the RPC that has been working in this session
  if (workingRpc && !isRpcMarkedBad(workingRpc) && workingRpcs.includes(workingRpc)) {
    return workingRpc;
  }
  
  // Otherwise, find the first working RPC from the list
  return workingRpcs[0] || null;
}

/**
 * Switch to the next working RPC (skips bad RPCs)
 * @param markCurrentAsBad If true, marks the current RPC as bad before switching
 * @returns true if switched successfully, false if no working RPC found
 */
export function switchToNextRpc(markCurrentAsBad: boolean = false): boolean {
  const currentRpc = getCurrentRpc();
  
  // Mark current RPC as bad if requested
  if (markCurrentAsBad && currentRpc) {
    markRpcAsBad(currentRpc);
  }
  
  // Find next working RPC
  const nextRpc = findNextWorkingRpc();
  
  if (!nextRpc) {
    console.error('No working RPC found');
    return false;
  }
  
  // If it's the same RPC, no need to switch
  if (nextRpc === currentRpc && !markCurrentAsBad) {
    return false;
  }
  
  const customRpc = getCustomRpc();
  const allRpcs = getAllRpcUrls(customRpc);
  const newIndex = allRpcs.indexOf(nextRpc);
  
  if (newIndex < 0) {
    console.error(`RPC ${nextRpc} not found in RPC list`);
    return false;
  }
  
  currentRpcIndex = newIndex;
  lastRpcSwitchTime = Date.now();
  
  // Save as the working RPC for this session
  setSessionWorkingRpc(nextRpc);
  
  console.warn(`Switching to working RPC: ${nextRpc} (index ${newIndex})`);
  
  // Reset Web3 instances to use new RPC
  ethWeb3 = undefined;
  lastRpcUrl = null;
  
  return true;
}

/**
 * Get the current active RPC URL
 * Returns the working RPC if available, otherwise finds the first working RPC
 * This function should be side-effect free for reading - only updates state when necessary
 */
export function getCurrentRpc(): string {
  const customRpc = getCustomRpc();
  const allRpcs = getAllRpcUrls(customRpc);

  // If we have a working RPC and it's not bad, use it
  if (workingRpc && !isRpcMarkedBad(workingRpc) && allRpcs.includes(workingRpc)) {
    const index = allRpcs.indexOf(workingRpc);
    if (index >= 0 && currentRpcIndex !== index) {
      // Only update index if it's different (avoid unnecessary state changes)
      currentRpcIndex = index;
    }
    return workingRpc;
  }
  
  // Find the best available RPC: custom first, then the session working RPC,
  // then the first configured endpoint that is not marked bad
  const nextRpc = findNextWorkingRpc();
  if (nextRpc) {
    const index = allRpcs.indexOf(nextRpc);
    if (index >= 0) {
      // Only update if different to avoid triggering rerenders
      if (currentRpcIndex !== index || workingRpc !== nextRpc) {
        currentRpcIndex = index;
        setSessionWorkingRpc(nextRpc);
      }
      return nextRpc;
    }
  }
  
  // Fallback to index-based selection
  return getRpcAtIndex(currentRpcIndex, customRpc);
}

/**
 * Check if an error indicates a blocked or failed RPC request
 */
function isRpcError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code;
  const errorString = String(error).toLowerCase();
  
  // Check for common RPC error patterns
  return (
    errorMessage.includes('blocked') ||
    errorMessage.includes('network') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('failed') ||
    errorMessage.includes('connection refused') ||
    errorMessage.includes('connection reset') ||
    errorMessage.includes('econnrefused') ||
    errorString.includes('blocked') ||
    errorString.includes('network') ||
    errorCode === -32603 || // Internal JSON-RPC error
    errorCode === 'NETWORK_ERROR' ||
    errorCode === 'TIMEOUT' ||
    errorCode === 'ECONNREFUSED' ||
    errorCode === 'ERR_NETWORK' ||
    errorCode === 'ERR_INTERNET_DISCONNECTED' ||
    // Check for fetch/network related errors
    (error instanceof TypeError && errorMessage.includes('fetch')) ||
    (error.name === 'NetworkError') ||
    (error.name === 'TypeError' && errorMessage.includes('network'))
  );
}

/**
 * Helper function to execute a contract method call with automatic RPC fallback
 * This is a convenience wrapper around executeWithRpcFallback for contract calls
 */
export async function callContractMethod<T>(
  contractAbi: AbiItem | AbiItem[],
  contractAddress: string,
  methodName: string,
  methodArgs: any[] = [],
  options: { from?: string } = {}
): Promise<T> {
  return executeWithRpcFallback(async (web3) => {
    const contract = new web3.eth.Contract(contractAbi, contractAddress, options);
    const method = contract.methods[methodName](...methodArgs);
    return await method.call();
  });
}

/**
 * Execute a Web3 operation with automatic RPC fallback on failure
 * @param operation Function that performs the Web3 operation
 * @param maxRetries Maximum number of retry attempts (default: all RPCs in list)
 * @param timeoutMs Timeout in milliseconds for the operation (default: 15000)
 * @returns Result of the operation
 */
export async function executeWithRpcFallback<T>(
  operation: (web3: Web3) => Promise<T>,
  maxRetries?: number,
  timeoutMs: number = 15000
): Promise<T> {
  const customRpc = getCustomRpc();
  const allRpcs = getAllRpcUrls(customRpc);
  const maxAttempts = maxRetries || allRpcs.length;
  let lastError: any;
  const initialRpcIndex = currentRpcIndex;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const web3 = getEthWeb3();
      
      // Wrap operation with timeout to detect hanging/blocked requests
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Request timeout after ${timeoutMs}ms - RPC may be blocked or unresponsive`));
        }, timeoutMs);
      });
      
      const result = await Promise.race([operation(web3), timeoutPromise]);
      
      // If successful, remember the current RPC for this session
      const currentRpc = getCurrentRpc();
      if (currentRpc && !isRpcMarkedBad(currentRpc)) {
        setSessionWorkingRpc(currentRpc);
      }
      
      return result;
    } catch (error: any) {
      lastError = error;
      const isRpcFailure = isRpcError(error) || error.message?.includes('timeout');
      console.error(`RPC call failed (attempt ${attempt}/${maxAttempts}):`, error.message, isRpcFailure ? '(RPC error detected)' : '');
      
      // If this isn't the last attempt and it's an RPC failure, mark as bad and switch
      if (attempt < maxAttempts && isRpcFailure) {
        // switchToNextRpc(true) marks the failed RPC as bad itself. Marking it
        // here as well would blacklist the newly selected fallback instead.
        const switched = switchToNextRpc(true); // Mark current as bad and switch
        if (switched) {
          // Small delay after switching to let the new RPC initialize
          await new Promise(resolve => setTimeout(resolve, 100));
          // Continue loop to retry with new RPC
          continue;
        }
      } else if (attempt < maxAttempts) {
        // For non-RPC errors, don't mark as bad, just wait
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  // All retries exhausted - reset to initial RPC
  currentRpcIndex = initialRpcIndex;
  ethWeb3 = undefined;
  lastRpcUrl = null;
  
  throw new Error(`All RPC endpoints failed after ${maxAttempts} attempts. Last error: ${lastError?.message}`);
}


export function createWeb3(provider?: any) {
  return new Web3(provider || (window.ethereum as any) || Web3.givenProvider);
}

let ethWeb3: Web3 | undefined = undefined;
let ethWeb3ForTransactions: Web3 | undefined = undefined;

/**
 * Wrap a Web3 method call with automatic RPC fallback
 * The operation function will be re-executed with new Web3 instance if RPC switches
 */
async function callWithRpcFallback<T>(
  operationFactory: () => Promise<T>,
  maxRetries?: number
): Promise<T> {
  const customRpc = getCustomRpc();
  const allRpcs = getAllRpcUrls(customRpc);
  const maxAttempts = maxRetries || allRpcs.length;
  let lastError: any;
  const initialRpcIndex = currentRpcIndex;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Wrap with timeout to detect blocked requests
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Request timeout after 10s - RPC may be blocked`));
        }, 10000);
      });
      
      // Execute operation (will use current Web3 instance)
      const result = await Promise.race([operationFactory(), timeoutPromise]);
      
      // If successful, remember the current RPC for this session
      const currentRpc = getCurrentRpc();
      if (currentRpc && !isRpcMarkedBad(currentRpc)) {
        setSessionWorkingRpc(currentRpc);
      }
      
      return result;
    } catch (error: any) {
      lastError = error;
      const isRpcFailure = isRpcError(error) || error.message?.includes('timeout');
      
      if (isRpcFailure) {
        console.warn(`RPC call failed (attempt ${attempt}/${maxAttempts}), switching RPC:`, error.message);
      }
      
      // If this isn't the last attempt and it's an RPC failure, mark as bad and switch
      if (attempt < maxAttempts && isRpcFailure) {
        // switchToNextRpc(true) marks the failed RPC as bad itself. Marking it
        // here as well would blacklist the newly selected fallback instead.
        const switched = switchToNextRpc(true); // Mark current as bad and switch
        if (switched) {
          // Recreate Web3 instance with new RPC
          const newRpc = getCurrentRpc();
          const useWebsocket = newRpc.startsWith('wss');
          ethWeb3 = createWeb3(
            useWebsocket
              ? new Web3.providers.WebsocketProvider(newRpc)
              : new Web3.providers.HttpProvider(newRpc)
          );
          lastRpcUrl = newRpc;
          // Small delay after switching
          await new Promise(resolve => setTimeout(resolve, 100));
          // Continue loop to retry with new RPC
          continue;
        }
      } else if (attempt < maxAttempts) {
        // For non-RPC errors, don't mark as bad, just wait
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  // All retries exhausted - reset to initial RPC
  currentRpcIndex = initialRpcIndex;
  ethWeb3 = undefined;
  lastRpcUrl = null;
  
  throw new Error(`All RPC endpoints failed after ${maxAttempts} attempts. Last error: ${lastError?.message}`);
}

/**
 * Create a proxy wrapper around Web3 that automatically retries with next RPC on failure
 */
function createWeb3Proxy(web3: Web3): Web3 {
  const handler: ProxyHandler<any> = {
    get(target, prop) {
      const value = (target as any)[prop];
      
      // Special handling for Contract constructor - don't proxy it
      if (prop === 'Contract' && typeof value === 'function') {
        return value;
      }
      
      // If it's a function, wrap it to automatically retry on RPC errors
      if (typeof value === 'function') {
        return function(...args: any[]) {
          const result = value.apply(target, args);
          
          // If it returns a promise (async method), wrap it with fallback
          if (result && typeof result.then === 'function') {
            return executeWithRpcFallback(async () => {
              // Get fresh Web3 instance (might have switched RPCs)
              const currentWeb3 = getEthWeb3();
              // Re-apply the same method call
              const method = (currentWeb3 as any)[prop];
              if (typeof method === 'function') {
                return method.apply(currentWeb3, args);
              }
              // Fallback: try the original result
              return result;
            });
          }
          
          return result;
        };
      }
      
      // If it's an object (like eth, utils), create a proxy for it too
      if (value && typeof value === 'object' && prop !== 'constructor' && prop !== 'currentProvider') {
        // Special handling for Contract instances
        if (value.constructor && value.constructor.name === 'Contract') {
          return createContractProxy(value);
        }
        // Don't proxy the eth object's Contract property - it's a constructor
        if (prop === 'eth' && value.Contract) {
          // Return eth object but keep Contract constructor as-is
          return new Proxy(value, {
            get(ethTarget, ethProp) {
              if (ethProp === 'Contract') {
                // Return the Contract constructor directly without proxying
                return ethTarget.Contract;
              }
              // For other properties, use the handler
              const ethValue = (ethTarget as any)[ethProp];
              if (typeof ethValue === 'function') {
                return function(...args: any[]) {
                  const result = ethValue.apply(ethTarget, args);
                  if (result && typeof result.then === 'function') {
                    return executeWithRpcFallback(async () => {
                      const currentWeb3 = getEthWeb3();
                      const currentMethod = (currentWeb3.eth as any)[ethProp];
                      if (typeof currentMethod === 'function') {
                        return currentMethod.apply(currentWeb3.eth, args);
                      }
                      return result;
                    });
                  }
                  return result;
                };
              }
              return ethValue;
            }
          });
        }
        return new Proxy(value, handler);
      }
      
      return value;
    }
  };
  
  return new Proxy(web3, handler);
}

/**
 * Create a proxy for Contract instances to wrap method calls
 */
function createContractProxy(contract: any): any {
  return new Proxy(contract, {
    get(target, prop) {
      const value = (target as any)[prop];
      
      // Handle contract.methods
      if (prop === 'methods') {
        return new Proxy(value, {
          get(methodsTarget, methodName) {
            const method = (methodsTarget as any)[methodName];
            if (typeof method === 'function') {
              return function(...args: any[]) {
                const methodInstance = method.apply(methodsTarget, args);
                // Wrap .call(), .send(), etc.
                return new Proxy(methodInstance, {
                  get(methodTarget, methodProp) {
                    const methodFn = (methodTarget as any)[methodProp];
                    if (typeof methodFn === 'function') {
                      return function(...callArgs: any[]) {
                        const result = methodFn.apply(methodTarget, callArgs);
                        // If it returns a promise, wrap with fallback
                        if (result && typeof result.then === 'function') {
                          return executeWithRpcFallback(async () => {
                            // Recreate contract with current Web3 instance
                            const currentWeb3 = getEthWeb3();
                            // Get contract info from the original contract instance
                            const contractAbi = (target as any)._jsonInterface || (target as any).options?.jsonInterface;
                            const contractAddress = (target as any)._address || (target as any).options?.address;
                            const contractOptions = (target as any).options || {};
                            
                            if (!contractAbi || !contractAddress) {
                              // Fallback: try the original result
                              return result;
                            }
                            
                            const newContract = new currentWeb3.eth.Contract(contractAbi, contractAddress, contractOptions);
                            const newMethod = newContract.methods[methodName as string](...args);
                            return (newMethod as any)[methodProp](...callArgs);
                          });
                        }
                        return result;
                      };
                    }
                    return methodFn;
                  }
                });
              };
            }
            return method;
          }
        });
      }
      
      return value;
    }
  });
}

/**
 * get Ethereum web3 instance singleton (for read operations)
 * Automatically recreates instance if RPC has changed
 * Note: Use executeWithRpcFallback for automatic RPC fallback on errors
 */
export function getEthWeb3() {
  const rpcLink = getCurrentRpc();
  
  // Recreate Web3 instance if RPC has changed
  if (!ethWeb3 || lastRpcUrl !== rpcLink) {
    const useWebsocket = rpcLink.startsWith('wss');
    ethWeb3 = createWeb3(
      useWebsocket
        ? new Web3.providers.WebsocketProvider(rpcLink)
        : new Web3.providers.HttpProvider(rpcLink)
    );
    lastRpcUrl = rpcLink;
  }
  return ethWeb3;
}

/**
 * get Ethereum web3 instance for transactions (uses MetaMask provider)
 */
export function getEthWeb3ForTransactions() {
  // Always create a fresh instance to ensure we have the latest provider state
  // This is important for hardware wallets like Trezor
  if (!window.ethereum) {
    throw new Error(
      'No Ethereum provider found. Please install MetaMask or connect your wallet.'
    );
  }

  // Always recreate the instance to ensure we have the latest provider state
  // This is critical for hardware wallets like Trezor that may need to maintain connection
  ethWeb3ForTransactions = createWeb3(window.ethereum);

  return ethWeb3ForTransactions;
}

export async function getErc20AssetBalance(
  userAddress: string | undefined,
  tokenAbi: AbiItem | AbiItem[],
  tokenAddress: string | undefined
) {
  if (!userAddress || !tokenAbi || !tokenAddress) {
    return undefined;
  }
  try {
    return await executeWithRpcFallback(async (web3) => {
      let contract = new web3.eth.Contract(tokenAbi, tokenAddress, {
        from: userAddress,
      });
      const result = await contract.methods.balanceOf(userAddress).call();
      let balance = web3.utils.fromWei(result + '', 'ether');
      return balance;
    });
  } catch (err: any) {
    return undefined;
  }
}

/**
 * add lsd ETH to metamask
 */
export async function addLsdEthToMetaMask() {
  if (!window.ethereum) {
    return;
  }

  const params = getLsdEthMetamaskParam();

  try {
    window.ethereum
      .request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20', // Initially only supports ERC20, but eventually more!
          options: {
            address: params.tokenAddress, // The address that the token is at.
            symbol: params.tokenSymbol, // A ticker symbol or shorthand, up to 5 chars.
            decimals: params.tokenDecimals, // The number of decimals in the token
            image: params.tokenImage, // A string url of the token logo
          },
        },
      })
      .then((wasAdded: boolean) => {
        if (wasAdded) {
          snackbarUtil.success('Add token success');
        }
      });
  } catch (err: any) {}
}

/**
 * decode BalancesUpdated event log data
 * @param data event data
 * @param topics event topics
 * @returns decoded log values
 */
export function decodeBalancesUpdatedLog(data: string, topics: string[]) {
  const web3 = getEthWeb3();
  const values = web3.eth.abi.decodeLog(
    [
      {
        name: 'block',
        type: 'uint256',
      },
      {
        name: 'totalEth',
        type: 'uint256',
      },
      {
        name: 'lsdTokenSupply',
        type: 'uint256',
      },
      {
        name: 'time',
        type: 'uint256',
      },
    ],
    data,
    topics
  );
  return values;
}
