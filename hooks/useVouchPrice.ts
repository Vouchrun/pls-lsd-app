import { UseQueryResult, useQuery } from '@tanstack/react-query';

const VOUCH_COINGECKO_ID = 'vouch';
const COINGECKO_API_URL = `https://api.coingecko.com/api/v3/simple/price?ids=${VOUCH_COINGECKO_ID}&vs_currencies=usd`;

export function useVouchPrice() {
  const vouchPriceResult: UseQueryResult<number> = useQuery({
    queryKey: ['GetVouchPrice', COINGECKO_API_URL],
    staleTime: 120000, // 2 minutes
    refetchInterval: 300000, // 5 minutes
    queryFn: async () => {
      try {
        const response = await fetch(COINGECKO_API_URL, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const resJson = await response.json();

        if (resJson && resJson[VOUCH_COINGECKO_ID]) {
          const { usd } = resJson[VOUCH_COINGECKO_ID];
          return usd || 0;
        }

        return 0;
      } catch (err: any) {
        console.error('Error fetching VOUCH price from CoinGecko:', err);
        return 0;
      }
    },
  });

  return {
    vouchPrice: vouchPriceResult.data || 0,
    isLoading: vouchPriceResult.isLoading,
    error: vouchPriceResult.error,
  };
}
