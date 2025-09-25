import React, { useState, useMemo, useCallback } from 'react';
import { useVouchStaking } from 'hooks/useVouchStaking';
import { useVouchTokens } from 'hooks/useVouchTokens';
import { useWalletAccount } from 'hooks/useWalletAccount';
import { formatNumber } from 'utils/numberUtils';
import { CustomButton } from '../common/CustomButton';
import { CustomNumberInput } from '../common/CustomNumberInput';
import classNames from 'classnames';

interface VplsStakingProps {
  selectedTab: 'stake' | 'unstake';
  onTabChange: (tab: 'stake' | 'unstake') => void;
}

export const VplsStaking: React.FC<VplsStakingProps> = ({
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
    refreshData,
  } = useVouchStaking();

  const { vplsBalance, plsBalance, loading: tokensLoading } = useVouchTokens();

  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // vPLS staking uses pool ID 0 (assuming vPLS is the first pool)
  const VPLS_POOL_ID = 0;

  const maxAmount = useMemo(() => {
    if (selectedTab === 'stake') {
      return vplsBalance.balance || '0';
    } else {
      return userTotalVouchStaked || '0';
    }
  }, [selectedTab, vplsBalance.balance, userTotalVouchStaked]);

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
      return selectedTab === 'stake' ? 'Enter Amount' : 'Enter Amount';
    }
    return selectedTab === 'stake' ? 'Stake' : 'Unstake';
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
      await stake(VPLS_POOL_ID, amount);
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
      await unstake(VPLS_POOL_ID, amount);
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
      await claim(VPLS_POOL_ID);
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
          Stake vPLS
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
          Unstake vPLS
        </div>
      </div>

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
            <div className='mt-[.1rem] flex items-center justify-between text-[.14rem]'>
              <div className='text-color-text2'>
                Balance: {formatNumber(maxAmount, { decimals: 4 })}{' '}
                {selectedTab === 'stake' ? 'vPLS' : 'vPLS (Staked)'}
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
