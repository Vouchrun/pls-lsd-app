import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Tooltip from '@mui/material/Tooltip';
import { CapitalPoolData } from 'hooks/useCapitalPools';
import { useWalletAccount } from 'hooks/useWalletAccount';
import { useVouchTokens } from 'hooks/useVouchTokens';
import { formatNumber } from 'utils/numberUtils';
import { CustomButton } from '../common/CustomButton';
import { CustomNumberInput } from '../common/CustomNumberInput';
import { Icomoon } from '../icon/Icomoon';
import classNames from 'classnames';
import snackbarUtil from 'utils/snackbarUtils';
import { useAppSlice } from 'hooks/selector';
import { usePoolApy } from 'hooks/usePoolApy';
import { useApr } from 'hooks/useApr';
import { useVplsPrice } from 'hooks/useVplsPrice';
import { useVouchPrice } from 'hooks/useVouchPrice';
import { usePrice } from 'hooks/usePrice';
import { getEthWeb3 } from 'utils/web3Utils';
import { getVouchStakingContract, getVouchStakingContractAbi, getStakingRewardPoolContract, getCapitalPoolContractAbi } from 'config/contract';

interface CapitalPoolCardProps {
  poolData: CapitalPoolData;
  checkVplsAllowance: (poolAddress: string, amount: string) => Promise<boolean>;
  onApproveVpls: (poolAddress: string, amount: string) => Promise<any>;
  onDepositVpls: (poolAddress: string, amount: string) => Promise<any>;
  onDepositPls: (poolAddress: string, amount: string) => Promise<any>;
  onStartUnlock: (poolAddress: string, shares: string) => Promise<any>;
  onCancelUnlock: (poolAddress: string) => Promise<any>;
  onFinalizeUnlock: (poolAddress: string) => Promise<any>;
  onClaimEmissions: (pid: number) => Promise<any>;
  refreshData: () => Promise<void>;
}

