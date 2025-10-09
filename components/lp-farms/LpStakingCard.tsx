import React, { useState, useMemo, useCallback } from 'react';
import { Icomoon } from 'components/icon/Icomoon';
import { FarmsTabs } from './FarmsTab';
import { CustomNumberInput } from 'components/common/CustomNumberInput';
import { CustomButton } from 'components/common/CustomButton';
import { LPPoolData } from 'hooks/useLpFarms';
import { formatNumber } from 'utils/numberUtils';
import { useWalletAccount } from 'hooks/useWalletAccount';

interface LpStakingCardProps {
  poolData: LPPoolData;
  onStake: (
    pid: number,
    amount: string,
    lpTokenAddress: string
  ) => Promise<any>;
  onUnstake: (pid: number, amount: string) => Promise<any>;
  onClaim: (pid: number) => Promise<any>;
  isProcessing: boolean;
}

export const LpStakingCard: React.FC<LpStakingCardProps> = ({
  poolData,
  onStake,
  onUnstake,
  onClaim,
  isProcessing,
}) => {
  const { metaMaskAccount } = useWalletAccount();
  const [selectedTab, setSelectedTab] = useState<'stake' | 'unstake'>('stake');
  const [amount, setAmount] = useState('');

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

  const buttonDisabled = useMemo(() => {
    return !metaMaskAccount || isProcessing || !amount || !isValidAmount;
  }, [metaMaskAccount, isProcessing, amount, isValidAmount]);

  const handleMax = useCallback(() => {
    if (Number(maxAmount) > 0) {
      setAmount(maxAmount);
    }
  }, [maxAmount]);

  const handleAction = useCallback(async () => {
    if (!metaMaskAccount || !amount || !isValidAmount) return;

    try {
      if (selectedTab === 'stake') {
        await onStake(poolData.pid, amount, poolData.config.lpTokenAddress);
      } else {
        await onUnstake(poolData.pid, amount);
      }
      setAmount('');
    } catch (error) {
      console.error('Action error:', error);
    }
  }, [
    metaMaskAccount,
    amount,
    isValidAmount,
    selectedTab,
    poolData.pid,
    poolData.config.lpTokenAddress,
    onStake,
    onUnstake,
  ]);

  const handleClaim = useCallback(async () => {
    if (!metaMaskAccount) return;

    try {
      await onClaim(poolData.pid);
    } catch (error) {
      console.error('Claim error:', error);
    }
  }, [metaMaskAccount, poolData.pid, onClaim]);

  return (
    <div className='border-[1px] border-solid border-[#FE8A3C] rounded-[30px] w-full'>
      {/* Header */}
      <div className='flex justify-between mt-[20px] border-b border-[#333] pb-[15px]'>
        <div className='flex align-top ml-[18px]'>
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
          <p className='text-[18px] text-[#FFFBFA] font-normal'>
            {poolData.config.name}
          </p>
          <a href={poolData.config.dexUrl} className='ml-[7px]'>
            <Icomoon icon='share' size='.12rem' color='#FFFBFA' />
          </a>
        </div>
        <div className='mr-[18px] items-end-end flex flex-col'>
          <h2 className='text-[28px] font-normal text-[#A6A6A6]'>
            <span className='text-[#FFFBFA]'>
              {formatNumber(poolData.availableBalance, { decimals: 4 })}{' '}
            </span>
            PLP
          </h2>
          <p className='text-[15px] font-normal text-[#FFFBFA] mt-[4px]'>
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
                Staked <Icomoon icon='tip' size='.12rem' color='#333333' />
              </p>
              <p className='text-[16px] font-normal text-[#A6A6A6] mb-[7px] m-auto items-baseline'>
                <span className='text-[#FFFBFA] mr-[3px]'>
                  {formatNumber(poolData.userStaked, { decimals: 4 })}
                </span>
                PLP
              </p>
              <p className='text-[13px] font-medium text-[#A6A6A6] mb-[7px] m-auto items-baseline'>
                $0.00
              </p>
            </div>
          </div>

          {/* Unstaking Column */}
          <div className='flex flex-col items-center'>
            <div>
              <p className='text-[14px] font-medium text-[#8E9397] mb-[7px]'>
                Unstaking <Icomoon icon='tip' size='.12rem' color='#333333' />
              </p>
              <p className='text-[16px] font-normal text-[#A6A6A6] mb-[7px]'>
                <span className='text-[#FFFBFA] mr-[3px]'>
                  {formatNumber(poolData.userUnstaking, { decimals: 4 })}
                </span>
                PLP
              </p>
              <p className='text-[13px] font-medium text-[#A6A6A6] mb-[7px]'>
                $0.00
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
              <p className='text-[18px] font-normal text-[#FFFBFA] text-center'>
                {formatNumber(poolData.pendingRewards.vplsPending, {
                  decimals: 6,
                })}
              </p>
              <p className='text-[18px] font-normal text-[#A6A6A6] text-center'>
                vPLS
              </p>
            </div>
            <div className='flex max-w-[160px] justify-between mx-auto mb-[8px]'>
              <p className='text-[18px] font-normal text-[#FFFBFA] text-center'>
                {formatNumber(poolData.pendingRewards.vouchPending, {
                  decimals: 6,
                })}
              </p>
              <p className='text-[18px] font-normal text-[#A6A6A6] text-center'>
                VOUCH
              </p>
            </div>
            <div className='flex max-w-[160px] justify-between mx-auto mb-[10px]'>
              <p className='text-[18px] font-normal text-[#FFFBFA] text-center'>
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
            <div className='flex max-w-[160px] justify-between mx-auto mb-[10px] mt-[20px]'>
              <p className='text-[24px] font-bold text-[#FFFBFA] text-center'>
                {poolData.poolApy}%
              </p>
              <p className='text-[18px] font-normal text-[#A6A6A6] text-center mr-[8px]'>
                1 Yr Avg
              </p>
            </div>
          </div>
          <div className='bg-[#333] h-[1px] w-[45px] absolute top-[50%]'></div>
          <div className='bg-[#333] h-[1px] w-[45px] absolute right-0 top-[50%]'></div>
        </div>
      </div>

      {/* Staking Interface */}
      <div className='mt-[30px]'>
        <FarmsTabs selectedTab={selectedTab} onTabChange={setSelectedTab} />
        <div className='text-white'>
          <div>
            {/* Info Banner */}
            <div className='mx-[.24rem] mt-[.16rem] p-[.12rem] bg-[#f0f0f0] dark:bg-[#2a2a2a] border border-[#d0d0d0] dark:border-[#444444] rounded-[.12rem] flex items-center'>
              <div className='mr-[10px] text-[#6c86ad] dark:text-[#8fa4c7]'>
                <svg
                  width='16'
                  height='16'
                  viewBox='0 0 16 16'
                  fill='currentColor'
                >
                  <path d='M8 0C3.584 0 0 3.584 0 8s3.584 8 8 8 8-3.584 8-8S12.416 0 8 0zm1 12H7V7h2v5zm0-6H7V4h2v2z' />
                </svg>
              </div>
              <p className='text-[.12rem] text-[#666666] dark:text-[#aaaaaa] leading-[1.4]'>
                Staked tokens have a cooldown period to unstake. During this
                period unstaked tokens will not accrue staking rewards
              </p>
              <div className='ml-[10px]'>
                <button>
                  <img
                    src='/images/right_sid_ic.svg'
                    alt=''
                    className='w-[20px]'
                  />
                </button>
              </div>
            </div>

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
              <button
                onClick={handleAction}
                disabled={buttonDisabled}
                className='text-[#1B1B1F] h-[45px] w-[160px] bg-gradient-to-r from-[#ff8533] to-[#ffa162] hover:from-[#ff7520] hover:to-[#ff9550] disabled:opacity-50 disabled:cursor-not-allowed font-medium rounded-[50px] transition-all duration-200'
              >
                {isProcessing
                  ? 'Processing...'
                  : selectedTab === 'stake'
                  ? 'Stake'
                  : 'Unstake'}
              </button>

              <button
                onClick={handleClaim}
                disabled={!metaMaskAccount || isProcessing}
                className='text-[#1B1B1F] h-[45px] w-[160px] bg-gradient-to-r from-[#ff8533] to-[#ffa162] hover:from-[#ff7520] hover:to-[#ff9550] disabled:opacity-50 disabled:cursor-not-allowed font-medium rounded-[50px] transition-all duration-200'
              >
                {isProcessing ? 'Processing...' : 'Claim Rewards'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
