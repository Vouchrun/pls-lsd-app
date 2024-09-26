// import { w3mConnectors, w3mProvider } from '@web3modal/ethereum';
// import { configureChains, createConfig } from 'wagmi';
// import { getWagmiChainConfig } from './env';

// // 1. Get projectId
// export const walletConnectProjectId = '773e240347e5c760d1cc49e512d0d86c';
// // 2. Configure wagmi client
// const chains = [getWagmiChainConfig()];

// const { publicClient } = configureChains(chains, [
//   w3mProvider({ projectId: walletConnectProjectId }),
// ]);

// export const wagmiConfig = createConfig({
//   autoConnect: false,
//   connectors: [
//     ...w3mConnectors({
//       // version: 2,
//       chains,
//       projectId: walletConnectProjectId,
//     }),
//   ],
//   publicClient,
// });
