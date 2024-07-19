import appConfig from "./appConf/app.json";
import appDevConfig from "./appConf/dev.json";
import appProdConfig from "./appConf/prod.json";
import { getLsdEthTokenContract } from "./contract";

export function isDev() {
  // return false;
  return process.env.NEXT_PUBLIC_ENV !== "production";
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
  if (isDev()) {
    return appDevConfig.rpc;
  }
  return appProdConfig.rpc;
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
      name: "ETH",
      symbol: "ETH",
    },
    rpcUrls: {
      default: {
        http: [getEthereumRpc()],
      },
      public: {
        http: [getEthereumRpc()],
      },
    },
    blockExplorers: {
      etherscan: {
        name: "",
        url: getExplorerUrl(),
      },
      default: {
        name: "",
        url: getExplorerUrl(),
      },
    },
    contracts: {},
    testnet: isDev(),
  };
}
