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


// Add LP token staking Pools
// lpUrl examples:
// PulseX : https://pulsex.mypinata.cloud/ipfs/bafybeift2yakeymqmjmonkzlx2zyc4tty7clkwvg37suffn5bncjx4e6xq/#/add/V2/0xA1077a294dDE1B09bB078844df40758a5D0f9a27/0x79BB3A0Ee435f957ce4f54eE8c3CFADc7278da0C
// 9Inch : https://9inch.io/add/PLS/0xe0A71ec9A0A5949156E658f754a8af3e95753a19?v2=true&chain=pulse

export const LP_POOLS: LPPoolConfig[] = [
  {
    pid: 3,
    name: 'VOUCH/PLS',  //PulseX v2
    symbol: 'VOUCH-PLS',
    token0Icon: '/images/token/VOUCH.svg', // VOUCH icon
    token1Icon: '/images/token/PLS.svg', // PLS icon
    lpTokenAddress: '0x801C369cB1443c087Cd327DfB53AECf378F6ff85', // TODO: Replace with actual LP token address
    dexUrl: '#', // TODO: Add DEX URL
    lpUrl:
      'https://pulsex.mypinata.cloud/ipfs/bafybeift2yakeymqmjmonkzlx2zyc4tty7clkwvg37suffn5bncjx4e6xq/#/add/V2/PLS/0xD34f5ADC24d8Cc55C1e832Bdf65fFfDF80D1314f', // LP URL
  },
  {
    pid: 4,
    name: 'vPLS/PLS', //PulseX v2
    symbol: 'vPLS-PLS',
    token0Icon: '/images/token/vPLS_trans.svg', // vPLS icon
    token1Icon: '/images/token/PLS.svg', // PLS icon
    lpTokenAddress: '0x46814b3f18d90625b6e166bc2917bb64a635d797', // TODO: Replace with actual LP token address
    dexUrl: '#', // TODO: Add DEX URL
    lpUrl:
      'https://pulsex.mypinata.cloud/ipfs/bafybeift2yakeymqmjmonkzlx2zyc4tty7clkwvg37suffn5bncjx4e6xq/#/add/V2/PLS/0x79BB3A0Ee435f957ce4f54eE8c3CFADc7278da0C', // Add LP URL
  },
  // PCOCK POOL HIDDEN FOR NOW
  // {
  //   pid: 5,
  //   name: 'VOUCH/PCOCK', //PulseX v2
  //   symbol: 'VOUCH/PCOCK',
  //   token0Icon: '/images/token/VOUCH.svg', // VOUCH icon
  //   token1Icon: '/images/token/PCOCK.png', // PLS icon
  //   lpTokenAddress: '0xc19025bb295ad4fe158ba4e322136bbe07b71d3d', // TODO: Replace with actual LP token address
  //   dexUrl: '#', // TODO: Add DEX URL
  //   lpUrl:
  //     'https://pulsex.mypinata.cloud/ipfs/bafybeift2yakeymqmjmonkzlx2zyc4tty7clkwvg37suffn5bncjx4e6xq/#/add/V2/0xD34f5ADC24d8Cc55C1e832Bdf65fFfDF80D1314f/0xc10A4Ed9b4042222d69ff0B374eddd47ed90fC1F', // Add LP URL
  // },
  // Add more LP pools here as needed
  // {
  //   pid: 4,
  //   name: 'VOUCH/PLS', //DEX Pool
  //   symbol: 'VOUCH-PLS',
  //   token0Icon: '/images/token/VOUCH.svg', // VOUCH icon
  //   token1Icon: '/images/token/PLS.svg', // PLS icon
  //   lpTokenAddress: '0x0000000000000000000000000000000000000000',
  //   dexUrl: '#',
  //   lpUrl:
  //     'https://pulsex.mypinata.cloud/ipfs/bafybeift2yakeymqmjmonkzlx2zyc4tty7clkwvg37suffn5bncjx4e6xq/#/add/V2/PLS/0x79BB3A0Ee435f957ce4f54eE8c3CFADc7278da0C', // Add LP URL
  // },
];
