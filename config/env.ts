import appConfig from './appConf/app.json';
import appDevConfig from './appConf/dev.json';
import appProdConfig from './appConf/prod.json';
import { getLsdEthTokenContract } from './contract';

export function isDev() {
  // return false;
  return process.env.NEXT_PUBLIC_ENV !== 'production';
}

export function getEthereumChainId() {
  if (isDev()) {
    return appDevConfig.chain.id;
  }
  return appProdConfig.chain.id;
}

export function getEthereumChainName() {
  if (isDev()) {
    return appDevConfig.chain.name;
  }
  return appProdConfig.chain.name;
}

export function getEthereumRpc() {
  const rpcConfig = isDev() ? appDevConfig.rpc : appProdConfig.rpc;
  // Handle both string and array formats for backward compatibility
  if (Array.isArray(rpcConfig)) {
    return rpcConfig[0]; // Return first RPC as default
  }
  return rpcConfig;
}

/**
 * Get all available RPC URLs as an array
 * @param customRpc Optional custom RPC URL to prioritize (will be placed first)
 */
export function getAllRpcUrls(customRpc?: string | null): string[] {
  const rpcConfig = isDev() ? appDevConfig.rpc : appProdConfig.rpc;
  // Handle both string and array formats
  let rpcs: string[] = [];
  if (Array.isArray(rpcConfig)) {
    rpcs = rpcConfig;
  } else {
    rpcs = [rpcConfig];
  }
  
  // If custom RPC is provided, place it first (highest priority)
  if (customRpc) {
    return [customRpc, ...rpcs];
  }
  
  return rpcs;
}

/**
 * Get RPC URL at specific index
 * @param index Index of the RPC to retrieve
 * @param customRpc Optional custom RPC URL to include in the list
 */
export function getRpcAtIndex(index: number, customRpc?: string | null): string {
  const rpcs = getAllRpcUrls(customRpc);
  return rpcs[index % rpcs.length]; // Use modulo to wrap around
}

/**
 * Basic URL sanity check for a user-supplied RPC endpoint
 */
export function isValidRpcUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return (
      parsedUrl.protocol === 'http:' ||
      parsedUrl.protocol === 'https:' ||
      parsedUrl.protocol === 'ws:' ||
      parsedUrl.protocol === 'wss:'
    );
  } catch {
    return false;
  }
}

/**
 * Test whether an RPC endpoint answers an eth_blockNumber request
 */
export async function testRpcHealth(rpcUrl: string): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return false;
    }

    const body = await response.json();
    return !!body && typeof body.result === 'string';
  } catch (error) {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Validate a custom RPC (format + connectivity) before it is persisted.
 * Prevents a typo or an unreachable endpoint from being saved as the app RPC.
 */
export async function validateCustomRpc(rpcUrl: string): Promise<boolean> {
  if (!isValidRpcUrl(rpcUrl)) {
    return false;
  }
  return await testRpcHealth(rpcUrl);
}

export function getExplorerUrl() {
  if (isDev()) {
    return appDevConfig.explorer;
  }
  return appProdConfig.explorer;
}

export function getLsdEthMetamaskParam() {
  return {
    tokenAddress: getLsdEthTokenContract(),
    tokenSymbol: appConfig.token.lsdTokenName,
    tokenDecimals: 18,
    tokenImage: appConfig.token.lsdTokenIconUri,
  };
}

export function getBlockSeconds() {
  if (isDev()) {
    return appDevConfig.blockSeconds;
  }
  return appProdConfig.blockSeconds;
}

export function getWagmiChainConfig() {
  return {
    id: getEthereumChainId(),
    name: getEthereumChainName(),
    network: getEthereumChainName(),
    nativeCurrency: {
      decimals: 18,
      name: 'ETH',
      symbol: 'ETH',
    },
    rpcUrls: {
      default: {
        http: getAllRpcUrls(),
      },
      public: {
        http: getAllRpcUrls(),
      },
    },
    blockExplorers: {
      etherscan: {
        name: '',
        url: getExplorerUrl(),
      },
      default: {
        name: '',
        url: getExplorerUrl(),
      },
    },
    contracts: {},
    testnet: isDev(),
  };
}

export function getNetworkBalanceContractDeploymentBlock() {
  if (isDev()) {
    return appDevConfig.networkBalanceContractDeploymentBlock;
  }
  return appProdConfig.networkBalanceContractDeploymentBlock;
}
