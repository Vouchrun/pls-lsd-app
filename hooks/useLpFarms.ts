import { useCallback, useEffect, useState } from 'react';
import Web3 from 'web3';
import { getEthWeb3, getEthWeb3ForTransactions } from 'utils/web3Utils';
import {
  getVouchStakingContract,
  getVouchStakingContractAbi,
} from 'config/contract';
import { useWalletAccount } from './useWalletAccount';
import { useAppSlice } from './selector';
import { useVouchPrice } from './useVouchPrice';
import { useVplsPrice } from './useVplsPrice';
import { useLpTokenPrice } from './useLpTokenPrice';
import { usePoolApy } from './usePoolApy';
import { AbiItem } from 'web3-utils';
import { LP_POOLS, LPPoolConfig } from 'constants/lpPools';

export interface LPPoolData {
  pid: number;
  config: LPPoolConfig;
  userStaked: string;
  userUnstaking: string;
  availableBalance: string;
  poolInfo: PoolInfo;
  pendingRewards: PendingTripleByPidItem;
  poolApy: string;
  apyBreakdown?: {
    totalApy: number;
    vouchApy: number;
    vplsApy: number;
    plsApy: number;
  };
  lpTokenPrice?: number;
  totalStakedValue?: number;
}

export interface PoolInfo {
  stakingToken: string;
  allocPoint: string;
  lastRewardBlock: string;
  accVouchPerShare: string;
  accVplsPerShare: string;
  accWplsPerShare: string;
  totalStaked: string;
  active: boolean;
}

export interface PendingTripleByPidItem {
  vouchPending: string;
  vplsPending: string;
  wplsPending: string;
}

// Minimal ERC20 ABI for allowance/approve/balance
const ERC20_MINI_ABI: AbiItem[] = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
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
];

