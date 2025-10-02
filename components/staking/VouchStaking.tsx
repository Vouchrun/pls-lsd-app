import React, { useState, useMemo, useCallback } from 'react';
import { useVouchStaking } from 'hooks/useVouchStaking';
import { useVouchTokens } from 'hooks/useVouchTokens';
import { useWalletAccount } from 'hooks/useWalletAccount';
import { formatNumber } from 'utils/numberUtils';
import { CustomButton } from '../common/CustomButton';
import { CustomNumberInput } from '../common/CustomNumberInput';
import classNames from 'classnames';

interface VouchStakingProps {
  selectedTab: 'stake' | 'unstake';
  onTabChange: (tab: 'stake' | 'unstake') => void;
}

export const VouchStaking: React.FC<VouchStakingProps> = ({
  selectedTab,
  onTabChange,
}) => {
  const { metaMaskAccount } = useWalletAccount();
  const {
    stake,
    unstake,
    claim,
    loading,
    userTotalVouchStaked,
    pendingRewards,
    holderRewardInfo,
    vouchUnlockPeriod,
    refreshData,
  } = useVouchStaking();

  const { vouchBalance, loading: tokensLoading } = useVouchTokens();

  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // VOUCH staking uses pool ID 1 (assuming VOUCH is the second pool)
  const VOUCH_POOL_ID = 1;

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

  const buttonText = useMemo(() => {
    if (!metaMaskAccount) return 'Connect Wallet';
    if (isProcessing) {
      return selectedTab === 'stake' ? 'Staking...' : 'Unstaking...';
    }
    if (!amount || !isValidAmount) {
      return selectedTab === 'stake' ? 'Stake' : 'Unstake';
    }
    return selectedTab === 'stake' ? 'Stake VOUCH' : 'Unstake VOUCH';
  }, [metaMaskAccount, isProcessing, amount, isValidAmount, selectedTab]);

  const buttonDisabled = useMemo(() => {
    return !metaMaskAccount || isProcessing || !amount || !isValidAmount;
  }, [metaMaskAccount, isProcessing, amount, isValidAmount]);

  const handleMax = useCallback(() => {
    if (Number(maxAmount) > 0) {
      setAmount(maxAmount);
    }
  }, [maxAmount]);

  const handleStake = useCallback(async () => {
    if (!metaMaskAccount || !amount || !isValidAmount) return;

    setIsProcessing(true);
    try {
      await stake(VOUCH_POOL_ID, amount);
      setAmount('');
      await refreshData();
    } catch (error) {
      console.error('Staking error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [metaMaskAccount, amount, isValidAmount, stake, refreshData]);

  const handleUnstake = useCallback(async () => {
    if (!metaMaskAccount || !amount || !isValidAmount) return;

    setIsProcessing(true);
    try {
      await unstake(VOUCH_POOL_ID, amount);
      setAmount('');
      await refreshData();
    } catch (error) {
      console.error('Unstaking error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [metaMaskAccount, amount, isValidAmount, unstake, refreshData]);

  const handleClaim = useCallback(async () => {
    if (!metaMaskAccount) return;

    setIsProcessing(true);
    try {
      await claim(VOUCH_POOL_ID);
      await refreshData();
    } catch (error) {
      console.error('Claiming error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [metaMaskAccount, claim, refreshData]);

  const handleAction = useCallback(() => {
    if (selectedTab === 'stake') {
      handleStake();
    } else {
      handleUnstake();
    }
  }, [selectedTab, handleStake, handleUnstake]);

  return (
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
          onClick={() => onTabChange('stake')}
        >
          Stake VOUCH
        </div>
        <div
          className={classNames(
            'cursor-pointer flex items-center justify-center rounded-tr-[.3rem] text-[.16rem] text-color-text1 border-[0.01rem]',
            selectedTab === 'unstake'
              ? 'font-[700] border-[#ff4400]/30 bg-gradient-to-r from-[#ff8533] to-[#ffa162]'
              : 'border-color-border1 bg-[#E2E0D0] dark:bg-[#333333]'
          )}
          onClick={() => onTabChange('unstake')}
        >
          Unstake VOUCH
        </div>
      </div>

      {/* Cooldown Message for Unstake Tab */}
      {selectedTab === 'unstake' && vouchUnlockPeriod > 0 && (
        <div className='mx-[.24rem] mt-[.16rem] p-[.12rem] bg-[#f0f0f0] dark:bg-[#2a2a2a] border border-[#d0d0d0] dark:border-[#444444] rounded-[.12rem] flex items-center'>
          <div className='mr-[.08rem] text-[#6c86ad] dark:text-[#8fa4c7]'>
            <svg width='16' height='16' viewBox='0 0 16 16' fill='currentColor'>
              <path d='M8 0C3.584 0 0 3.584 0 8s3.584 8 8 8 8-3.584 8-8S12.416 0 8 0zm1 12H7V7h2v5zm0-6H7V4h2v2z' />
            </svg>
          </div>
          <div className='text-[.12rem] text-[#666666] dark:text-[#aaaaaa] leading-[1.4]'>
            Staked tokens have a{' '}
            <span className='font-semibold'>
              {vouchUnlockPeriod} day{vouchUnlockPeriod !== 1 ? 's' : ''}
            </span>{' '}
            cool down period to unstake. During this period unstaked tokens will
            not accrue staking rewards.
          </div>
        </div>
      )}

      {/* Content */}
      <div className='mt-[.18rem] pt-[.24rem] mx-[.24rem] bg-[#edece3] dark:bg-[#111111] rounded-[.3rem]'>
        <div className='mx-[.12rem] flex items-start'>
          <div className='flex-1 flex justify-start flex-col pl-[.14rem]'>
            {/* Amount Input */}
            <div className='flex items-center h-[.42rem]'>
              <CustomNumberInput
                value={amount}
                handleValueChange={setAmount}
                fontSize='.24rem'
                placeholder='Amount'
              />
              <div>
                <CustomButton
                  type='stroke'
                  width='.63rem'
                  height='.36rem'
                  fontSize='.16rem'
                  className='bg-color-bgPage border-color-border1'
                  onClick={handleMax}
                  border='0.01rem solid #6C86AD80'
                >
                  Max
                </CustomButton>
              </div>
            </div>

            {/* Balance Info */}
            <div className='mt-[.1rem] text-[.14rem]'>
              <div className='grid grid-cols-2 gap-0'>
                <div></div>
                <div className='text-color-text2 mt-[7px] mb-[14px]'>
                  Balance: {formatNumber(maxAmount, { decimals: 4 })}{' '}
                  {selectedTab === 'stake' ? 'VOUCH' : 'VOUCH (Staked)'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Action Buttons */}
      <div className='mt-[20px] flex justify-center gap-4 mb-[20px]'>
        <button
          onClick={handleAction}
          disabled={buttonDisabled}
          className='h-[45px] w-[160px] bg-gradient-to-r from-[#ff8533] to-[#ffa162] hover:from-[#ff7520] hover:to-[#ff9550] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-[50px] transition-all duration-200'
        >
          {buttonText}
        </button>

        <button
          onClick={handleClaim}
          disabled={!metaMaskAccount || isProcessing}
          className='h-[45px] w-[160px] bg-gradient-to-r from-[#ff8533] to-[#ffa162] hover:from-[#ff7520] hover:to-[#ff9550] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-[50px] transition-all duration-200'
        >
          {isProcessing ? 'Processing...' : 'Claim Rewards'}
        </button>
      </div>
    </div>
  );
};
