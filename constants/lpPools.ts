export interface LPPoolConfig {
  pid: number;
  name: string;
  symbol: string;
  token0Icon: string;
  token1Icon: string;
  lpTokenAddress: string;
  dexUrl?: string;
  lpUrl?: string;
}

export const LP_POOLS: LPPoolConfig[] = [
  {
    pid: 3,
    name: 'VOUCH/PLS',
    symbol: 'VOUCH-PLS',
    token0Icon: '/favicon.png', // VOUCH icon
    token1Icon: '/images/token/PLS.svg', // PLS icon
    lpTokenAddress: '0x801C369cB1443c087Cd327DfB53AECf378F6ff85', // TODO: Replace with actual LP token address
    dexUrl: '#', // TODO: Add DEX URL
    lpUrl:
      'https://9inch.io/add/PLS/0xe0A71ec9A0A5949156E658f754a8af3e95753a19?v2=true&chain=pulse', // TODO: Add LP URL
  },
  {
    pid: 4,
    name: 'vPLS/PLS',
    symbol: 'vPLS-PLS',
    token0Icon: '/images/token/vPLS_trans.svg', // vPLS icon
    token1Icon: '/images/token/PLS.svg', // PLS icon
    lpTokenAddress: '0x46814b3f18d90625b6e166bc2917bb64a635d797', // TODO: Replace with actual LP token address
    dexUrl: '#', // TODO: Add DEX URL
    lpUrl:
      'https://9inch.io/add/PLS/0xe0A71ec9A0A5949156E658f754a8af3e95753a19?v2=true&chain=pulse', // TODO: Add LP URL
  },
  // Add more LP pools here as needed
  // {
  //   pid: 4,
  //   name: 'VOUCH/PLS',
  //   symbol: 'VOUCH-PLS',
  //   token0Icon: '/favicon.png',
  //   token1Icon: '/images/chain/pulse.png',
  //   lpTokenAddress: '0x0000000000000000000000000000000000000000',
  //   dexUrl: '#',
  // },
];