export const CapitalPoolCard: React.FC<CapitalPoolCardProps> = ({
  poolData,
  checkVplsAllowance,
  onApproveVpls,
  onDepositVpls,
  onDepositPls,
  onStartUnlock,
  onCancelUnlock,
  onFinalizeUnlock,
  onClaimEmissions,
  refreshData,
}) => {
  const { darkMode } = useAppSlice();
  const { metaMaskAccount } = useWalletAccount();
  const { vplsBalance, plsBalance, vplsInfo, loading: tokensLoading } = useVouchTokens();
  const { apr: systemApr7Day } = useApr();
  const { vplsPrice } = useVplsPrice();
  const { vouchPrice } = useVouchPrice();
  const { ethPrice: plsPrice } = usePrice();
  
  const [poolAllocPoint, setPoolAllocPoint] = useState<number>(0);
  const [totalAllocPoint, setTotalAllocPoint] = useState<number>(0);
  const [yieldScrapeBps, setYieldScrapeBps] = useState<number>(0);

  const [selectedTab, setSelectedTab] = useState<'stake' | 'unstake'>('stake');
  const [depositType, setDepositType] = useState<'vpls' | 'pls'>('vpls');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isApproveProcessing, setIsApproveProcessing] = useState(false);
  const [isClaimProcessing, setIsClaimProcessing] = useState(false);
  const [isUnlockProcessing, setIsUnlockProcessing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [needsApproval, setNeedsApproval] = useState(false);

  // Check if there's an active unlock
  const hasActiveUnlock = useMemo(() => {
    return Number(poolData.unlockInfo.shares) > 0;
  }, [poolData.unlockInfo.shares]);

  // Update countdown timer
  useEffect(() => {
    if (!hasActiveUnlock) {
      setTimeRemaining('');
      return;
    }

    const updateTimer = () => {
      const unlockAtTimestamp = Number(poolData.unlockInfo.unlockTime);
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const seconds = unlockAtTimestamp - currentTimestamp;

      if (seconds <= 0) {
        setTimeRemaining('Ready to finalize');
        return;
      }

      const days = Math.floor(seconds / (24 * 60 * 60));
      const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
      const minutes = Math.floor((seconds % (60 * 60)) / 60);
      const secs = seconds % 60;

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${secs}s`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${secs}s`);
      } else {
        setTimeRemaining(`${secs}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [hasActiveUnlock, poolData.unlockInfo.unlockTime]);

  const maxAmount = useMemo(() => {
    if (selectedTab === 'stake') {
      return depositType === 'vpls'
        ? vplsBalance.balance || '0'
        : plsBalance || '0';
    } else {
      return poolData.userPosition.userShares || '0';
    }
  }, [
    selectedTab,
    depositType,
    vplsBalance.balance,
    plsBalance,
    poolData.userPosition.userShares,
  ]);

  const isValidAmount = useMemo(() => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return false;
    }
    return Number(amount) <= Number(maxAmount);
  }, [amount, maxAmount]);

  // Fetch pool allocation point, total allocation points, and yield scrape BPS
  useEffect(() => {
    const fetchPoolData = async () => {
      if (!poolData.vouchStakingPid) {
        setPoolAllocPoint(0);
        setTotalAllocPoint(0);
        setYieldScrapeBps(0);
        return;
      }

      try {
        const web3 = getEthWeb3();
        const vouchStakingContract = new web3.eth.Contract(
          getVouchStakingContractAbi(),
          getVouchStakingContract()
        );
        
        // Fetch pool info to get pool's allocation point
        const poolInfo = await vouchStakingContract.methods.getPoolInfo(poolData.vouchStakingPid).call();
        setPoolAllocPoint(Number(poolInfo.allocPoint) || 0);
        
        // Fetch total allocation points from staking reward pool (capital pools use staking reward pool)
        const stakingRewardPool = getStakingRewardPoolContract();
        const rewardRates = await vouchStakingContract.methods
          .getRewardPoolRates(stakingRewardPool)
          .call();
        setTotalAllocPoint(parseFloat(rewardRates.totalAllocPoint_) || 0);

        // Fetch yield scrape BPS from capital pool contract
        const capitalPoolContract = new web3.eth.Contract(
          getCapitalPoolContractAbi(),
          poolData.address
        );
        const bps = await capitalPoolContract.methods.yieldScrapeBps().call();
        setYieldScrapeBps(Number(bps) || 0);
      } catch (error) {
        console.error('Error fetching pool data:', error);
        setPoolAllocPoint(0);
        setTotalAllocPoint(0);
        setYieldScrapeBps(0);
      }
    };

    fetchPoolData();
  }, [poolData.vouchStakingPid, poolData.address]);

  // Calculate total staked value in USD (excluding scraped pending – not earning)
  const totalStakedValue = useMemo(() => {
    const totalVpls = Number(poolData.stats.totalVplsDeposited) || 0;
    const scrapedPending = Number(poolData.stats.scrapedVplsPending) || 0;
    const effectiveVpls = Math.max(0, totalVpls - scrapedPending);
    return effectiveVpls * vplsPrice;
  }, [poolData.stats.totalVplsDeposited, poolData.stats.scrapedVplsPending, vplsPrice]);

  // Calculate pool rate percentage (yield scraping rate) from BPS
  // BPS (basis points): 10000 BPS = 100%, so divide by 100 to get percentage
  const poolRate = useMemo(() => {
    return yieldScrapeBps / 100;
  }, [yieldScrapeBps]);

  // Calculate stakers share: 100% - yield scraping rate
  const stakersShare = useMemo(() => {
    return Math.max(0, 100 - poolRate);
  }, [poolRate]);

  // Yield APR = system APR (7-day avg) / pool rate
  const yieldApr = useMemo(() => {
    if (systemApr7Day == null || poolRate <= 0) return undefined;
    return systemApr7Day * (100-poolRate) /100;
  }, [systemApr7Day, poolRate]);

  // Calculate USD value of staked PLS
  const stakedPlsUsdValue = useMemo(() => {
    const plsAmount = Number(poolData.userPosition.plsValue) || 0;
    return plsAmount * (plsPrice || 0);
  }, [poolData.userPosition.plsValue, plsPrice]);

  // Calculate APY using the hook
  const apyData = usePoolApy(
    poolData.vouchStakingPid || 0,
    totalStakedValue,
    poolAllocPoint,
    false, // Capital pools are not liquidity pools
    vouchPrice,
    vplsPrice,
    plsPrice || 0
  );

  // Calculate pool statistics for the progress bar (based on total supply)
  const poolStats = useMemo(() => {
    const stakedRaw = Number(poolData.stats.totalVplsDeposited) || 0;
    const scrapedPending = Number(poolData.stats.scrapedVplsPending) || 0;
    const staked = Math.max(0, stakedRaw - scrapedPending);
    const unstaking = Number(poolData.stats.totalUnlocking) || 0;
    const totalSupply = tokensLoading 
      ? 0 
      : Number(vplsInfo.totalSupply) || 0;

    // Bar segments as percentage of total supply (sum to 100%)
    const unstakingPercentage = totalSupply > 0 ? (unstaking / totalSupply) * 100 : 0;
    const stakedPercentage = totalSupply > 0 ? (staked / totalSupply) * 100 : 0;
    const otherSupply = Math.max(0, totalSupply - staked - unstaking);
    const otherPercentage = totalSupply > 0 ? (otherSupply / totalSupply) * 100 : 0;

    return {
      staked,
      unstaking,
      totalSupply,
      otherSupply,
      unstakingPercentage,
      stakedPercentage,
      otherPercentage,
    };
  }, [
    poolData.stats.totalVplsDeposited,
    poolData.stats.totalUnlocking,
    vplsInfo.totalSupply,
    tokensLoading,
  ]);

  // Check approval when amount changes (only for vPLS deposits)
  useEffect(() => {
    const checkApproval = async () => {
      if (
        selectedTab === 'stake' &&
        depositType === 'vpls' &&
        amount &&
        isValidAmount &&
        metaMaskAccount
      ) {
        const hasAllowance = await checkVplsAllowance(poolData.address, amount);
        setNeedsApproval(!hasAllowance);
      } else {
        setNeedsApproval(false);
      }
    };
    checkApproval();
  }, [
    amount,
    isValidAmount,
    selectedTab,
    depositType,
    metaMaskAccount,
    poolData.address,
    checkVplsAllowance,
  ]);

  const handleMax = useCallback(() => {
    if (Number(maxAmount) > 0) {
      setAmount(maxAmount);
    }
  }, [maxAmount]);

  const handleApprove = useCallback(async () => {
    if (!metaMaskAccount || !amount || !isValidAmount) return;

    setIsApproveProcessing(true);
    try {
      snackbarUtil.info('Approval in progress...');
      await onApproveVpls(poolData.address, amount);
      snackbarUtil.success('Approval successful!');
      setNeedsApproval(false);
    } catch (error: any) {
      console.error('Approval error:', error);
      snackbarUtil.error(error?.message || 'Approval failed');
    } finally {
      setIsApproveProcessing(false);
    }
  }, [metaMaskAccount, amount, isValidAmount, poolData.address, onApproveVpls]);

  const handleDeposit = useCallback(async () => {
    if (!metaMaskAccount || !amount || !isValidAmount) return;

    setIsProcessing(true);
    try {
      snackbarUtil.info('Deposit in progress...');
      if (depositType === 'vpls') {
        await onDepositVpls(poolData.address, amount);
      } else {
        await onDepositPls(poolData.address, amount);
      }
      snackbarUtil.success('Deposit successful!');
      setAmount('');
      await refreshData();
    } catch (error: any) {
      console.error('Deposit error:', error);
      snackbarUtil.error(error?.message || 'Deposit failed');
    } finally {
      setIsProcessing(false);
    }
  }, [
    metaMaskAccount,
    amount,
    isValidAmount,
    depositType,
    poolData.address,
    onDepositVpls,
    onDepositPls,
    refreshData,
  ]);

  const handleUnstake = useCallback(async () => {
    if (!metaMaskAccount || !amount || !isValidAmount) return;

    setIsProcessing(true);
    try {
      snackbarUtil.info('Unstaking in progress...');
      await onStartUnlock(poolData.address, amount);
      snackbarUtil.success('Unstaking initiated!');
      setAmount('');
      await refreshData();
    } catch (error: any) {
      console.error('Unstaking error:', error);
      snackbarUtil.error(error?.message || 'Unstaking failed');
    } finally {
      setIsProcessing(false);
    }
  }, [metaMaskAccount, amount, isValidAmount, poolData.address, onStartUnlock, refreshData]);

  const handleClaim = useCallback(async () => {
    if (!metaMaskAccount || poolData.vouchStakingPid === null) return;

    setIsClaimProcessing(true);
    try {
      snackbarUtil.info('Claiming rewards...');
      await onClaimEmissions(poolData.vouchStakingPid);
      snackbarUtil.success('Rewards claimed successfully!');
      await refreshData();
    } catch (error: any) {
      console.error('Claiming error:', error);
      snackbarUtil.error(error?.message || 'Claim failed');
    } finally {
      setIsClaimProcessing(false);
    }
  }, [metaMaskAccount, poolData.vouchStakingPid, onClaimEmissions, refreshData]);

  const handleCancelUnlock = useCallback(async () => {
    if (!metaMaskAccount) return;

    setIsUnlockProcessing(true);
    try {
      snackbarUtil.info('Canceling unstake...');
      await onCancelUnlock(poolData.address);
      snackbarUtil.success('Unstake canceled!');
      await refreshData();
    } catch (error: any) {
      console.error('Cancel unlock error:', error);
      snackbarUtil.error(error?.message || 'Cancel failed');
    } finally {
      setIsUnlockProcessing(false);
    }
  }, [metaMaskAccount, poolData.address, onCancelUnlock, refreshData]);

  const handleFinalizeUnlock = useCallback(async () => {
    if (!metaMaskAccount) return;

    setIsUnlockProcessing(true);
    try {
      snackbarUtil.info('Finalizing unstake...');
      await onFinalizeUnlock(poolData.address);
      snackbarUtil.success('Unstake finalized!');
      await refreshData();
    } catch (error: any) {
      console.error('Finalize unlock error:', error);
      snackbarUtil.error(error?.message || 'Finalize failed');
    } finally {
      setIsUnlockProcessing(false);
    }
  }, [metaMaskAccount, poolData.address, onFinalizeUnlock, refreshData]);

  return (
    <div className=''>
      <div className='flex justify-between'>
        {/* Header with badge and title */}
        <div className='flex items-center'>
          <div className='w-[66px] h-[66px] mr-[16px]'>
            <img src='/images/token/vPLS_trans.svg' alt='icon' />
          </div>
          <div>
            <p className='text-[18px] font-normal text-color-text1 flex mb-[10px]'>
              vPLS{' '}  <img src='/images/pls_ic.svg' alt='icon' className='ml-[6px]' />
              <span className='ml-[10px] px-[10px] py-[2px] pr-[5px] bg-[#FE8A3C] text-[#000] text-[15px] font-normal rounded-[10px] flex gap-[8px]'>
                Capital Pool
                <Tooltip title="In return for stakers giving up a portion of their PLS Yield (at the Pool Rate), Capital Pools stakers get larger VOUCH, vPLS and PLS rewards." placement="top" arrow>
                  <span>
                    <Icomoon icon='tip' size='.12rem' color='#000' />
                  </span>
                </Tooltip>
              </span>
            </p>
            <p className='text-[13px] font-normal text-text2/50 dark:text-text2Dark/50 mt-[3px]'>
              Stake vPLS to receive Rewards.
            </p>
          </div>
        </div>

        {/* Balance Section */}
        <div className='flex justify-between mt-[5px]'>
          <div className='flex flex-col items-end'>
            <p className='text-[15px] font-normal text-color-text1 mb-[6px] '>
              Available Balance
            </p>
            <p className='text-[18px] max-sm:text-[18px] font-normal text-[#A6A6A6]'>
              <span className=' mr-[3px] text-[18px] text-color-text1'>
                {selectedTab === 'stake'
                  ? formatNumber(vplsBalance.balance, { decimals: 2 })
                  : formatNumber(poolData.userPosition.userShares, { decimals: 2 })}
              </span>
              {selectedTab === 'stake'
                ? depositType === 'vpls'
                  ? 'vPLS'
                  : 'PLS'
                : 'vPLS'}
            </p>
           {selectedTab === 'stake' && <p className='text-[18px] max-sm:text-[18px] font-normal text-color-text1 mt-[6px]'>
              {formatNumber(plsBalance || '0', { decimals: 2 })}
              <span className=' ml-[3px] text-[18px] text-[#A6A6A6]'>PLS</span>
            </p>}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className='border-color-border1 border rounded-[8px] my-[37px] relative p-l[8px]'>
        <div className='grid grid-cols-3 gap-4 py-[18px]'>
          {/* Pool Column */}
          <div className='flex flex-col items-center'>
            <p className='text-[14px] font-medium text-[#8E9397] mb-[7px] text-center'>
              Pool Rate  
              <Tooltip title="The percentage of PLS yield retained by the capital pool." placement="top" arrow>
                <span>
                  <Icomoon icon='tip' size='.12rem' color='#333333' />
                </span>
              </Tooltip>
            </p>
            <p className='text-[16px] font-normal text-[#A6A6A6] mb-[7px] text-center'>
              <span className='text-color-text1 mr-[3px]'>
                {formatNumber(poolRate, { decimals: 2 })}
              </span>
              %
            </p>
            <p className='text-[13px] font-medium text-[#A6A6A6] mb-[7px] text-center'>
              Stakers  Share
            </p>
            <p className='text-[16px] font-normal text-[#A6A6A6] mb-[7px] text-center'>
              <span className='text-color-text1 mr-[3px]'>
                {formatNumber(stakersShare, { decimals: 2 })}
              </span>
              %
            </p>
          </div>

          {/* Staked Column */}
          <div className='flex flex-col items-start'>
            <p className='text-[14px] font-medium text-[#8E9397] mb-[7px] text-center'>
              Staked 
              <Tooltip title="Your total staked balance, in Capital Pools PLS amount will Increase but vPLS amount will decrease over time." placement="top" arrow>
                <span>
                  <Icomoon icon='tip' size='.12rem' color='#333333' />
                </span>
              </Tooltip>
            </p>
            <p className='text-[16px] font-normal text-[#A6A6A6] mb-[7px] text-center whitespace-nowrap'>
              <span className='text-color-text1 mr-[3px]'>
                {formatNumber(poolData.userPosition.plsValue, { decimals: 2 })}
              </span>
              <span className='text-[#A6A6A6]'>PLS</span>
              <span className='font-normal text-[#A6A6A6] text-[13px] ml-[10px]'>
                (${formatNumber(stakedPlsUsdValue, { decimals: 2 })})
              </span>
            </p>
            <p className='text-[16px] font-normal text-color-text1 mb-[7px] whitespace-nowrap'>
              {formatNumber(poolData.userPosition.vplsValue, { decimals: 2 })} <span className='text-[#A6A6A6]'>vPLS (equivalent) </span>
            </p>
          </div>

          {/* Unstaking Column */}
          <div className='flex flex-col items-center'>
            <p className='text-[14px] font-medium text-[#8E9397] mb-[7px] text-center'>
              Unstaking 
              <Tooltip title="Tokens in unlocking period." placement="top" arrow>
                <span>
                 <Icomoon icon='tip' size='.12rem' color='#333333' />
                </span>
              </Tooltip>
            </p>
            <p className='text-[16px] font-normal text-color-text1 mb-[7px] text-center'>
              {formatNumber(poolData.stats.totalUnlocking, { decimals: 2 })} <span className='text-[#A6A6A6]'>vPLS</span>
            </p>
            <p className='text-[13px] font-normal text-[#A6A6A6] mb-[7px] text-center'>
              ${formatNumber(Number(poolData.stats.totalUnlocking) * vplsPrice, { decimals: 2 })}
            </p>
          </div>
        </div>

        <div className='flex mx-auto text-center flex-col relative top-[25px]'>
          <p className='text-[13px] font-medium text-[#FF8533] gap-1'>
            Vouch BOOST Capital Pool 
            <Tooltip 
                title={
                  <div className="leading-relaxed">
                    <div className="mb-1">The BOOST Pool redirects harvested PLS back into the Vouch ecosystem.</div>
                    <div className="mb-1">This means more community validators created and positive price pressure on VOUCH token.</div>
                    <div>Higher the Pool Allocation, means more rewards for that pool.</div>
                  </div>
                }  placement="top" arrow
                slotProps={{
                  tooltip: {
                    sx: {
                      opacity: 1,
                      backgroundColor: '#1A1A1A',
                    },
                  },
                  arrow: {
                    sx: { color: '#1A1A1A' },
                  },
                }}
                >
              <span>
                <Icomoon icon='tip' size='.12rem' color='#333333' />
              </span>
             </Tooltip>
          </p>
          <p className='text-[13px] font-normal text-[#8E9397]'> Allocation <span className='text-color-text1'>{poolAllocPoint > 0 ? formatNumber(poolAllocPoint, { decimals: 0 }) : '...'}</span></p>
        </div>

        {/* Rewards and Pool Info Section */}
        <div className='grid grid-flow-col grid-rows-1 max-sm:grid-rows-2 gap-4 max-sm:gap-2 mt-[20px] pt-[20px]'>
          <div>
            <p className='text-[14px] font-medium text-[#8E9397] mb-[13px] text-center relative z-[1]'>
              Staking Rewards
            </p>
            <div className='flex max-w-[160px] justify-between mx-auto mt-[20px] mb-[8px]'>
              <p className='text-[18px] font-normal text-color-text1 text-center'>
                {formatNumber(poolData.pendingRewards.vplsPending, { decimals: 2 })}
              </p>
              <p className='text-[18px] font-normal text-[#A6A6A6] text-center'>vPLS</p>
            </div>
            <div className='flex max-w-[160px] justify-between mx-auto mb-[8px]'>
              <p className='text-[18px] font-normal text-color-text1 text-center'>
                {formatNumber(poolData.pendingRewards.vouchPending, { decimals: 2 })}
              </p>
              <p className='text-[18px] font-normal text-[#A6A6A6] text-center'>
                VOUCH
              </p>
            </div>
            <div className='flex max-w-[160px] justify-between mx-auto mb-[10px]'>
              <p className='text-[18px] font-normal text-color-text1 text-center'>
                {formatNumber(poolData.pendingRewards.wplsPending, { decimals: 2 })}
              </p>
              <p className='text-[18px] font-normal text-[#A6A6A6] text-center'>PLS</p>
            </div>
          </div>
<div>
  <p className='text-[13px] font-medium text-[#8E9397] mb-[13px] text-center relative z-[1]'> Holder APY </p>
  
  <div className='flex justify-center'>
    <div className='grid grid-cols-2 gap-x-2 gap-y-1'>
      {/* Row 1 */}
      <p className='text-[14px] font-normal text-color-text1 text-right'>
        {yieldApr !== undefined ? `${formatNumber(yieldApr, { decimals: 2 })}%` : '...'}
      </p>
      <p className='text-[14px] font-normal text-[#A6A6A6] whitespace-nowrap inline-flex items-center'>
        Yield APR
        <Tooltip title="System APR (7-day) x Staker Share %." placement="top" arrow>
          <span className='inline-flex'>
            <Icomoon icon='tip' size='.12rem' color='#333333' />
          </span>
        </Tooltip>
      </p>
      
      {/* Row 2 */}
      <p className='text-[14px] font-normal text-color-text1 text-right'>
        {apyData.isCalculating ? '...' : `${formatNumber(apyData.totalApy, { decimals: 2 })}%`}
      </p>
      <p className='text-[14px] font-normal text-[#A6A6A6] whitespace-nowrap inline-flex items-center'>
        Pool APY
        <Tooltip title="Staking Rewards APY" placement="top" arrow>
          <span className='inline-flex'>
            <Icomoon icon='tip' size='.12rem' color='#333333' />
          </span>
        </Tooltip>
      </p>
    </div>
  </div>
</div>

          {/* <div>
            <p className='text-[13px] font-medium text-[#8E9397] mb-[13px] text-center relative z-[1]'>
              Pool Info
            </p>
            <div className='flex max-w-[160px] justify-between mx-auto mt-[20px] mb-[8px]'>
              <p className='text-[14px] font-normal text-color-text1 text-center'>
                Total Staked:
              </p>
              <p className='text-[14px] font-normal text-[#A6A6A6] text-center'>
                {formatNumber(poolData.stats.totalVplsDeposited, { decimals: 2 })}
              </p>
            </div>
            <div className='flex max-w-[160px] justify-between mx-auto mb-[10px]'>
              <p className='text-[14px] font-normal text-color-text1 text-center'>
                Unlock Period:
              </p>
              <p className='text-[14px] font-normal text-[#A6A6A6] text-center'>
                {poolData.unlockPeriodDays} days
              </p>
            </div>
          </div> */}
          <div className='bg-[#cdcccc] dark:bg-[#333] h-[1px] w-[140px] absolute top-[49%]'></div>
          <div className='bg-[#cdcccc] dark:bg-[#333] h-[1px] w-[140px] absolute right-0 top-[49%]'></div>
        </div>
      </div>

      {/* Staking Interface */}
      <div className='bg-color-bg2 rounded-[.3rem] pb-[.14rem] border-[.01rem] border-color-border1'>
        {/* Tab Headers */}
        <div
          className='h-[.56rem] grid items-stretch'
          style={{ gridTemplateColumns: '50% 50%' }}
        >
          <div
            className={classNames(
              'cursor-pointer flex items-center justify-center rounded-tl-[.3rem] text-[.16rem] text-color-text1 border-[0.01rem]',
              selectedTab === 'stake'
                ? 'font-[700] border-[#ff4400]/30 bg-gradient-to-r from-[#ff8533] to-[#ffa162]'
                : 'border-color-border1 bg-[#E2E0D0] dark:bg-[#333333]'
            )}
            onClick={() => setSelectedTab('stake')}
          >
            Stake vPLS/PLS
          </div>
          <div
            className={classNames(
              'cursor-pointer flex items-center justify-center rounded-tr-[.3rem] text-[.16rem] text-color-text1 border-[0.01rem]',
              selectedTab === 'unstake'
                ? 'font-[700] border-[#ff4400]/30 bg-gradient-to-r from-[#ff8533] to-[#ffa162]'
                : 'border-color-border1 bg-[#E2E0D0] dark:bg-[#333333]'
            )}
            onClick={() => setSelectedTab('unstake')}
          >
            Unstake vPLS
          </div>
        </div>


        {/* Cooldown Message */}
        { !hasActiveUnlock && (
          <div className='mx-[.24rem] mt-[.16rem] p-[.12rem] bg-[#f0f0f0] dark:bg-[#2a2a2a] border border-[#d0d0d0] dark:border-[#444444] rounded-[.12rem] flex items-center'>
            <div className='mr-[.08rem] text-[#6c86ad] dark:text-[#8fa4c7]'>
              <svg width='16' height='16' viewBox='0 0 16 16' fill='currentColor'>
                <path d='M8 0C3.584 0 0 3.584 0 8s3.584 8 8 8 8-3.584 8-8S12.416 0 8 0zm1 12H7V7h2v5zm0-6H7V4h2v2z' />
              </svg>
            </div>
            <div className='text-[.12rem] text-[#666666] dark:text-[#aaaaaa] leading-[1.4]'>
              Staked tokens have a{' '}
              <span className='font-semibold'>
                {poolData.unlockPeriodDays} day
                {poolData.unlockPeriodDays !== 1 ? 's' : ''}
              </span>{' '}
              cool down period to unstake. During this period unstaked tokens will
              not accrue staking rewards.
            </div>
          </div>
        )}

        {/* Active Unlock Status */}
        {hasActiveUnlock && (
          <div className='mx-[.24rem] mt-[.16rem] p-[.12rem] bg-[#fff3cd] dark:bg-[#3d3410] border border-[#ffc107] dark:border-[#664d03] rounded-[.12rem]'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center'>
                <div className='mr-[.08rem] text-[#856404] dark:text-[#ffecb5]'>
                  <svg width='16' height='16' viewBox='0 0 16 16' fill='currentColor'>
                    <path d='M8 0C3.584 0 0 3.584 0 8s3.584 8 8 8 8-3.584 8-8S12.416 0 8 0zm1 12H7V7h2v5zm0-6H7V4h2v2z' />
                  </svg>
                </div>
                <div>
                  <div className='text-[.12rem] font-semibold text-[#856404] dark:text-[#ffecb5]'>
                    Active Unstake in Progress
                  </div>
                  <div className='text-[.11rem] text-[#856404] dark:text-[#ffecb5] mt-[.04rem]'>
                    Amount: {formatNumber(poolData.unlockInfo.vplsAmount, { decimals: 4 })}{' '}
                    vPLS
                  </div>
                </div>
              </div>
              <div className='text-right'>
                <div className='text-[.11rem] text-[#856404] dark:text-[#ffecb5]'>
                  {poolData.unlockInfo.isReady ? (
                    <span className='font-semibold text-green-600 dark:text-green-400'>
                      Ready!
                    </span>
                  ) : (
                    <>
                      Time Remaining:{' '}
                      <span className='font-semibold'>{timeRemaining}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Amount Input */}
        <div className='mt-[.18rem] pt-[.24rem] mx-[.24rem] bg-[#edece3] dark:bg-[#111111] rounded-[.3rem]'>
          <div className='mx-[.12rem] flex items-start'>
            <div className='flex-1 flex justify-start flex-col pl-[.14rem]'>
              <div className='flex items-center h-[.42rem]'>
                <CustomNumberInput
                  value={amount}
                  handleValueChange={setAmount}
                  fontSize='.24rem'
                  placeholder='Amount'
                />
                <div className='flex flex-col items-center relative top-[25px]'>
                  {selectedTab === 'stake' && (
                    <select 
                      className='gef_selct bg-[#1A1A1A] border border-[#6C86AD80] outline-none h-[36px] w-[100px] justify-center text-center rounded-[30px]'
                      value={depositType}
                      onChange={(e) => setDepositType(e.target.value as 'vpls' | 'pls')}
                    >
                      <option value='vpls'>vPLS</option>
                      <option value='pls'>PLS</option>
                    </select>
                  )}
                  {selectedTab === 'unstake' && (
                    <select 
                      className='gef_selct bg-[#1A1A1A] border border-[#6C86AD80] outline-none h-[36px] w-[100px] justify-center text-center rounded-[30px]'
                      value={depositType}
                      onChange={(e) => setDepositType(e.target.value as 'vpls' | 'pls')}
                    >
                      <option value='vpls'>vPLS</option>
                    </select>
                  )}
                    
                  <CustomButton
                    // type='stroke'
                    // width='.63rem'
                    // height='.36rem'
                    // fontSize='.16rem'
                    className='text-[14px] max_btn'
                    onClick={handleMax}
                  // border='0.01rem solid #6C86AD80'
                  >
                    Max
                  </CustomButton>
                </div>
              </div>

              {/* Balance Info */}
              <div className='mt-[.22rem] text-[.14rem]'>
                <div className='grid grid-cols-2 gap-0'>
                  <div></div>
                  <div className='text-color-text2 mt-[7px] mb-[14px]'>
                    Balance: {formatNumber(maxAmount, { decimals: 2 })}{' '}
                    {selectedTab === 'stake'
                      ? depositType === 'vpls'
                        ? 'vPLS'
                        : 'PLS'
                      : 'vPLS (Staked)'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='mt-[20px] flex justify-center gap-4 mb-[20px]'>
          {/* First button - Deposit/Unstake/Approve */}
          {selectedTab === 'stake' && depositType === 'vpls' && needsApproval ? (
            <button
              onClick={handleApprove}
              disabled={
                !metaMaskAccount ||
                isApproveProcessing ||
                !amount ||
                !isValidAmount
              }
              className='h-[45px] w-[160px] bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:from-[#2563eb] hover:to-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-[50px] transition-all duration-200'
            >
              {isApproveProcessing ? 'Approving...' : 'Approve vPLS'}
            </button>
          ) : (
            <button
              onClick={selectedTab === 'stake' ? handleDeposit : handleUnstake}
              disabled={
                !metaMaskAccount ||
                isProcessing ||
                !amount ||
                !isValidAmount ||
                (selectedTab === 'stake' && depositType === 'vpls' && needsApproval)
              }
              className='h-[45px] w-[160px] bg-gradient-to-r from-[#ff8533] to-[#ffa162] hover:from-[#ff7520] hover:to-[#ff9550] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-[50px] transition-all duration-200'
            >
              {isProcessing
                ? selectedTab === 'stake'
                  ? 'Depositing...'
                  : 'Unstaking...'
                : selectedTab === 'stake'
                  ? `Stake ${depositType.toUpperCase()}`
                  : 'Unstake'}
            </button>
          )}

          {/* Dynamic second button based on tab and unlock state */}
          {selectedTab === 'stake' ? (
            <button
              onClick={handleClaim}
              disabled={
                !metaMaskAccount ||
                isClaimProcessing ||
                poolData.vouchStakingPid === null
              }
              className='h-[45px] w-[160px] bg-gradient-to-r from-[#ff8533] to-[#ffa162] hover:from-[#ff7520] hover:to-[#ff9550] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-[50px] transition-all duration-200'
            >
              {isClaimProcessing ? 'Claiming...' : 'Claim Rewards'}
            </button>
          ) : hasActiveUnlock ? (
            poolData.unlockInfo.isReady ? (
              <button
                onClick={handleFinalizeUnlock}
                disabled={!metaMaskAccount || isUnlockProcessing}
                className='h-[45px] w-[160px] bg-gradient-to-r from-[#28a745] to-[#20c997] hover:from-[#218838] hover:to-[#1aa179] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-[50px] transition-all duration-200'
              >
                {isUnlockProcessing ? 'Processing...' : 'Claim Unstake'}
              </button>
            ) : (
              <button
                onClick={handleCancelUnlock}
                disabled={!metaMaskAccount || isUnlockProcessing}
                className='h-[45px] w-[160px] bg-gradient-to-r from-[#dc3545] to-[#c82333] hover:from-[#c82333] hover:to-[#bd2130] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-[50px] transition-all duration-200'
              >
                {isUnlockProcessing ? 'Processing...' : 'Cancel Unstake'}
              </button>
            )
          ) : (
            <button
              onClick={handleClaim}
              disabled={
                !metaMaskAccount ||
                isClaimProcessing ||
                poolData.vouchStakingPid === null
              }
              className='h-[45px] w-[160px] bg-gradient-to-r from-[#ff8533] to-[#ffa162] hover:from-[#ff7520] hover:to-[#ff9550] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-[50px] transition-all duration-200'
            >
              {isClaimProcessing ? 'Claiming...' : 'Claim Rewards'}
            </button>
          )}
        </div>
      </div>

      {/* Price and Market Cap Section */}
      <div className='px-[30px]'>
        <div className='mt-[37px] flex justify-between mb-[20px]'>
          <div>
            <p className='text-[13px] font-normal text-[#A6A6A6] mb-[8px]'>VPLS Price</p>
            <p className='text-[23px] font-normal text-color-text1'>
              ${tokensLoading ? '...' : vplsInfo.price}
            </p>
            <p className='text-[#A6A6A6] text-[13px] mt-[3px]'>
              VPLS Token Supply:{' '}
              {tokensLoading
                ? '...'
                : formatNumber(vplsInfo.totalSupply, { decimals: 2 })}
            </p>
          </div>
          <div>
            <p className='text-[13px] font-normal text-[#A6A6A6]'>Market Cap</p>
            <p className='text-[23px] font-normal text-color-text1 mt-[9px]'>
              ${tokensLoading ? '...' : vplsInfo.marketCap}
            </p>
          </div>
        </div>
      </div>
      <div className='mt-[24px] px-[30px]'>
        <div className='h-[38px] border border-[#333] rounded-[8px] p-[3px] flex'>
            <div 
              className='bg-[#4F8CEF] rounded-l-[6px]' 
              style={{ width: `${poolStats.unstakingPercentage}%` }}
            ></div>
            <div 
              className='bg-gradient-to-r from-[#ff8533] to-[#ffa162]' 
              style={{ width: `${poolStats.stakedPercentage}%` }}
            ></div>
            <div 
              className='bg-[#333] rounded-r-[6px]' 
              style={{ width: `${poolStats.otherPercentage}%` }}
            ></div>
        </div>
        <div className='flex align-middle justify-between mt-[40px]'>
          <div>
            <p className='text-[#A6A6A6] text-[13px] font-medium'>Unstaking</p>
            <div className='flex gap-[6px] mt-[10px]'>
              <div className='h-[11px] w-[11px] rounded-[2px] bg-[#4F8CEF]'></div>
              <p className='text-[#A6A6A6] text-[13px] font-normal'>
                {formatNumber(poolStats.unstaking, { decimals: 2 })}
              </p>
            </div>
          </div>
          <div>
            <p className='text-[#A6A6A6] text-[13px] font-medium'>Staked</p>
            <div className='flex gap-[6px] mt-[10px]'>
              <div className='h-[11px] w-[11px] rounded-[2px] bg-gradient-to-r from-[#ff8533] to-[#ffa162]'></div>
              <p className='text-[#A6A6A6] text-[13px] font-normal'>
                {formatNumber(poolStats.staked, { decimals: 2 })}
              </p>
            </div>
          </div>
          <div>
            <p className='text-[#A6A6A6] text-[13px] font-medium'>Total Supply</p>
            <div className='flex gap-[6px] mt-[10px]'>
              <div className='h-[11px] w-[11px] rounded-[2px] bg-[#333]'></div>
              <p className='text-[#A6A6A6] text-[13px] font-normal'>
                {tokensLoading ? '...' : formatNumber(poolStats.totalSupply, { decimals: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
