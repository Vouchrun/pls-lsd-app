import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Tooltip from '@mui/material/Tooltip';
import { Icomoon } from 'components/icon/Icomoon';
import { FarmsTabs } from './FarmsTab';
import { CustomNumberInput } from 'components/common/CustomNumberInput';
import { CustomButton } from 'components/common/CustomButton';
import { LPPoolData } from 'hooks/useLpFarms';
import { formatNumber } from 'utils/numberUtils';
import { useWalletAccount } from 'hooks/useWalletAccount';
import snackbarUtil from 'utils/snackbarUtils';
import { useAppSlice } from 'hooks/selector';

interface LpStakingCardProps {
  poolData: LPPoolData;
  checkAllowance: (lpTokenAddress: string, amount: string) => Promise<boolean>;
  onApprove: (lpTokenAddress: string, amount: string) => Promise<any>;
  onStake: (
    pid: number,
    amount: string,
    lpTokenAddress: string
  ) => Promise<any>;
  onUnstake: (pid: number, amount: string) => Promise<any>;
  onClaim: (pid: number) => Promise<any>;
  refreshData: () => Promise<void>;
}

export const LpStakingCard: React.FC<LpStakingCardProps> = ({
  poolData,
  checkAllowance,
  onApprove,
  onStake,
  onUnstake,
  onClaim,
  refreshData,
}) => {
  const { darkMode } = useAppSlice();
  const { metaMaskAccount } = useWalletAccount();
  const [selectedTab, setSelectedTab] = useState<'stake' | 'unstake'>('stake');
  const [amount, setAmount] = useState('');
  const [isStakeProcessing, setIsStakeProcessing] = useState(false);
  const [isApproveProcessing, setIsApproveProcessing] = useState(false);
  const [isClaimProcessing, setIsClaimProcessing] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(false);

  const maxAmount = useMemo(() => {
    if (selectedTab === 'stake') {
      return poolData.availableBalance || '0';
    } else {
      return poolData.userStaked || '0';
    }
  }, [selectedTab, poolData.availableBalance, poolData.userStaked]);

  const isValidAmount = useMemo(() => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return false;
    }
    return Number(amount) <= Number(maxAmount);
  }, [amount, maxAmount]);

  // Check approval when amount changes
  useEffect(() => {
    const checkApproval = async () => {
      if (
        selectedTab === 'stake' &&
        amount &&
        isValidAmount &&
        metaMaskAccount &&
        poolData.config.lpTokenAddress
      ) {
        const hasAllowance = await checkAllowance(
          poolData.config.lpTokenAddress,
          amount
        );
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
    metaMaskAccount,
    poolData.config.lpTokenAddress,
    checkAllowance,
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
      await onApprove(poolData.config.lpTokenAddress, amount);
      snackbarUtil.success('Approval successful!');
      setNeedsApproval(false);
    } catch (error: any) {
      console.error('Approval error:', error);
      snackbarUtil.error(error?.message || 'Approval failed');
    } finally {
      setIsApproveProcessing(false);
    }
  }, [
    metaMaskAccount,
    amount,
    isValidAmount,
    poolData.config.lpTokenAddress,
    onApprove,
  ]);

  const handleStake = useCallback(async () => {
    if (!metaMaskAccount || !amount || !isValidAmount) return;

    setIsStakeProcessing(true);
    try {
      snackbarUtil.info('Staking in progress...');
      await onStake(poolData.pid, amount, poolData.config.lpTokenAddress);
      snackbarUtil.success('Staking successful!');
      setAmount('');
      await refreshData();
    } catch (error: any) {
      console.error('Staking error:', error);
      snackbarUtil.error(error?.message || 'Staking failed');
    } finally {
      setIsStakeProcessing(false);
    }
  }, [
    metaMaskAccount,
    amount,
    isValidAmount,
    poolData.pid,
    poolData.config.lpTokenAddress,
    onStake,
    refreshData,
  ]);

  const handleUnstake = useCallback(async () => {
    if (!metaMaskAccount || !amount || !isValidAmount) return;

    setIsStakeProcessing(true);
    try {
      snackbarUtil.info('Unstaking in progress...');
      await onUnstake(poolData.pid, amount);
      snackbarUtil.success('Unstaking successful!');
      setAmount('');
      await refreshData();
    } catch (error: any) {
      console.error('Unstaking error:', error);
      snackbarUtil.error(error?.message || 'Unstaking failed');
    } finally {
      setIsStakeProcessing(false);
    }
  }, [
    metaMaskAccount,
    amount,
    isValidAmount,
    poolData.pid,
    onUnstake,
    refreshData,
  ]);

  const handleClaim = useCallback(async () => {
    if (!metaMaskAccount) return;

    setIsClaimProcessing(true);
    try {
      snackbarUtil.info('Claiming rewards...');
      await onClaim(poolData.pid);
      snackbarUtil.success('Rewards claimed successfully!');
      await refreshData();
    } catch (error: any) {
      console.error('Claim error:', error);
      snackbarUtil.error(error?.message || 'Claim failed');
    } finally {
      setIsClaimProcessing(false);
    }
  }, [metaMaskAccount, poolData.pid, onClaim, refreshData]);

  return (
    <div className='border-[1px] border-solid border-[#FE8A3C] rounded-[30px] w-full'>
      {/* Header */}
      <div className='flex justify-between mt-[20px] border-b border-[#cdcccc] dark:border-[#333] pb-[15px]'>
        <div className='flex items-center ml-[18px]'>
          <img
            src={poolData.config.token0Icon}
            alt='icon'
            className='w-[46px] h-[46px]'
          />
          <img
            src={poolData.config.token1Icon}
            alt='icon'
            className='w-[46px] h-[46px] mx-[7px]'
          />
          <p className='text-[18px] text-color-text1 font-normal'>
            {poolData.config.name}
          </p>
          <a href={poolData.config.lpUrl} target='_blank' className='ml-[7px]'>
            <Icomoon
              icon='share'
              size='.12rem'
              color={darkMode ? '#FFF' : '#1b1b1f'}
            />
          </a>
        </div>
        <div className='mr-[18px] items-end-end flex flex-col'>
          <h2 className='text-[28px] font-normal text-[#A6A6A6]'>
            <span className='text-color-text1'>
              {formatNumber(poolData.availableBalance, { decimals: 4 })}{' '}
            </span>
            PLP
          </h2>
          <p className='text-[15px] font-normal text-color-text1 mt-[4px]'>
            Available Balance 
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className='relative p-l[8px]'>
        <div className='grid grid-cols-2 gap-0 py-[21px]'>
          {/* Staked Column */}
          <div className='flex flex-col items-center'>
            <div>
              <p className='text-[14px] font-medium text-[#8E9397] mb-[7px] m-auto items-baseline'>
                Staked 
                <Tooltip title="Your total staked LP tokens" placement="top" arrow>
                  <span>
                    <Icomoon icon='tip' size='.12rem' color='#333333' />
                  </span>
                </Tooltip>
              </p>
              <p className='text-[16px] font-normal text-[#A6A6A6] mb-[7px] m-auto items-baseline'>
                <span className='text-color-text1 mr-[3px]'>
                  {formatNumber(poolData.userStaked, { decimals: 4 })}
                </span>
                PLP
              </p>
              <p className='text-[13px] font-medium text-[#A6A6A6] mb-[7px] m-auto items-baseline'>
                $0.00
              </p>
            </div>
          </div>

          {/* Allocation Column */}
          <div className='flex flex-col items-center'>
            <div>
              <p className='text-[14px] font-medium text-[#8E9397] mb-[7px] m-auto items-baseline flex'>
                Allocation
                <div className='relative top-[-7px] right-[-1px]'>
                  <Tooltip title="Pool weight for reward distribution" placement="top" arrow>
                    <span>
                      <Icomoon icon='tip' size='.12rem' color='#333333'  />  
                    </span>
                  </Tooltip>
                </div>
              </p>
              <p className='text-[20px] text-center font-normal text-[#ffa162] mb-[0px] mt-[12px] m-auto items-baseline'>
                {poolData.poolInfo.allocPoint}
              </p>
            </div>
          </div>
        </div>

        {/* Rewards and APY Section */}
        <div className='grid grid-flow-col grid-rows-1 max-sm:grid-rows-2 gap-0 max-sm:gap-1 mt-[0px]'>
          <div>
            <p className='text-[14px] font-medium text-[#8E9397] mb-[13px] text-center relative z-[1]'>
              Staking Rewards
            </p>
            <div className='flex max-w-[160px] justify-between mx-auto mt-[20px] mb-[8px]'>
              <p className='text-[18px] font-normal text-color-text1 text-center'>
                {formatNumber(poolData.pendingRewards.vplsPending, {
                  decimals: 6,
                })}
              </p>
              <p className='text-[18px] font-normal text-[#A6A6A6] text-center'>
                vPLS
              </p>
            </div>
            <div className='flex max-w-[160px] justify-between mx-auto mb-[8px]'>
              <p className='text-[18px] font-normal text-color-text1 text-center'>
                {formatNumber(poolData.pendingRewards.vouchPending, {
                  decimals: 6,
                })}
              </p>
              <p className='text-[18px] font-normal text-[#A6A6A6] text-center'>
                VOUCH
              </p>
            </div>
            <div className='flex max-w-[160px] justify-between mx-auto mb-[10px]'>
              <p className='text-[18px] font-normal text-color-text1 text-center'>
                {formatNumber(poolData.pendingRewards.wplsPending, {
                  decimals: 6,
                })}
              </p>
              <p className='text-[18px] font-normal text-[#A6A6A6] text-center'>
                PLS
              </p>
            </div>
          </div>
          <div>
            <p className='text-[14px] font-medium text-[#8E9397] mb-[13px] text-center relative z-[1]'>
              Pool APY 
            </p>
            <div className='flex max-w-[160px] justify-center mx-auto mb-[10px] mt-[40px]'>
              <p className='text-[20px] font-bold text-[#ffa162] text-center'>
                {poolData.poolApy}%
              </p>
            </div>
            {/* <button
              className='text-[15px] font-bold font-normal text-color-text1  border-[#ffa162] hover:border-[#fff] border rounded-[10px] p-[14px] w-[120px]  text-white mx-auto flex justify-center'
              onClick={() => {}}
            >
              <a href={poolData.config.lpUrl} target='_blank'>
                Add LP
              </a>
            </button> */}
          </div>
          <div className='bg-[#cdcccc] dark:bg-[#333] h-[1px] w-[45px] absolute top-[50%]'></div>
          <div className='bg-[#cdcccc] dark:bg-[#333] h-[1px] w-[45px] absolute right-0 top-[50%]'></div>
        </div>
      </div>

      {/* Staking Interface */}
      <div className='mt-[30px]'>
        <FarmsTabs selectedTab={selectedTab} onTabChange={setSelectedTab} />
        <div className='text-white'>
          <div>
            {/* Amount Input */}
            <div className='mt-[.18rem] pt-[.24rem] mx-[.24rem] bg-[#edece3] dark:bg-[#111111] rounded-[.3rem]'>
              <div className='mx-[.12rem] flex items-start'>
                <div className='flex-1 flex justify-start flex-col pl-[.14rem]'>
                  <div className='flex items-center pb-[24px]'>
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
                        border='0.01rem solid #6C86AD80'
                        onClick={handleMax}
                      >
                        Max
                      </CustomButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='mt-[20px] flex max-w-[350px] mb-[38px] justify-between mx-auto'>
              {/* First button - Stake/Unstake/Approve */}
              {selectedTab === 'stake' && needsApproval ? (
                <button
                  onClick={handleApprove}
                  disabled={
                    !metaMaskAccount ||
                    isApproveProcessing ||
                    !amount ||
                    !isValidAmount
                  }
                  className='text-[#1B1B1F] h-[45px] w-[160px] bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:from-[#2563eb] hover:to-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed font-medium rounded-[50px] transition-all duration-200'
                >
                  {isApproveProcessing ? 'Approving...' : 'Approve LP'}
                </button>
              ) : (
                <button
                  onClick={
                    selectedTab === 'stake' ? handleStake : handleUnstake
                  }
                  disabled={
                    !metaMaskAccount ||
                    isStakeProcessing ||
                    !amount ||
                    !isValidAmount ||
                    (selectedTab === 'stake' && needsApproval)
                  }
                  className='text-[#FFF] dark:text-[#1B1B1F] h-[45px] w-[160px] bg-gradient-to-r from-[#ff8533] to-[#ffa162] hover:from-[#ff7520] hover:to-[#ff9550] disabled:opacity-50 disabled:cursor-not-allowed font-medium rounded-[50px] transition-all duration-200'
                >
                  {isStakeProcessing
                    ? selectedTab === 'stake'
                      ? 'Staking...'
                      : 'Unstaking...'
                    : selectedTab === 'stake'
                    ? 'Stake'
                    : 'Unstake'}
                </button>
              )}

              <button
                onClick={handleClaim}
                disabled={!metaMaskAccount || isClaimProcessing}
                className='text-[#FFF] dark:text-[#1B1B1F] h-[45px] w-[160px] bg-gradient-to-r from-[#ff8533] to-[#ffa162] hover:from-[#ff7520] hover:to-[#ff9550] disabled:opacity-50 disabled:cursor-not-allowed font-medium rounded-[50px] transition-all duration-200'
              >
                {isClaimProcessing ? 'Claiming...' : 'Claim Rewards'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
