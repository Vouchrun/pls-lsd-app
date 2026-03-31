import { useCallback, useEffect, useState } from 'react';
import Web3 from 'web3';
import { getEthWeb3 } from 'utils/web3Utils';
import { AbiItem } from 'web3-utils';

// Uniswap V2 Pair ABI (minimal - just what we need)
const PAIR_ABI: AbiItem[] = [
  {
    constant: true,
    inputs: [],
    name: 'getReserves',
    outputs: [
      { name: 'reserve0', type: 'uint112' },
      { name: 'reserve1', type: 'uint112' },
      { name: 'blockTimestampLast', type: 'uint32' },
    ],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'token0',
    outputs: [{ name: '', type: 'address' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'token1',
    outputs: [{ name: '', type: 'address' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
];

interface LPTokenPriceData {
  lpTokenPrice: number; // USD value per LP token
  token0Reserve: string;
  token1Reserve: string;
  totalSupply: string;
  tvl: number; // Total Value Locked in USD
}

/**
 * Hook to calculate LP token price
 *
 * For a liquidity pair, the LP token price is calculated as:
 * LP Price = (Total Value of Reserves) / Total LP Supply
 *
 * Where Total Value = (Reserve0 * Token0Price) + (Reserve1 * Token1Price)
 */
export function useLpTokenPrice(
  lpTokenAddress: string,
  token0Price: number = 0, // USD price of token0
  token1Price: number = 0 // USD price of token1
) {
  const [priceData, setPriceData] = useState<LPTokenPriceData>({
    lpTokenPrice: 0,
    token0Reserve: '0',
    token1Reserve: '0',
    totalSupply: '0',
    tvl: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLpTokenPrice = useCallback(async () => {
    if (
      !lpTokenAddress ||
      lpTokenAddress === '0x0000000000000000000000000000000000000000'
    ) {
      setPriceData({
        lpTokenPrice: 0,
        token0Reserve: '0',
        token1Reserve: '0',
        totalSupply: '0',
        tvl: 0,
      });
      return;
    }

    if (token0Price === 0 && token1Price === 0) {
      // Can't calculate price without token prices
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const web3 = getEthWeb3();
      const pairContract = new web3.eth.Contract(PAIR_ABI, lpTokenAddress);

      // Fetch reserves and total supply
      const [reserves, totalSupply] = await Promise.all([
        pairContract.methods.getReserves().call(),
        pairContract.methods.totalSupply().call(),
      ]);

      const reserve0 = Web3.utils.fromWei(reserves.reserve0, 'ether');
      const reserve1 = Web3.utils.fromWei(reserves.reserve1, 'ether');
      const supply = Web3.utils.fromWei(totalSupply, 'ether');

      // Calculate total value locked
      const value0 = parseFloat(reserve0) * token0Price;
      const value1 = parseFloat(reserve1) * token1Price;
      const totalValue = value0 + value1;

      // Calculate LP token price
      const lpPrice =
        parseFloat(supply) > 0 ? totalValue / parseFloat(supply) : 0;

      setPriceData({
        lpTokenPrice: lpPrice,
        token0Reserve: reserve0,
        token1Reserve: reserve1,
        totalSupply: supply,
        tvl: totalValue,
      });
    } catch (err) {
      console.error('Error fetching LP token price:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setPriceData({
        lpTokenPrice: 0,
        token0Reserve: '0',
        token1Reserve: '0',
        totalSupply: '0',
        tvl: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, [lpTokenAddress, token0Price, token1Price]);

  useEffect(() => {
    fetchLpTokenPrice();
  }, [fetchLpTokenPrice]);

  return {
    ...priceData,
    isLoading,
    error,
    refetch: fetchLpTokenPrice,
  };
}
