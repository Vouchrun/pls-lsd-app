import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useVouchStakingLegacy } from 'hooks/useVouchStakingLegacy';
import { useVouchTokens } from 'hooks/useVouchTokens';
import { useWalletAccount } from 'hooks/useWalletAccount';
import { formatNumber } from 'utils/numberUtils';
import { CustomButton } from '../common/CustomButton';
import { CustomNumberInput } from '../common/CustomNumberInput';
import classNames from 'classnames';
import snackbarUtil from 'utils/snackbarUtils';

interface VouchStakingLegacyProps {
  selectedTab: 'stake' | 'unstake';
  onTabChange: (tab: 'stake' | 'unstake') => void;
}

export const VouchStakingLegacy: React.FC<VouchStakingLegacyProps> = ({
  selectedTab,
  onTabChange,
}) => {
  const { metaMaskAccount } = useWalletAccount();
  const {
    checkAllowance,
    approve,
    stake,
    unstake,
    claim,
    loading,
    userTotalVouchStaked,
    pendingRewards,
    holderRewardInfo,
    vouchUnlockPeriod,
    vouchUnlockInfo,
    cancelUnlock,
    finalizeUnlock,
    refreshData,
  } = useVouchStakingLegacy();

  const { vouchBalance, loading: tokensLoading } = useVouchTokens();

  const [amount, setAmount] = useState('');
  const [isStakeProcessing, setIsStakeProcessing] = useState(false);
  const [isApproveProcessing, setIsApproveProcessing] = useState(false);
  const [isClaimProcessing, setIsClaimProcessing] = useState(false);
  const [isUnlockProcessing, setIsUnlockProcessing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [needsApproval, setNeedsApproval] = useState(false);

  const VOUCH_POOL_ID = 1;

  const hasActiveUnlock = useMemo(() => {
    return Number(vouchUnlockInfo.amount) > 0;
  }, [vouchUnlockInfo.amount]);

  useEffect(() => {
    if (!hasActiveUnlock) {
      setTimeRemaining('');
      return;
    }

    const updateTimer = () => {
      const unlockAtTimestamp = Number(vouchUnlockInfo.unlockAt);
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
  }, [hasActiveUnlock, vouchUnlockInfo.unlockAt]);

  const maxAmount = useMemo(() => {
    if (selectedTab === 'stake') {
      return vouchBalance.balance || '0';
    } else {
      return userTotalVouchStaked || '0';
    }
  }, [selectedTab, vouchBalance.balance, userTotalVouchStaked]);

  const isValidAmount = useMemo(() => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return false;
    }
    return Number(amount) <= Number(maxAmount);
  }, [amount, maxAmount]);

  useEffect(() => {
    const checkApproval = async () => {
      if (
        selectedTab === 'stake' &&
        amount &&
        isValidAmount &&
        metaMaskAccount
      ) {
        const hasAllowance = await checkAllowance(VOUCH_POOL_ID, amount);
        setNeedsApproval(!hasAllowance);
      } else {
        setNeedsApproval(false);
      }
    };
    checkApproval();
  }, [amount, isValidAmount, selectedTab, metaMaskAccount, checkAllowance]);

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
      await approve(VOUCH_POOL_ID, amount);
      snackbarUtil.success('Approval successful!');
      setNeedsApproval(false);
    } catch (error: any) {
      console.error('Approval error:', error);
      snackbarUtil.error(error?.message || 'Approval failed');
    } finally {
      setIsApproveProcessing(false);
    }
  }, [metaMaskAccount, amount, isValidAmount, approve]);

  const handleStake = useCallback(async () => {
    if (!metaMaskAccount || !amount || !isValidAmount) return;

    setIsStakeProcessing(true);
    try {
      snackbarUtil.info('Staking in progress...');
      await stake(VOUCH_POOL_ID, amount);
      snackbarUtil.success('Staking successful!');
      setAmount('');
      await refreshData();
    } catch (error: any) {
      console.error('Staking error:', error);
      snackbarUtil.error(error?.message || 'Staking failed');
    } finally {
      setIsStakeProcessing(false);
    }
  }, [metaMaskAccount, amount, isValidAmount, stake, refreshData]);

  const handleUnstake = useCallback(async () => {
    if (!metaMaskAccount || !amount || !isValidAmount) return;

    setIsStakeProcessing(true);
    try {
      snackbarUtil.info('Unstaking in progress...');
      await unstake(VOUCH_POOL_ID, amount);
      snackbarUtil.success('Unstaking initiated!');
      setAmount('');
      await refreshData();
    } catch (error: any) {
      console.error('Unstaking error:', error);
      snackbarUtil.error(error?.message || 'Unstaking failed');
    } finally {
      setIsStakeProcessing(false);
    }
  }, [metaMaskAccount, amount, isValidAmount, unstake, refreshData]);

  const handleClaim = useCallback(async () => {
    if (!metaMaskAccount) return;

    setIsClaimProcessing(true);
    try {
      snackbarUtil.info('Claiming rewards...');
      await claim(VOUCH_POOL_ID);
      snackbarUtil.success('Rewards claimed successfully!');
      await refreshData();
    } catch (error: any) {
      console.error('Claiming error:', error);
      snackbarUtil.error(error?.message || 'Claim failed');
    } finally {
      setIsClaimProcessing(false);
    }
  }, [metaMaskAccount, claim, refreshData]);

  const handleCancelUnlock = useCallback(async () => {
    if (!metaMaskAccount) return;

    setIsUnlockProcessing(true);
    try {
      snackbarUtil.info('Canceling unstake...');
      await cancelUnlock(VOUCH_POOL_ID);
      snackbarUtil.success('Unstake canceled!');
      await refreshData();
    } catch (error: any) {
      console.error('Cancel unlock error:', error);
      snackbarUtil.error(error?.message || 'Cancel failed');
    } finally {
      setIsUnlockProcessing(false);
    }
  }, [metaMaskAccount, cancelUnlock, refreshData]);

  const handleFinalizeUnlock = useCallback(async () => {
    if (!metaMaskAccount) return;

    setIsUnlockProcessing(true);
    try {
      snackbarUtil.info('Finalizing unstake...');
      await finalizeUnlock(VOUCH_POOL_ID);
      snackbarUtil.success('Unstake finalized!');
      await refreshData();
    } catch (error: any) {
      console.error('Finalize unlock error:', error);
      snackbarUtil.error(error?.message || 'Finalize failed');
    } finally {
      setIsUnlockProcessing(false);
    }
  }, [metaMaskAccount, finalizeUnlock, refreshData]);

  return (
    <div className='bg-color-bg2 rounded-[.3rem] pb-[.14rem] border-[.01rem] border-color-border1'>
      <div
        className='h-[.56rem] grid items-stretch'
        style={{ gridTemplateColumns: '50% 50%' }}
      >
        <div
          className={classNames(
            'cursor-not-allowed flex items-center justify-center rounded-tl-[.3rem] text-[16px] text-color-text1 border-[0.01rem] opacity-50',
            'border-color-border1 bg-[#E2E0D0] dark:bg-[#333333]'
          )}
        >
          Stake VOUCH
        </div>
        <div
          className={classNames(
            'cursor-pointer flex items-center justify-center rounded-tr-[.3rem] text-[16px] text-color-text1 border-[0.01rem]',
            selectedTab === 'unstake'
              ? 'font-[700] border-[#ff4400]/30 bg-gradient-to-r from-[#ff8533] to-[#ffa162]'
              : 'border-color-border1 bg-[#E2E0D0] dark:bg-[#333333]'
          )}
          onClick={() => onTabChange('unstake')}
        >
          Unstake VOUCH
        </div>
      </div>

      <div className='mx-[.24rem] mt-[.16rem] p-[.12rem] bg-[#fff3cd] dark:bg-[#3d3410] border border-[#ffc107] dark:border-[#664d03] rounded-[.12rem]'>
        <div className='flex items-center'>
          <div className='mr-[.08rem] text-[#856404] dark:text-[#ffecb5]'>
            <svg width='16' height='16' viewBox='0 0 16 16' fill='currentColor'>
              <path d='M8 0C3.584 0 0 3.584 0 8s3.584 8 8 8 8-3.584 8-8S12.416 0 8 0zm1 12H7V7h2v5zm0-6H7V4h2v2z' />
            </svg>
          </div>
          <div className='text-[13px] sm:text-[14px] text-[#856404] dark:text-[#ffecb5]'>
            <span className='font-semibold'>Pool Decommissioned</span>
            <span className='ml-1'>- Staking is disabled. Withdrawals only.</span>
          </div>
        </div>
        <div className='mt-[.08rem] text-[13px] text-[#856404] dark:text-[#ffecb5]'>
          Please use the <span className='font-semibold'>Vouch Token Staking Pools</span> tab to stake your tokens.
        </div>
      </div>

      {!hasActiveUnlock && selectedTab === 'unstake' && (
        <div className='mx-[.24rem] mt-[.16rem] p-[.12rem] bg-[#f0f0f0] dark:bg-[#2a2a2a] border border-[#d0d0d0] dark:border-[#444444] rounded-[.12rem] flex items-center'>
          <div className='mr-[.08rem] text-[#6c86ad] dark:text-[#8fa4c7]'>
            <svg width='16' height='16' viewBox='0 0 16 16' fill='currentColor'>
              <path d='M8 0C3.584 0 0 3.584 0 8s3.584 8 8 8 8-3.584 8-8S12.416 0 8 0zm1 12H7V7h2v5zm0-6H7V4h2v2z' />
            </svg>
          </div>
            <div className='text-[13px] sm:text-[14px] text-[#666666] dark:text-[#aaaaaa] leading-[1.4]'>
              Staked tokens will be instantly claimable{' '}
              <span className='font-semibold'>after unstaking.</span>{' '}
              <br />After unstaking you will see a green Claim Unstake Button.
            </div>
        </div>
      )}

      {hasActiveUnlock && selectedTab === 'unstake' && (
        <div className='mx-[.24rem] mt-[.16rem] p-[.12rem] bg-[#fff3cd] dark:bg-[#3d3410] border border-[#ffc107] dark:border-[#664d03] rounded-[.12rem]'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center'>
              <div className='mr-[.08rem] text-[#856404] dark:text-[#ffecb5]'>
                <svg
                  width='16'
                  height='16'
                  viewBox='0 0 16 16'
                  fill='currentColor'
                >
                  <path d='M8 0C3.584 0 0 3.584 0 8s3.584 8 8 8 8-3.584 8-8S12.416 0 8 0zm1 12H7V7h2v5zm0-6H7V4h2v2z' />
                </svg>
              </div>
              <div>
                <div className='text-[14px] sm:text-[15px] font-semibold text-[#856404] dark:text-[#ffecb5]'>
                  Active Unstake in Progress
                </div>
                <div className='text-[13px] sm:text-[14px] text-[#856404] dark:text-[#ffecb5] mt-[.04rem]'>
                  Amount:{' '}
                  {formatNumber(vouchUnlockInfo.amount, { decimals: 4 })} VOUCH
                </div>
              </div>
            </div>
            <div className='text-right'>
              <div className='text-[13px] sm:text-[14px] text-[#856404] dark:text-[#ffecb5]'>
                {vouchUnlockInfo.ready ? (
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

      <div className='mt-[.18rem] pt-[.24rem] mx-[.24rem] bg-[#edece3] dark:bg-[#111111] rounded-[.3rem]'>
        <div className='mx-[.12rem] flex items-start'>
          <div className='flex-1 flex justify-start flex-col pl-[.14rem]'>
            {selectedTab === 'stake' ? (
              <div className='text-[14px] text-[#666666] dark:text-[#aaaaaa] text-center py-[.24rem]'>
                Staking is disabled for legacy pools. Please use the <span className='font-semibold text-color-text1'>Vouch Token Staking Pools</span> tab.
              </div>
            ) : (
              <>
                <div className='flex items-start'>
                  <CustomNumberInput
                    value={amount}
                    handleValueChange={setAmount}
                    fontSize='.24rem'
                    placeholder='Amount'
                  />
                  <div className='flex flex-col items-start ml-2'>
                    <select className='gef_selct bg-[#1A1A1A] border border-[#6C86AD80] outline-none h-[32px] w-[70px] sm:w-[80px] justify-center text-center rounded-[30px] text-[14px]'>
                      <option >VOUCH</option>
                    </select>
                    <CustomButton
                      className='text-[14px] max_btn mt-2 sm:w-auto'
                      width='70px'
                      onClick={handleMax}
                    >
                      Max
                    </CustomButton>
                  </div>
                </div>

                <div className='text-[13px] sm:text-[.13rem]'>
                  <div className='grid grid-cols-2 gap-0'>
                    <div></div>
                    <div className='text-color-text2 mb-[14px]'>
                      Balance: {formatNumber(maxAmount, { decimals: 2 })}{' '}
                      VOUCH (Staked)
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className='mt-[20px] flex flex-col sm:flex-row justify-center gap-4 mb-[20px] px-4 sm:px-0'>
        {selectedTab === 'stake' ? (
          <button
            disabled
            className='h-[45px] w-full sm:w-[160px] bg-gray-400 dark:bg-gray-600 opacity-50 cursor-not-allowed text-white font-medium text-[16px] rounded-[50px]'
          >
            Stake VOUCH
          </button>
        ) : (
          <>
            <button
              onClick={handleUnstake}
              disabled={
                !metaMaskAccount ||
                isStakeProcessing ||
                !amount ||
                !isValidAmount
              }
              className='h-[45px] w-full sm:w-[160px] bg-gradient-to-r from-[#ff8533] to-[#ffa162] hover:from-[#ff7520] hover:to-[#ff9550] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-[16px] rounded-[50px] transition-all duration-200'
            >
              {isStakeProcessing ? 'Unstaking...' : 'Unstake VOUCH'}
            </button>

            {hasActiveUnlock ? (
              vouchUnlockInfo.ready ? (
                <button
                  onClick={handleFinalizeUnlock}
                  disabled={!metaMaskAccount || isUnlockProcessing}
                  className='h-[45px] w-full sm:w-[160px] bg-gradient-to-r from-[#28a745] to-[#20c997] hover:from-[#218838] hover:to-[#1aa179] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-[16px] rounded-[50px] transition-all duration-200'
                >
                  {isUnlockProcessing ? 'Processing...' : 'Claim Unstake'}
                </button>
              ) : (
                <button
                  onClick={handleCancelUnlock}
                  disabled={!metaMaskAccount || isUnlockProcessing}
                  className='h-[45px] w-full sm:w-[160px] bg-gradient-to-r from-[#dc3545] to-[#c82333] hover:from-[#c82333] hover:to-[#bd2130] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-[16px] rounded-[50px] transition-all duration-200'
                >
                  {isUnlockProcessing ? 'Processing...' : 'Cancel Unstake'}
                </button>
              )
            ) : null}
          </>
        )}

        <button
          onClick={handleClaim}
          disabled={!metaMaskAccount || isClaimProcessing}
          className='h-[45px] w-full sm:w-[160px] bg-gradient-to-r from-[#ff8533] to-[#ffa162] hover:from-[#ff7520] hover:to-[#ff9550] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-[16px] rounded-[50px] transition-all duration-200'
        >
          {isClaimProcessing ? 'Claiming...' : 'Claim Rewards'}
        </button>
      </div>
    </div>
  );
};