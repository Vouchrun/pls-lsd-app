import { useCallback, useEffect, useState } from 'react';
import Web3 from 'web3';
import { getEthWeb3, getEthWeb3ForTransactions } from 'utils/web3Utils';
import {
  getCapitalPoolFactoryContract,
  getCapitalPoolFactoryContractAbi,
  getCapitalPoolContractAbi,
  getVouchStakingContract,
  getVouchStakingContractAbi,
} from 'config/contract';
import { useWalletAccount } from './useWalletAccount';
import { useAppSlice } from './selector';
import { TOKEN_ADDRESSES } from './useVouchTokens';
import { AbiItem } from 'web3-utils';

export interface CapitalPoolStats {
  totalShares: string;
  totalVplsDeposited: string;
  scrapedVplsPending: string;
  plsPendingDistribution: string;
  lastMintRatio: string;
  currentMintRatio: string;
  plsMintBuffer: string;
}

export interface CapitalPoolUserPosition {
  userShares: string;
  vplsValue: string;
  plsValue: string;
}

export interface CapitalPoolUnlockInfo {
  shares: string;
  vplsAmount: string;
  startTime: string;
  unlockTime: string;
  isReady: boolean;
}

export interface CapitalPoolPendingRewards {
  vouchPending: string;
  vplsPending: string;
  wplsPending: string;
}

export interface CapitalPoolData {
  address: string;
  active: boolean;
  unlockPeriodDays: number;
  stats: CapitalPoolStats;
  userPosition: CapitalPoolUserPosition;
  unlockInfo: CapitalPoolUnlockInfo;
  pendingRewards: CapitalPoolPendingRewards;
  vouchStakingPid: number | null;
}

