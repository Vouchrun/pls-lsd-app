import { useCallback, useEffect, useState } from 'react';
import Web3 from 'web3';
import { getEthWeb3, getEthWeb3ForTransactions } from 'utils/web3Utils';
import { useWalletAccount } from './useWalletAccount';
import { useAppSlice } from './selector';
import { useVplsPrice } from './useVplsPrice';
import { useVouchPrice } from './useVouchPrice';
import { AbiItem } from 'web3-utils';

// Standard ERC20 ABI for balance and basic info
const ERC20_ABI: AbiItem[] = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
];

// Token addresses (you may need to update these)
export const TOKEN_ADDRESSES = {
  VOUCH: '0xD34f5ADC24d8Cc55C1e832Bdf65fFfDF80D1314f', // Need actual VOUCH token address
  VPLS: '0x79bb3a0ee435f957ce4f54ee8c3cfadc7278da0c', // Need actual VPLS token address
  PLS: '0xA1077a294dDE1B09bB078844df40758a5D0f9a27', // Need actual PLS token address
};

export interface TokenBalance {
  balance: string;
  balanceWei: string;
  symbol: string;
  name: string;
  decimals: number;
}

export interface TokenInfo {
  totalSupply: string;
  totalSupplyWei: string;
  price: string; // USD price
  marketCap: string;
  symbol: string;
  name: string;
  decimals: number;
}