export function useLpFarms() {
  const { metaMaskAccount } = useWalletAccount();
  const { updateFlag } = useAppSlice();

  // Get token prices
  const { vouchPrice } = useVouchPrice();
  const { vplsPrice } = useVplsPrice();
  // Assume PLS price is similar to vPLS or fetch from an oracle
  const plsPrice = vplsPrice; // You can replace this with actual PLS price hook

  // State for LP pools data
  const [lpPoolsData, setLpPoolsData] = useState<{ [pid: number]: LPPoolData }>(
    {}
  );

  // Loading states
  const [loading, setLoading] = useState(false);

  // Get contract instance for read operations
  const getContract = useCallback(() => {
    const web3 = getEthWeb3();
    return new web3.eth.Contract(
      getVouchStakingContractAbi(),
      getVouchStakingContract()
    );
  }, []);

  // Get contract instance for transactions
  const getContractForTransactions = useCallback(() => {
    const web3 = getEthWeb3ForTransactions();
    return new web3.eth.Contract(
      getVouchStakingContractAbi(),
      getVouchStakingContract()
    );
  }, []);

  const getErc20Contract = useCallback((tokenAddress: string) => {
    const web3 = getEthWeb3();
    return new web3.eth.Contract(ERC20_MINI_ABI, tokenAddress);
  }, []);

  const getErc20ContractForTransactions = useCallback(
    (tokenAddress: string) => {
      const web3 = getEthWeb3ForTransactions();
      return new web3.eth.Contract(ERC20_MINI_ABI, tokenAddress);
    },
    []
  );

  // Helper function to calculate pool APY
  const calculatePoolApy = useCallback(
    async (
      pid: number,
      totalStakedValue: number,
      poolAllocPoint: number,
      contract: any
    ) => {
      try {
        // Get the LP reward pool address (assuming pid 3+ are LP pools)
        const { getLPRewardPoolContract } = await import('config/contract');
        const rewardPoolAddress = getLPRewardPoolContract();

        // Fetch reward rates from contract
        const rewardRates = await contract.methods
          .getRewardPoolRates(rewardPoolAddress)
          .call();

        const vouchPerYear = parseFloat(
          Web3.utils.fromWei(rewardRates.vouchPerYear, 'ether')
        );
        const vplsPerYear = parseFloat(
          Web3.utils.fromWei(rewardRates.vplsPerYear, 'ether')
        );
        const wplsPerYear = parseFloat(
          Web3.utils.fromWei(rewardRates.wplsPerYear, 'ether')
        );
        const totalAllocPoint = parseFloat(rewardRates.totalAllocPoint_);

        // Calculate pool's share of rewards
        const poolShare =
          totalAllocPoint > 0 ? poolAllocPoint / totalAllocPoint : 0;

        // Calculate annual rewards for this pool
        const poolVouchRewards = vouchPerYear * poolShare;
        const poolVplsRewards = vplsPerYear * poolShare;
        const poolPlsRewards = wplsPerYear * poolShare;

        // Calculate USD value of annual rewards
        const vouchRewardsValue = poolVouchRewards * vouchPrice;
        const vplsRewardsValue = poolVplsRewards * vplsPrice;
        const plsRewardsValue = poolPlsRewards * plsPrice;

        // Calculate APY for each reward token
        const vouchApy =
          totalStakedValue > 0
            ? (vouchRewardsValue / totalStakedValue) * 100
            : 0;
        const vplsApy =
          totalStakedValue > 0
            ? (vplsRewardsValue / totalStakedValue) * 100
            : 0;
        const plsApy =
          totalStakedValue > 0 ? (plsRewardsValue / totalStakedValue) * 100 : 0;

        // Total APY is the sum of individual APYs
        const totalApy = vouchApy + vplsApy + plsApy;

        return {
          totalApy: isNaN(totalApy) ? 0 : totalApy,
          vouchApy: isNaN(vouchApy) ? 0 : vouchApy,
          vplsApy: isNaN(vplsApy) ? 0 : vplsApy,
          plsApy: isNaN(plsApy) ? 0 : plsApy,
        };
      } catch (error) {
        console.error('Error calculating APY:', error);
        return {
          totalApy: 0,
          vouchApy: 0,
          vplsApy: 0,
          plsApy: 0,
        };
      }
    },
    [vouchPrice, vplsPrice, plsPrice]
  );

  // Fetch LP pool data for a specific pid
  const fetchLpPoolData = useCallback(
    async (pool: LPPoolConfig): Promise<LPPoolData | null> => {
      try {
        const contract = getContract();
        const pid = pool.pid;

        // Get pool info
        const poolInfoResult = await contract.methods.getPoolInfo(pid).call();

        let userStaked = '0';
        let userUnstaking = '0';
        let availableBalance = '0';
        let pendingRewards: PendingTripleByPidItem = {
          vouchPending: '0',
          vplsPending: '0',
          wplsPending: '0',
        };

        if (metaMaskAccount) {
          // Get user info
          try {
            const userInfoResult = await contract.methods
              .userInfo(pid, metaMaskAccount)
              .call();
            userStaked = Web3.utils.fromWei(userInfoResult[0] || '0', 'ether');
          } catch (error) {
            console.error(`Error fetching user info for pid ${pid}:`, error);
          }

          // Get user unstaking amount
          try {
            const unstakingResult = await contract.methods
              .totalUnlocking(pid)
              .call();
            userUnstaking = Web3.utils.fromWei(unstakingResult || '0', 'ether');
          } catch (error) {
            console.error(
              `Error fetching unstaking amount for pid ${pid}:`,
              error
            );
          }

          // Get available balance (LP token balance)
          if (
            pool.lpTokenAddress &&
            pool.lpTokenAddress !== '0x0000000000000000000000000000000000000000'
          ) {
            try {
              const lpContract = getErc20Contract(pool.lpTokenAddress);
              const balance = await lpContract.methods
                .balanceOf(metaMaskAccount)
                .call();
              availableBalance = Web3.utils.fromWei(balance || '0', 'ether');
            } catch (error) {
              console.error(
                `Error fetching LP token balance for pid ${pid}:`,
                error
              );
            }
          }

          // Get pending rewards
          try {
            const pendingResult = await contract.methods
              .pendingStandardTriple(pid, metaMaskAccount)
              .call();
            pendingRewards = {
              vouchPending: Web3.utils.fromWei(
                pendingResult.vouchPending || '0',
                'ether'
              ),
              vplsPending: Web3.utils.fromWei(
                pendingResult.vplsPending || '0',
                'ether'
              ),
              wplsPending: Web3.utils.fromWei(
                pendingResult.wplsPending || '0',
                'ether'
              ),
            };
          } catch (error) {
            console.error(
              `Error fetching pending rewards for pid ${pid}:`,
              error
            );
          }
        }

        // Calculate LP token price and APY
        let lpTokenPrice = 0;
        let totalStakedValue = 0;
        let apyData = {
          totalApy: 0,
          vouchApy: 0,
          vplsApy: 0,
          plsApy: 0,
        };

        // Calculate total staked value and APY
        if (poolInfoResult && poolInfoResult.totalStaked) {
          try {
            const totalStakedTokens = parseFloat(
              Web3.utils.fromWei(poolInfoResult.totalStaked, 'ether')
            );

            // Estimate LP token price (simplified)
            // For VOUCH/vPLS pair: average of both token prices as a rough estimate
            // In production, fetch actual reserves for accurate calculation
            lpTokenPrice = vouchPrice + vplsPrice;

            totalStakedValue = totalStakedTokens * lpTokenPrice;

            // Calculate APY if we have meaningful values
            if (totalStakedValue > 0 && vouchPrice > 0 && vplsPrice > 0) {
              const poolAllocPoint = parseFloat(poolInfoResult.allocPoint);
              apyData = await calculatePoolApy(
                pid,
                totalStakedValue,
                poolAllocPoint,
                contract
              );
            }
          } catch (error) {
            console.error(`Error calculating APY for pid ${pid}:`, error);
          }
        }

        return {
          pid,
          config: pool,
          userStaked,
          userUnstaking,
          availableBalance,
          poolInfo: poolInfoResult,
          pendingRewards,
          poolApy: apyData.totalApy.toFixed(2),
          apyBreakdown: apyData,
          lpTokenPrice,
          totalStakedValue,
        };
      } catch (error) {
        console.error(
          `Error fetching LP pool data for pid ${pool.pid}:`,
          error
        );
        return null;
      }
    },
    [
      metaMaskAccount,
      getContract,
      getErc20Contract,
      calculatePoolApy,
      vouchPrice,
      vplsPrice,
    ]
  );

  // Fetch all LP pools data
  const fetchAllLpPoolsData = useCallback(async () => {
    setLoading(true);
    try {
      const poolsData: { [pid: number]: LPPoolData } = {};

      for (const pool of LP_POOLS) {
        const data = await fetchLpPoolData(pool);
        if (data) {
          poolsData[pool.pid] = data;
        }
      }

      setLpPoolsData(poolsData);
    } catch (error) {
      console.error('Error fetching all LP pools data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchLpPoolData]);

  // Stake LP tokens
  const stake = useCallback(
    async (pid: number, amount: string, lpTokenAddress: string) => {
      if (!metaMaskAccount) throw new Error('Wallet not connected');
      setLoading(true);
      try {
        const amountWei = Web3.utils.toWei(amount, 'ether');

        // 1) Ensure allowance of LP token for staking contract
        const spender = getVouchStakingContract();
        const erc20 = getErc20Contract(lpTokenAddress);
        const erc20ForTx = getErc20ContractForTransactions(lpTokenAddress);

        const currentAllowanceWei: string = await erc20.methods
          .allowance(metaMaskAccount, spender)
          .call();

        const isAllowanceEnough = Web3.utils
          .toBN(currentAllowanceWei)
          .gte(Web3.utils.toBN(amountWei));

        if (!isAllowanceEnough) {
          console.log('Approving LP token...');
          const approveGas = await erc20ForTx.methods
            .approve(spender, amountWei)
            .estimateGas({ from: metaMaskAccount });

          await erc20ForTx.methods
            .approve(spender, amountWei)
            .send({ from: metaMaskAccount, gas: Math.floor(approveGas * 1.2) });
        }

        // 2) Perform stake
        console.log('Staking LP tokens...', pid, amountWei);
        const stakingContractForTx = getContractForTransactions();

        const receipt = await stakingContractForTx.methods
          .stake(pid, amountWei)
          .send({ from: metaMaskAccount });

        return receipt;
      } catch (error) {
        console.error('Error staking LP tokens:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [
      metaMaskAccount,
      getErc20Contract,
      getContractForTransactions,
      getErc20ContractForTransactions,
    ]
  );

  // Unstake LP tokens
  const unstake = useCallback(
    async (pid: number, amount: string) => {
      if (!metaMaskAccount) throw new Error('Wallet not connected');

      setLoading(true);
      try {
        const contract = getContractForTransactions();
        const amountWei = Web3.utils.toWei(amount, 'ether');

        const gasEstimate = await contract.methods
          .unstake(pid, amountWei)
          .estimateGas({
            from: metaMaskAccount,
          });

        const result = await contract.methods.unstake(pid, amountWei).send({
          from: metaMaskAccount,
          gas: Math.floor(gasEstimate * 1.2),
        });

        return result;
      } catch (error) {
        console.error('Error unstaking LP tokens:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [metaMaskAccount, getContractForTransactions]
  );

  // Claim rewards from specific LP pool
  const claim = useCallback(
    async (pid: number) => {
      if (!metaMaskAccount) throw new Error('Wallet not connected');

      setLoading(true);
      try {
        const contract = getContractForTransactions();

        const gasEstimate = await contract.methods.claim(pid).estimateGas({
          from: metaMaskAccount,
        });

        const result = await contract.methods.claim(pid).send({
          from: metaMaskAccount,
          gas: Math.floor(gasEstimate * 1.2),
        });

        return result;
      } catch (error) {
        console.error('Error claiming rewards:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [metaMaskAccount, getContractForTransactions]
  );

  // Refresh data
  const refreshData = useCallback(async () => {
    await fetchAllLpPoolsData();
  }, [fetchAllLpPoolsData]);

  // Effect to fetch data when component mounts or dependencies change
  useEffect(() => {
    refreshData();
  }, [metaMaskAccount, updateFlag, refreshData]);

  return {
    // State
    lpPoolsData,
    lpPools: LP_POOLS,
    loading,

    // Actions
    stake,
    unstake,
    claim,
    refreshData,

    // Utilities
    getContract,
    getContractForTransactions,
  };
}