export function useCapitalPools() {
  const { metaMaskAccount } = useWalletAccount();
  const { updateFlag } = useAppSlice();

  const [capitalPools, setCapitalPools] = useState<CapitalPoolData[]>([]);
  const [loading, setLoading] = useState(false);

  // Get factory contract instance for read operations
  const getFactoryContract = useCallback(() => {
    const web3 = getEthWeb3();
    return new web3.eth.Contract(
      getCapitalPoolFactoryContractAbi(),
      getCapitalPoolFactoryContract()
    );
  }, []);

  // Get capital pool contract instance for read operations
  const getPoolContract = useCallback((poolAddress: string) => {
    const web3 = getEthWeb3();
    return new web3.eth.Contract(
      getCapitalPoolContractAbi() as AbiItem[],
      poolAddress
    );
  }, []);

  // Get capital pool contract instance for transactions
  const getPoolContractForTransactions = useCallback((poolAddress: string) => {
    const web3 = getEthWeb3ForTransactions();
    return new web3.eth.Contract(
      getCapitalPoolContractAbi() as AbiItem[],
      poolAddress
    );
  }, []);

  // Get VouchStaking contract instance
  const getVouchStakingContractInstance = useCallback(() => {
    const web3 = getEthWeb3();
    return new web3.eth.Contract(
      getVouchStakingContractAbi(),
      getVouchStakingContract()
    );
  }, []);

  // Get VouchStaking contract instance for transactions
  const getVouchStakingContractForTransactions = useCallback(() => {
    const web3 = getEthWeb3ForTransactions();
    return new web3.eth.Contract(
      getVouchStakingContractAbi(),
      getVouchStakingContract()
    );
  }, []);

  // Minimal ERC20 ABI for allowance/approve
  const ERC20_MINI_ABI: AbiItem[] = [
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

  const getErc20Contract = useCallback((tokenAddress: string) => {
    const web3 = getEthWeb3();
    return new web3.eth.Contract(ERC20_MINI_ABI, tokenAddress);
  }, []);

  const getErc20ContractForTransactions = useCallback(
    (tokenAddress: string) => {
      const web3 = getEthWeb3ForTransactions();
      if (
        !tokenAddress ||
        tokenAddress === '0x0000000000000000000000000000000000000000'
      ) {
        throw new Error('Invalid token address');
      }
      return new web3.eth.Contract(ERC20_MINI_ABI, tokenAddress);
    },
    []
  );

  // Fetch all capital pools with their data
  const fetchCapitalPools = useCallback(async () => {
    try {
      setLoading(true);
      const factory = getFactoryContract();
      const vouchStaking = getVouchStakingContractInstance();

      // Get all pool addresses from factory
      const poolAddresses: string[] = await factory.methods
        .getAllPools()
        .call();

      
      if (poolAddresses.length === 0) {
        setCapitalPools([]);
        return;
      }

      // Get total pools from VouchStaking to map capital pools to PIDs
      const totalPools = await vouchStaking.methods.totalPools().call();

      // Create a map of capital pool addresses to their VouchStaking PIDs
      const capitalPoolToPidMap: { [address: string]: number } = {};

      for (let pid = 1; pid <= Number(totalPools); pid++) {
        try {
          const poolInfo = await vouchStaking.methods.getPoolInfo(pid).call();
          // poolType 2 = Capital Pool
          if (Number(poolInfo.poolType) === 2) {
            const stakingToken = poolInfo.stakingToken.toLowerCase();
            capitalPoolToPidMap[stakingToken] = pid;
          }
        } catch (error) {
          console.error(`Error fetching pool info for pid ${pid}:`, error);
        }
      }

      // Fetch data for each capital pool
      const poolsData = await Promise.all(
        poolAddresses.map(async (poolAddress) => {
          try {
            const pool = getPoolContract(poolAddress);

            const [active, stats, unlockPeriod] = await Promise.all([
              pool.methods.active().call(),
              pool.methods.getPoolStats().call(),
              pool.methods.unlockPeriod().call(),
            ]);

            // User-specific data (only if wallet is connected)
            let userPosition: CapitalPoolUserPosition = {
              userShares: '0',
              vplsValue: '0',
              plsValue: '0',
            };
            let unlockInfo: CapitalPoolUnlockInfo = {
              shares: '0',
              vplsAmount: '0',
              startTime: '0',
              unlockTime: '0',
              isReady: false,
            };
            let pendingRewards: CapitalPoolPendingRewards = {
              vouchPending: '0',
              vplsPending: '0',
              wplsPending: '0',
            };

            if (metaMaskAccount) {
              const [positionResult, unlockResult] = await Promise.all([
                pool.methods.getUserPositionRealtime(metaMaskAccount).call(),
                pool.methods.getUnlock(metaMaskAccount).call(),
              ]);

              userPosition = {
                userShares: Web3.utils.fromWei(
                  positionResult.userShares || '0',
                  'ether'
                ),
                vplsValue: Web3.utils.fromWei(
                  positionResult.vplsValue || '0',
                  'ether'
                ),
                plsValue: Web3.utils.fromWei(
                  positionResult.plsValue || '0',
                  'ether'
                ),
              };

              unlockInfo = {
                shares: Web3.utils.fromWei(unlockResult.shares_ || '0', 'ether'),
                vplsAmount: Web3.utils.fromWei(
                  unlockResult.vplsAmount_ || '0',
                  'ether'
                ),
                startTime: unlockResult.startTime_?.toString() || '0',
                unlockTime: unlockResult.unlockTime_?.toString() || '0',
                isReady: unlockResult.isReady_ || false,
              };

              // Get pending emissions from VouchStaking if we have a mapped PID
              const pid =
                capitalPoolToPidMap[poolAddress.toLowerCase()] || null;
              if (pid !== null) {
                try {
                  const pendingResult = await vouchStaking.methods
                    .pendingLiquidityRewardsProjected(pid, metaMaskAccount)
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
                    `Error fetching pending rewards for capital pool ${poolAddress}:`,
                    error
                  );
                }
              }
            }

            const poolData: CapitalPoolData = {
              address: poolAddress,
              active: active || false,
              unlockPeriodDays: Math.ceil(
                Number(unlockPeriod) / (24 * 60 * 60)
              ),
              stats: {
                totalShares: Web3.utils.fromWei(
                  stats.totalShares || '0',
                  'ether'
                ),
                totalVplsDeposited: Web3.utils.fromWei(
                  stats.totalVplsDeposited || '0',
                  'ether'
                ),
                scrapedVplsPending: Web3.utils.fromWei(
                  stats.scrapedVplsPending || '0',
                  'ether'
                ),
                plsPendingDistribution: Web3.utils.fromWei(
                  stats.plsPendingDistribution || '0',
                  'ether'
                ),
                lastMintRatio: stats.lastMintRatio?.toString() || '0',
                currentMintRatio: stats.currentMintRatio?.toString() || '0',
                plsMintBuffer: Web3.utils.fromWei(
                  stats.plsMintBuffer || '0',
                  'ether'
                ),
              },
              userPosition,
              unlockInfo,
              pendingRewards,
              vouchStakingPid:
                capitalPoolToPidMap[poolAddress.toLowerCase()] || null,
            };

            return poolData;
          } catch (error) {
            console.error(
              `Error fetching data for capital pool ${poolAddress}:`,
              error
            );
            return null;
          }
        })
      );

      // Filter out any null results from errors
      const validPools = poolsData.filter(
        (pool): pool is CapitalPoolData => pool !== null
      );
      setCapitalPools(validPools);
    } catch (error) {
      console.error('Error fetching capital pools:', error);
      setCapitalPools([]);
    } finally {
      setLoading(false);
    }
  }, [
    metaMaskAccount,
    getFactoryContract,
    getPoolContract,
    getVouchStakingContractInstance,
  ]);

  // Check vPLS allowance for capital pool deposit
  const checkVplsAllowance = useCallback(
    async (poolAddress: string, amount: string) => {
      if (!metaMaskAccount) return false;
      try {
        const amountWei = Web3.utils.toWei(amount, 'ether');
        const vplsToken = TOKEN_ADDRESSES.VPLS;
        const erc20 = getErc20Contract(vplsToken);

        const currentAllowanceWei: string = await erc20.methods
          .allowance(metaMaskAccount, poolAddress)
          .call();

        const isAllowanceEnough = Web3.utils
          .toBN(currentAllowanceWei)
          .gte(Web3.utils.toBN(amountWei));

        return isAllowanceEnough;
      } catch (error) {
        console.error('Error checking vPLS allowance:', error);
        return false;
      }
    },
    [metaMaskAccount, getErc20Contract]
  );

  // Approve vPLS for capital pool deposit
  const approveVpls = useCallback(
    async (poolAddress: string, amount: string) => {
      if (!metaMaskAccount) {
        throw new Error('Wallet not connected');
      }

      if (!Web3.utils.isAddress(metaMaskAccount)) {
        throw new Error(`Invalid Ethereum address: ${metaMaskAccount}`);
      }

      setLoading(true);
      try {
        const amountWei = Web3.utils.toWei(amount, 'ether');
        const vplsToken = TOKEN_ADDRESSES.VPLS;

        if (!Web3.utils.isAddress(poolAddress)) {
          throw new Error(`Invalid capital pool address: ${poolAddress}`);
        }

        if (!Web3.utils.isAddress(vplsToken)) {
          throw new Error(`Invalid vPLS token address: ${vplsToken}`);
        }

        const erc20ForTx = getErc20ContractForTransactions(vplsToken);

        let gasEstimate;
        try {
          gasEstimate = await erc20ForTx.methods
            .approve(poolAddress, amountWei)
            .estimateGas({ from: metaMaskAccount });
        } catch (estimateError: any) {
          console.error('Gas estimation error:', estimateError);
          gasEstimate = 100000;
        }

        const receipt = await erc20ForTx.methods
          .approve(poolAddress, amountWei)
          .send({
            from: metaMaskAccount,
            gas: Math.floor(Number(gasEstimate) * 1.2),
          });

        return receipt;
      } catch (error: any) {
        console.error('Error approving vPLS:', error);
        if (error.message && error.message.includes('Invalid parameters')) {
          throw new Error(
            'Failed to approve vPLS. Please ensure your wallet is properly connected and try again.'
          );
        }
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [metaMaskAccount, getErc20ContractForTransactions]
  );

  // Deposit vPLS into capital pool
  const depositVpls = useCallback(
    async (poolAddress: string, amount: string) => {
      if (!metaMaskAccount) throw new Error('Wallet not connected');
      setLoading(true);
      try {
        const amountWei = Web3.utils.toWei(amount, 'ether');
        const pool = getPoolContractForTransactions(poolAddress);

        const gasEstimate = await pool.methods
          .depositVpls(amountWei)
          .estimateGas({
            from: metaMaskAccount,
          });

        const receipt = await pool.methods.depositVpls(amountWei).send({
          from: metaMaskAccount,
          gas: Math.floor(Number(gasEstimate) * 1.2),
        });

        return receipt;
      } catch (error) {
        console.error('Error depositing vPLS:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [metaMaskAccount, getPoolContractForTransactions]
  );

  // Deposit PLS into capital pool (native token)
  const depositPls = useCallback(
    async (poolAddress: string, amount: string) => {
      if (!metaMaskAccount) throw new Error('Wallet not connected');
      setLoading(true);
      try {
        const amountWei = Web3.utils.toWei(amount, 'ether');
        const pool = getPoolContractForTransactions(poolAddress);

        const gasEstimate = await pool.methods.depositPls().estimateGas({
          from: metaMaskAccount,
          value: amountWei,
        });

        const receipt = await pool.methods.depositPls().send({
          from: metaMaskAccount,
          value: amountWei,
          gas: Math.floor(Number(gasEstimate) * 1.2),
        });

        return receipt;
      } catch (error) {
        console.error('Error depositing PLS:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [metaMaskAccount, getPoolContractForTransactions]
  );

  // Start unlock for capital pool
  const startUnlock = useCallback(
    async (poolAddress: string, shares: string) => {
      if (!metaMaskAccount) throw new Error('Wallet not connected');
      setLoading(true);
      try {
        const sharesWei = Web3.utils.toWei(shares, 'ether');
        const pool = getPoolContractForTransactions(poolAddress);

        const gasEstimate = await pool.methods
          .startUnlock(sharesWei)
          .estimateGas({
            from: metaMaskAccount,
          });

        const receipt = await pool.methods.startUnlock(sharesWei).send({
          from: metaMaskAccount,
          gas: Math.floor(Number(gasEstimate) * 1.2),
        });

        return receipt;
      } catch (error) {
        console.error('Error starting unlock:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [metaMaskAccount, getPoolContractForTransactions]
  );

  // Cancel unlock for capital pool
  const cancelUnlock = useCallback(
    async (poolAddress: string) => {
      if (!metaMaskAccount) throw new Error('Wallet not connected');
      setLoading(true);
      try {
        const pool = getPoolContractForTransactions(poolAddress);

        const gasEstimate = await pool.methods.cancelUnlock().estimateGas({
          from: metaMaskAccount,
        });

        const receipt = await pool.methods.cancelUnlock().send({
          from: metaMaskAccount,
          gas: Math.floor(Number(gasEstimate) * 1.2),
        });

        return receipt;
      } catch (error) {
        console.error('Error canceling unlock:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [metaMaskAccount, getPoolContractForTransactions]
  );

  // Finalize unlock for capital pool
  const finalizeUnlock = useCallback(
    async (poolAddress: string) => {
      if (!metaMaskAccount) throw new Error('Wallet not connected');
      setLoading(true);
      try {
        const pool = getPoolContractForTransactions(poolAddress);

        const gasEstimate = await pool.methods.finalizeUnlock().estimateGas({
          from: metaMaskAccount,
        });

        const receipt = await pool.methods.finalizeUnlock().send({
          from: metaMaskAccount,
          gas: Math.floor(Number(gasEstimate) * 1.2),
        });

        return receipt;
      } catch (error) {
        console.error('Error finalizing unlock:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [metaMaskAccount, getPoolContractForTransactions]
  );

  // Claim emissions from VouchStaking for a capital pool
  const claimEmissions = useCallback(
    async (pid: number) => {
      if (!metaMaskAccount) throw new Error('Wallet not connected');
      setLoading(true);
      try {
        const vouchStaking = getVouchStakingContractForTransactions();

        const gasEstimate = await vouchStaking.methods.claim(pid).estimateGas({
          from: metaMaskAccount,
        });

        const receipt = await vouchStaking.methods.claim(pid).send({
          from: metaMaskAccount,
          gas: Math.floor(Number(gasEstimate) * 1.2),
        });

        return receipt;
      } catch (error) {
        console.error('Error claiming emissions:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [metaMaskAccount, getVouchStakingContractForTransactions]
  );

  // Refresh all data
  const refreshData = useCallback(async () => {
    await fetchCapitalPools();
  }, [fetchCapitalPools]);

  // Effect to fetch data when component mounts or dependencies change
  useEffect(() => {
    fetchCapitalPools();
  }, [metaMaskAccount, updateFlag, fetchCapitalPools]);

  return {
    capitalPools,
    loading,
    checkVplsAllowance,
    approveVpls,
    depositVpls,
    depositPls,
    startUnlock,
    cancelUnlock,
    finalizeUnlock,
    claimEmissions,
    refreshData,
  };
}