export function useVouchTokens() {
  const { metaMaskAccount } = useWalletAccount();
  const { updateFlag } = useAppSlice();
  const { vplsPrice, isLoading: vplsPriceLoading } = useVplsPrice();
  const { vouchPrice, isLoading: vouchPriceLoading } = useVouchPrice();

  // Token balances
  const [vouchBalance, setVouchBalance] = useState<TokenBalance>({
    balance: '0',
    balanceWei: '0',
    symbol: 'VOUCH',
    name: 'Vouch',
    decimals: 18,
  });

  const [vplsBalance, setVplsBalance] = useState<TokenBalance>({
    balance: '0',
    balanceWei: '0',
    symbol: 'vPLS',
    name: 'Vouch PLS',
    decimals: 18,
  });

  const [wplsBalance, setWplsBalance] = useState<TokenBalance>({
    balance: '0',
    balanceWei: '0',
    symbol: 'WPLS',
    name: 'Wrapped PLS',
    decimals: 18,
  });

  // Token info
  const [vouchInfo, setVouchInfo] = useState<TokenInfo>({
    totalSupply: '0',
    totalSupplyWei: '0',
    price: '0', // Will be updated with real price
    marketCap: '0', // Will be calculated from price * supply
    symbol: 'VOUCH',
    name: 'Vouch',
    decimals: 18,
  });

  const [vplsInfo, setVplsInfo] = useState<TokenInfo>({
    totalSupply: '0',
    totalSupplyWei: '0',
    price: '0', // Will be updated with real price
    marketCap: '0', // Will be calculated from price * supply
    symbol: 'vPLS',
    name: 'Vouch PLS',
    decimals: 18,
  });

  // Native PLS balance
  const [plsBalance, setPlsBalance] = useState<string>('0');

  // Loading state
  const [loading, setLoading] = useState(false);

  // Utility function to format market cap
  const formatMarketCap = useCallback(
    (price: number, totalSupply: string): string => {
      if (price === 0 || totalSupply === '0') return '0';

      const marketCapValue = price * parseFloat(totalSupply);

      if (marketCapValue >= 1e9) {
        return `${(marketCapValue / 1e9).toFixed(2)}B`;
      } else if (marketCapValue >= 1e6) {
        return `${(marketCapValue / 1e6).toFixed(2)}M`;
      } else if (marketCapValue >= 1e3) {
        return `${(marketCapValue / 1e3).toFixed(2)}K`;
      } else {
        return marketCapValue.toFixed(2);
      }
    },
    []
  );

  // Get token contract instance for read operations
  const getTokenContract = useCallback((tokenAddress: string) => {
    const web3 = getEthWeb3();
    return new web3.eth.Contract(ERC20_ABI, tokenAddress);
  }, []);

  // Get token contract instance for transactions
  const getTokenContractForTransactions = useCallback(
    (tokenAddress: string) => {
      const web3 = getEthWeb3ForTransactions();
      return new web3.eth.Contract(ERC20_ABI, tokenAddress);
    },
    []
  );

  // Fetch token balance
  const fetchTokenBalance = useCallback(
    async (
      tokenAddress: string,
      userAddress: string
    ): Promise<TokenBalance> => {
      try {
        const contract = getTokenContract(tokenAddress);
        const web3 = getEthWeb3();

        const [balance, symbol, name, decimals] = await Promise.all([
          contract.methods.balanceOf(userAddress).call(),
          contract.methods.symbol().call(),
          contract.methods.name().call(),
          contract.methods.decimals().call(),
        ]);

        const decimalsNum = Number(decimals);
        const balanceFormatted = Web3.utils.fromWei(
          balance,
          decimalsNum === 18 ? 'ether' : 'wei'
        );

        return {
          balance: balanceFormatted,
          balanceWei: balance,
          symbol,
          name,
          decimals: decimalsNum,
        };
      } catch (error) {
        console.error(
          `Error fetching token balance for ${tokenAddress}:`,
          error
        );
        return {
          balance: '0',
          balanceWei: '0',
          symbol: 'Unknown',
          name: 'Unknown',
          decimals: 18,
        };
      }
    },
    [getTokenContract]
  );

  // Fetch token info
  const fetchTokenInfo = useCallback(
    async (
      tokenAddress: string,
      tokenType: 'vpls' | 'vouch' | 'other' = 'other'
    ): Promise<TokenInfo> => {
      try {
        const contract = getTokenContract(tokenAddress);

        const [totalSupply, symbol, name, decimals] = await Promise.all([
          contract.methods.totalSupply().call(),
          contract.methods.symbol().call(),
          contract.methods.name().call(),
          contract.methods.decimals().call(),
        ]);

        const decimalsNum = Number(decimals);
        const totalSupplyFormatted = Web3.utils.fromWei(
          totalSupply,
          decimalsNum === 18 ? 'ether' : 'wei'
        );

        // Use real price for VPLS and VOUCH, mock price for other tokens
        let price: string;
        let marketCap: string;

        if (tokenType === 'vpls') {
          price = vplsPrice.toString();
          marketCap = formatMarketCap(vplsPrice, totalSupplyFormatted);
        } else if (tokenType === 'vouch') {
          price = vouchPrice.toString();
          marketCap = formatMarketCap(vouchPrice, totalSupplyFormatted);
        } else {
          price = '2.62';
          marketCap = '94.02M';
        }

        return {
          totalSupply: totalSupplyFormatted,
          totalSupplyWei: totalSupply,
          price,
          marketCap,
          symbol,
          name,
          decimals: decimalsNum,
        };
      } catch (error) {
        console.error(`Error fetching token info for ${tokenAddress}:`, error);
        return {
          totalSupply: '0',
          totalSupplyWei: '0',
          price: '0',
          marketCap: '0',
          symbol: 'Unknown',
          name: 'Unknown',
          decimals: 18,
        };
      }
    },
    [getTokenContract, vplsPrice, vouchPrice, formatMarketCap]
  );

  // Fetch PLS balance
  const fetchPlsBalance = useCallback(async (userAddress: string) => {
    try {
      const web3 = getEthWeb3();
      const balance = await web3.eth.getBalance(userAddress);
      return Web3.utils.fromWei(balance, 'ether');
    } catch (error) {
      console.error('Error fetching PLS balance:', error);
      return '0';
    }
  }, []);

  // Approve token spending
  const approveToken = useCallback(
    async (tokenAddress: string, spenderAddress: string, amount: string) => {
      if (!metaMaskAccount) throw new Error('Wallet not connected');

      setLoading(true);
      try {
        const contract = getTokenContractForTransactions(tokenAddress);
        const amountWei = Web3.utils.toWei(amount, 'ether');

        const gasEstimate = await contract.methods
          .approve(spenderAddress, amountWei)
          .estimateGas({
            from: metaMaskAccount,
          });

        const result = await contract.methods
          .approve(spenderAddress, amountWei)
          .send({
            from: metaMaskAccount,
            gas: Math.floor(gasEstimate * 1.2),
          });

        return result;
      } catch (error) {
        console.error('Error approving token:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [metaMaskAccount, getTokenContractForTransactions]
  );

  // Check token allowance
  const checkAllowance = useCallback(
    async (
      tokenAddress: string,
      ownerAddress: string,
      spenderAddress: string
    ) => {
      try {
        const contract = getTokenContract(tokenAddress);
        const allowance = await contract.methods
          .allowance(ownerAddress, spenderAddress)
          .call();
        return Web3.utils.fromWei(allowance, 'ether');
      } catch (error) {
        console.error('Error checking allowance:', error);
        return '0';
      }
    },
    [getTokenContract]
  );

  // Refresh token info (totalSupply, price, marketCap) - no wallet required
  const refreshTokenInfo = useCallback(async () => {
    setLoading(true);
    try {
      if (TOKEN_ADDRESSES.VOUCH && TOKEN_ADDRESSES.VOUCH !== '0x') {
        const vouchInfoData = await fetchTokenInfo(
          TOKEN_ADDRESSES.VOUCH,
          'vouch'
        );
        setVouchInfo(vouchInfoData);
      }

      if (TOKEN_ADDRESSES.VPLS && TOKEN_ADDRESSES.VPLS !== '0x') {
        const vplsInfoData = await fetchTokenInfo(TOKEN_ADDRESSES.VPLS, 'vpls');
        setVplsInfo(vplsInfoData);
      }
    } catch (error) {
      console.error('Error refreshing token info:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchTokenInfo]);

  // Refresh user balances - wallet required
  const refreshTokenBalances = useCallback(async () => {
    if (!metaMaskAccount) return;

    setLoading(true);
    try {
      if (TOKEN_ADDRESSES.VOUCH && TOKEN_ADDRESSES.VOUCH !== '0x') {
        const vouchBalanceData = await fetchTokenBalance(
          TOKEN_ADDRESSES.VOUCH,
          metaMaskAccount
        );
        setVouchBalance(vouchBalanceData);
      }

      if (TOKEN_ADDRESSES.VPLS && TOKEN_ADDRESSES.VPLS !== '0x') {
        const vplsBalanceData = await fetchTokenBalance(
          TOKEN_ADDRESSES.VPLS,
          metaMaskAccount
        );
        setVplsBalance(vplsBalanceData);
      }

      if (TOKEN_ADDRESSES.PLS && TOKEN_ADDRESSES.PLS !== '0x') {
        const wplsBalanceData = await fetchTokenBalance(
          TOKEN_ADDRESSES.PLS,
          metaMaskAccount
        );
        setWplsBalance(wplsBalanceData);
      }

      const plsBalanceData = await fetchPlsBalance(metaMaskAccount);
      setPlsBalance(plsBalanceData);
    } catch (error) {
      console.error('Error refreshing token balances:', error);
    } finally {
      setLoading(false);
    }
  }, [metaMaskAccount, fetchTokenBalance, fetchPlsBalance]);

  // Refresh all token data (balances + info)
  const refreshTokenData = useCallback(async () => {
    await refreshTokenInfo();
    if (metaMaskAccount) {
      await refreshTokenBalances();
    }
  }, [refreshTokenInfo, refreshTokenBalances, metaMaskAccount]);

  // Effect to refresh token info on mount (no wallet required)
  useEffect(() => {
    refreshTokenInfo();
  }, [refreshTokenInfo]);

  // Effect to refresh user balances when wallet connects
  useEffect(() => {
    if (metaMaskAccount) {
      refreshTokenBalances();
    }
  }, [metaMaskAccount, refreshTokenBalances]);

  // Effect to update VPLS info when price changes
  useEffect(() => {
    if (vplsInfo.totalSupply !== '0' && vplsPrice > 0) {
      setVplsInfo((prev) => ({
        ...prev,
        price: vplsPrice.toString(),
        marketCap: formatMarketCap(vplsPrice, prev.totalSupply),
      }));
    }
  }, [vplsPrice, vplsInfo.totalSupply, formatMarketCap]);

  // Effect to update VOUCH info when price changes
  useEffect(() => {
    if (vouchInfo.totalSupply !== '0' && vouchPrice > 0) {
      setVouchInfo((prev) => ({
        ...prev,
        price: vouchPrice.toString(),
        marketCap: formatMarketCap(vouchPrice, prev.totalSupply),
      }));
    }
  }, [vouchPrice, vouchInfo.totalSupply, formatMarketCap]);

  return {
    // Balances
    vouchBalance,
    vplsBalance,
    wplsBalance,
    plsBalance,

    // Token info
    vouchInfo,
    vplsInfo,

    // Loading state
    loading,
    tokensLoading: loading || vplsPriceLoading || vouchPriceLoading,

    // Actions
    approveToken,
    checkAllowance,
    refreshTokenData,

    // Utilities
    getTokenContract,
    getTokenContractForTransactions,
    TOKEN_ADDRESSES,
  };
}
