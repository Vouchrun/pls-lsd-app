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
