import { useCallback, useEffect, useState } from 'react';
import Web3 from 'web3';
import { getEthWeb3 } from 'utils/web3Utils';
import { useWalletAccount } from './useWalletAccount';
import { useAppSlice } from './selector';
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
const TOKEN_ADDRESSES = {
  VOUCH: '0xD34f5ADC24d8Cc55C1e832Bdf65fFfDF80D1314f', // Need actual VOUCH token address
  VPLS: '0x40EB49C971bCedA8Ea9998256aa7375f6bf05e90', // Need actual VPLS token address
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
    price: '2.62', // Mock price, replace with real price feed
    marketCap: '94.02M', // Mock market cap
    symbol: 'VOUCH',
    name: 'Vouch',
    decimals: 18,
  });

  const [vplsInfo, setVplsInfo] = useState<TokenInfo>({
    totalSupply: '0',
    totalSupplyWei: '0',
    price: '2.62', // Mock price
    marketCap: '94.02M', // Mock market cap
    symbol: 'vPLS',
    name: 'Vouch PLS',
    decimals: 18,
  });

  // Native PLS balance
  const [plsBalance, setPlsBalance] = useState<string>('0');

  // Loading state
  const [loading, setLoading] = useState(false);

  // Get token contract instance
  const getTokenContract = useCallback((tokenAddress: string) => {
    const web3 = getEthWeb3();
    return new web3.eth.Contract(ERC20_ABI, tokenAddress);
  }, []);

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
    async (tokenAddress: string): Promise<TokenInfo> => {
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

        return {
          totalSupply: totalSupplyFormatted,
          totalSupplyWei: totalSupply,
          price: '2.62', // Mock price - integrate with price oracle
          marketCap: '94.02M', // Mock market cap - calculate from price * supply
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
    [getTokenContract]
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
        const contract = getTokenContract(tokenAddress);
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
    [metaMaskAccount, getTokenContract]
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

  // Refresh all token data
  const refreshTokenData = useCallback(async () => {
    if (!metaMaskAccount) return;

    setLoading(true);
    try {
      // Fetch balances if token addresses are available
      if (TOKEN_ADDRESSES.VOUCH && TOKEN_ADDRESSES.VOUCH !== '0x') {
        const vouchBalanceData = await fetchTokenBalance(
          TOKEN_ADDRESSES.VOUCH,
          metaMaskAccount
        );
        setVouchBalance(vouchBalanceData);

        const vouchInfoData = await fetchTokenInfo(TOKEN_ADDRESSES.VOUCH);
        setVouchInfo(vouchInfoData);
      }

      if (TOKEN_ADDRESSES.VPLS && TOKEN_ADDRESSES.VPLS !== '0x') {
        const vplsBalanceData = await fetchTokenBalance(
          TOKEN_ADDRESSES.VPLS,
          metaMaskAccount
        );
        setVplsBalance(vplsBalanceData);

        const vplsInfoData = await fetchTokenInfo(TOKEN_ADDRESSES.VPLS);
        setVplsInfo(vplsInfoData);
      }

      if (TOKEN_ADDRESSES.PLS && TOKEN_ADDRESSES.PLS !== '0x') {
        const wplsBalanceData = await fetchTokenBalance(
          TOKEN_ADDRESSES.PLS,
          metaMaskAccount
        );
        setWplsBalance(wplsBalanceData);
      }

      // Fetch PLS balance
      const plsBalanceData = await fetchPlsBalance(metaMaskAccount);
      setPlsBalance(plsBalanceData);
    } catch (error) {
      console.error('Error refreshing token data:', error);
    } finally {
      setLoading(false);
    }
  }, [metaMaskAccount, fetchTokenBalance, fetchTokenInfo, fetchPlsBalance]);

  // Effect to refresh data when dependencies change
  useEffect(() => {
    refreshTokenData();
  }, [metaMaskAccount]);

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

    // Actions
    approveToken,
    checkAllowance,
    refreshTokenData,

    // Utilities
    getTokenContract,
    TOKEN_ADDRESSES,
  };
}
