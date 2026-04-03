import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import { VouchStaking } from './VouchStaking';
import { useVouchStaking } from 'hooks/useVouchStaking';
import { useVouchTokens } from 'hooks/useVouchTokens';
import { formatNumber } from 'utils/numberUtils';
import Web3 from 'web3';
import { Icomoon } from '../icon/Icomoon';

interface RewardPoolCardProps {
  selectedTab: 'stake' | 'unstake';
  onTabChange: (tab: 'stake' | 'unstake') => void;
}

/**
 * Standard Reward Pool Card for VOUCH token staking
 * This is a wrapper around the existing VouchStaking component
 * with an updated header and additional stats to match the design
 */
export const RewardPoolCard: React.FC<RewardPoolCardProps> = ({
  selectedTab,
  onTabChange,
}) => {
  const {
    userTotalVouchStaked,
    vouchUnlockInfo,
    pendingTripleByPid,
    holderRewardInfo,
    totalVouchUnlocking,
    vouchPoolInfo,
    loading,
  } = useVouchStaking();

  const { vouchBalance, vouchInfo, loading: tokensLoading } = useVouchTokens();

  // Calculate bar chart percentages for VOUCH (based on total supply)
  const vouchUnstakingAmount = Number(totalVouchUnlocking) || 0;
  const vouchStakedAmount =
    Number(Web3.utils.fromWei(vouchPoolInfo.totalStaked || '0', 'ether')) || 0;
  const vouchTotalSupply = Number(vouchInfo.totalSupply) || 1;

  // Bar segments as percentage of total supply (sum to 100%)
  const vouchUnstakingPercent =
    vouchTotalSupply > 0
      ? (vouchUnstakingAmount / vouchTotalSupply) * 100
      : 0;
  const vouchStakedPercent =
    vouchTotalSupply > 0 ? (vouchStakedAmount / vouchTotalSupply) * 100 : 0;
  const vouchOtherAmount = Math.max(
    0,
    vouchTotalSupply - vouchStakedAmount - vouchUnstakingAmount
  );
  const vouchOtherPercent =
    vouchTotalSupply > 0
      ? (vouchOtherAmount / vouchTotalSupply) * 100
      : 0;

  return (
    <div className=''>
      <div className='flex flex-col sm:flex-row justify-between gap-4 sm:gap-0'>
        {/* Header with badge and title */}
        <div className='flex items-center mb-[20px] sm:mb-[40px]'>
          <div className='w-[66px] h-[66px] mr-[16px]'>
            <img src='/favicon.png' alt='icon' className='w-[66px] h-[66px]' />
          </div>
          <div>
            <p className='text-[18px] font-normal text-color-text1 flex mb-[10px]'>
              VOUCH{' '}
              <img
                src='/images/pls_ic.svg'
                alt='icon'
                className='ml-[6px] invert-0 dark:invert'
              />
              <span className='ml-[10px] px-[10px] py-[2px] pr-[5px] bg-[#FE8A3C] text-[#000] text-[15px] font-normal rounded-[10px] flex gap-[8px]  align-middle'>
                Standard Pool
                <Tooltip title="Standard Pools reward token holders for sigle sided staking. They can earn extra VOUCH, vPLS and PLS tokens in return for locking their liquid tokens." placement="top" arrow>
                  <span>
                    <Icomoon icon='tip' size='.12rem' color='#000' />
                  </span>
                </Tooltip>
              </span>
            </p>
            <p className='text-[13px] font-normal text-[#A6A6A6] mt-[3px]'>
              Stake VOUCH to receive Rewards.
            </p>
          </div>
        </div>

        {/* Balance Section */}
        <div className='flex justify-between sm:justify-end mb-[20px] sm:mb-[40px]'>
          <div className='flex flex-col items-start sm:items-end'>
            <p className='text-[15px] font-normal text-color-text1 mb-[6px]'>
              Available Balance
            </p>
            <p className='text-[18px] font-normal text-[#A6A6A6]'>
              <span className='text-color-text1 mr-[3px]'>
                {selectedTab === 'stake'
                  ? tokensLoading
                    ? '...'
                    : formatNumber(vouchBalance.balance, { decimals: 2 })
                  : loading
                    ? '...'
                    : formatNumber(userTotalVouchStaked, { decimals: 2 })}
              </span>
              {selectedTab === 'stake' ? 'VOUCH' : 'VOUCH (Staked)'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className='border-color-border1 border rounded-[8px] mb-[37px] relative p-l[8px]'>
        <div className='grid grid-cols-2 gap-4 py-[18px] min-h-[120px]'>
          {/* Staked Column */}
          <div className='flex flex-col items-center'>

            <p className='text-[14px] font-medium text-[#8E9397] mb-[7px] text-center'>
              Staked 
              <Tooltip title="Total VOUCH staked" placement="top" arrow>
                <span>
                  <Icomoon icon='tip' size='.12rem' color='#333333' />
                </span>
              </Tooltip>
            </p>
            <p className='text-[16px] font-normal text-[#A6A6A6] mb-[7px] text-center'>
              <span className='text-color-text1 mr-[3px]'>
                {loading
                  ? '...'
                  : formatNumber(userTotalVouchStaked, { decimals: 2 })}
              </span>
              VOUCH
            </p>
            <p className='text-[13px] font-medium text-[#A6A6A6] mb-[7px] text-center'>
              $
              {tokensLoading
                ? '-'
                : formatNumber(
                  Number(vouchInfo.price) * Number(userTotalVouchStaked),
                  { decimals: 2 }
                )}
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
            <p className='text-[16px] font-normal text-[#A6A6A6] mb-[7px] text-center'>
              <span className='text-color-text1 mr-[3px]'>
                {loading
                  ? '...'
                  : formatNumber(vouchUnlockInfo.amount, { decimals: 2 })}
              </span>
              VOUCH
            </p>
            <p className='text-[13px] font-medium text-[#A6A6A6] mb-[7px] text-center'>
              $
              {tokensLoading
                ? '-'
                : formatNumber(
                  Number(vouchInfo.price) * Number(vouchUnlockInfo.amount),
                  { decimals: 2 }
                )}
            </p>
          </div>
        </div>


        <div className='flex mx-auto text-center flex-col relative top-[25px]'>
          <p className='text-[13px] font-medium text-[#FF8533] gap-1'>
            VOUCH Rewards Pool 
            <Tooltip 
              title={
                <div className="leading-relaxed">
                  <div className="mb-1">The VOUCH Pool is a single sided staking rewards pool for VOUCH Holders.</div>
                  <div className="mb-1">Staking VOUCH will give you Staking and Holder rewards.</div>
                  <div>Higher the Pool Allocation, means more rewards for that pool.</div>
                </div>
              } placement="top" arrow
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
          <p className='text-[13px] font-normal text-[#8E9397]'> Allocation <span className='text-color-text1'>100</span></p>
        </div>

        {/* Rewards Section */}
        <div className='grid grid-flow-col grid-rows-1 max-sm:grid-rows-2 gap-4 max-sm:gap-2 mt-[20px] pt-[21px]'>
          <div>
            <p className='text-[14px] font-medium text-[#8E9397] mb-[13px] text-center relative z-[1]'>
              Staking Rewards
            </p>
            <div className='flex max-w-[160px] justify-between mx-auto mt-[20px] mb-[8px]'>
              <p className='text-[18px] font-normal text-color-text1 text-center'>
                {loading
                  ? '...'
                  : formatNumber(pendingTripleByPid?.[1]?.vplsPending || '0', {
                    decimals: 2,
                  })}
              </p>
              <p className='text-[18px] font-normal text-[#A6A6A6] text-center'>
                vPLS
              </p>
            </div>
            <div className='flex max-w-[160px] justify-between mx-auto mb-[8px]'>
              <p className='text-[18px] font-normal text-color-text1 text-center'>
                {loading
                  ? '...'
                  : formatNumber(
                    pendingTripleByPid?.[1]?.vouchPending || '0',
                    {
                      decimals: 2,
                    }
                  )}
              </p>
              <p className='text-[18px] font-normal text-[#A6A6A6] text-center'>
                VOUCH
              </p>
            </div>
            <div className='flex max-w-[160px] justify-between mx-auto mb-[10px]'>
              <p className='text-[18px] font-normal text-color-text1 text-center'>
                {loading
                  ? '...'
                  : formatNumber(pendingTripleByPid?.[1]?.wplsPending || '0', {
                    decimals: 2,
                  })}
              </p>
              <p className='text-[18px] font-normal text-[#A6A6A6] text-center'>
                PLS
              </p>
            </div>
          </div>
          <div>
            <p className='text-[13px] font-medium text-[#8E9397] mb-[13px] text-center relative z-[1]'>
              Holder Rewards
            </p>
            <div className='flex max-w-[160px] justify-between mx-auto mt-[20px] mb-[8px]'>
              <p className='text-[18px] font-normal text-color-text1 text-center'>
                {loading
                  ? '...'
                  : formatNumber(holderRewardInfo.vplsPending, {
                    decimals: 2,
                  })}
              </p>
              <p className='text-[18px] font-normal text-[#A6A6A6] text-center mr-[8px]'>
                vPLS
              </p>
            </div>
            <div className='flex max-w-[160px] justify-between mx-auto mb-[10px]'>
              <p className='text-[18px] font-normal text-color-text1 text-center'>
                {loading
                  ? '...'
                  : formatNumber(holderRewardInfo.vouchPending, {
                    decimals: 2,
                  })}
              </p>
              <p className='text-[18px] font-normal text-[#A6A6A6] text-center mr-[8px]'>
                VOUCH
              </p>
            </div>
            <div className='flex max-w-[160px] justify-between mx-auto mb-[10px]'>
              <p className='text-[18px] font-normal text-color-text1 text-center'>
                {loading
                  ? '...'
                  : formatNumber(holderRewardInfo.plsPending, {
                    decimals: 2,
                  })}
              </p>
              <p className='text-[18px] font-normal text-[#A6A6A6] text-center mr-[8px]'>
                PLS
              </p>
            </div>
          </div>
          <div className='bg-[#cdcccc] dark:bg-[#333] h-[1px] w-[140px] absolute top-[49%]'></div>
          <div className='bg-[#cdcccc] dark:bg-[#333] h-[1px] w-[140px] absolute right-0 top-[49%]'></div>
        </div>
      </div>

      {/* Use the existing VouchStaking component */}
      <VouchStaking selectedTab={selectedTab} onTabChange={onTabChange} />

      {/* Price and Market Cap Section */}
      <div className='px-[30px]'>
        <div className='mt-[37px] flex justify-between mb-[20px]'>
          <div>
            <p className='text-[13px] font-normal text-[#A6A6A6] mb-[8px]'>
              VOUCH Price
            </p>
            <p className='text-[23px] font-normal text-color-text1'>
              ${tokensLoading ? '...' : vouchInfo.price}
            </p>
            <p className='text-[#A6A6A6] text-[13px] mt-[3px]'>
              VOUCH Token Supply:{' '}
              {tokensLoading
                ? '...'
                : formatNumber(vouchInfo.totalSupply, { decimals: 2 })}
            </p>
          </div>
          <div>
            <p className='text-[13px] font-normal text-[#A6A6A6]'>Market Cap</p>
            <p className='text-[23px] font-normal text-color-text1 mt-[9px]'>
              ${tokensLoading ? '...' : vouchInfo.marketCap}
            </p>
          </div>
        </div>
      </div>

      <div className='mt-[24px] px-[30px]'>
        <div className='h-[38px] border border-[#333] rounded-[8px] p-[3px] flex'>
            <div 
              className='bg-[#4F8CEF] rounded-l-[6px]' 
              style={{ width: `${vouchUnstakingPercent}%` }}
            ></div>
            <div 
              className='bg-gradient-to-r from-[#ff8533] to-[#ffa162]' 
              style={{ width: `${vouchStakedPercent}%` }}
            ></div>
            <div 
              className='bg-[#333] rounded-r-[6px]' 
              style={{ width: `${vouchOtherPercent}%` }}
            ></div>
        </div>
        <div className='flex align-middle justify-between mt-[40px]'>
          <div>
            <p className='text-[#A6A6A6] text-[13px] font-medium'>Unstaking</p>
            <div className='flex gap-[6px] mt-[10px]'>
              <div className='h-[11px] w-[11px] rounded-[2px] bg-[#4F8CEF]'></div>
             <p className='text-[13px] font-normal text-[#A6A6A6]'>
                      {loading
                        ? '...'
                        : formatNumber(totalVouchUnlocking, {
                            decimals: 2,
                          })}{' '}
                    </p>
            </div>
          </div>
          <div>
            <p className='text-[#A6A6A6] text-[13px] font-medium'>Staked</p>
            <div className='flex gap-[6px] mt-[10px]'>
              <div className='h-[11px] w-[11px] rounded-[2px] bg-gradient-to-r from-[#ff8533] to-[#ffa162]'></div>
                <p className='text-[13px] font-normal text-[#A6A6A6]'>
                       {loading
                         ? '-'
                         : formatNumber(
                             Web3.utils.fromWei(
                               vouchPoolInfo.totalStaked,
                               'ether'
                             ),
                             {
                               decimals: 2,
                             }
                           )}{' '}
                      </p>
            </div>
          </div>
          <div>
            <p className='text-[#A6A6A6] text-[13px] font-medium'>Total Supply</p>
            <div className='flex gap-[6px] mt-[10px]'>
              <div className='h-[11px] w-[11px] rounded-[2px] bg-[#333]'></div>
              <p className='text-[13px] font-normal text-[#A6A6A6]'>
                      {tokensLoading
                        ? '...'
                        : formatNumber(vouchInfo.totalSupply, {
                            decimals: 2,
                          })}{' '}
                    </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
