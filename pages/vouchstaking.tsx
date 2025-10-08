import React, { useState } from 'react';
import { Icomoon } from 'components/icon/Icomoon';
import { VplsStaking } from 'components/staking/VplsStaking';
import { VouchStaking } from 'components/staking/VouchStaking';
import { useVouchStaking } from 'hooks/useVouchStaking';
import { useVouchTokens } from 'hooks/useVouchTokens';
import { formatNumber } from 'utils/numberUtils';
import { useApr } from 'hooks/useApr';
import Web3 from 'web3';

export default function Vouchstaking() {
  const {
    pendingRewards,
    holderRewardInfo,
    dripRedeemed,
    pendingTripleByPid,
    userTotalVouchStaked,
    userTotalVplsStaked,
    totalVouchUnlocking,
    totalVplsUnlocking,
    loading,
    vplsPoolInfo,
    vouchPoolInfo,
    claimAllHolderRewards,
    refreshData,
  } = useVouchStaking();

  const {
    vouchBalance,
    vplsBalance,
    plsBalance,
    vouchInfo,
    vplsInfo,
    loading: tokensLoading,
  } = useVouchTokens();

  const [isClaimingHolderRewards, setIsClaimingHolderRewards] = useState(false);

  // Tab states for each side
  const [vplsTab, setVplsTab] = useState<'stake' | 'unstake'>('stake');
  const [vouchTab, setVouchTab] = useState<'stake' | 'unstake'>('stake');
  const { apr, yearlyApr } = useApr();

  // Calculate bar chart percentages for VPLS
  const vplsUnstakingAmount = Number(totalVplsUnlocking) || 0;
  const vplsStakedAmount = Number(userTotalVplsStaked) || 0;
  const vplsTotalSupply = Number(vplsInfo.totalSupply) || 1;
  const vplsRemainingSupply = Math.max(
    0,
    vplsTotalSupply - vplsStakedAmount - vplsUnstakingAmount
  );

  const vplsUnstakingPercent = (vplsUnstakingAmount / vplsTotalSupply) * 100;
  const vplsStakedPercent = (vplsStakedAmount / vplsTotalSupply) * 100;
  const vplsRemainingPercent = (vplsRemainingSupply / vplsTotalSupply) * 100;

  // Calculate bar chart percentages for VOUCH
  const vouchUnstakingAmount = Number(totalVouchUnlocking) || 0;
  const vouchStakedAmount = Number(userTotalVouchStaked) || 0;
  const vouchTotalSupply = Number(vouchInfo.totalSupply) || 1;
  const vouchRemainingSupply = Math.max(
    0,
    vouchTotalSupply - vouchStakedAmount - vouchUnstakingAmount
  );

  const vouchUnstakingPercent = (vouchUnstakingAmount / vouchTotalSupply) * 100;
  const vouchStakedPercent = (vouchStakedAmount / vouchTotalSupply) * 100;
  const vouchRemainingPercent = (vouchRemainingSupply / vouchTotalSupply) * 100;

  const handleClaimHolderRewards = async () => {
    try {
      setIsClaimingHolderRewards(true);
      await claimAllHolderRewards();
      await refreshData();
    } catch (error) {
      console.error('Error claiming holder rewards:', error);
    } finally {
      setIsClaimingHolderRewards(false);
    }
  };

  return (
    <div className=' mt-[37px] px-[30px] max-md:px-[15px] pt-[40px]'>
      <div className='max-w-[1360px] bg-color-bg2 border-color-border1 border justify-center m-auto rounded-[30px] h-[1200px] max-lg:h-auto'>
        <div className='py-[20px] mb-[16px] bg-[#333] rounded-t-[30px] rounded-t-0'>
          <p className='text-[24px] max-md:text-[20px] font-normal text-[#E8EFFD] text-center'>
            My Vouch Holdings
          </p>
        </div>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 px-[35px] max-sm:px-[21px] relative'>
          <div className='bg-[#FE8A3C] h-[1000px] w-[1px] absolute left-[50%] max-lg:bg-transparent'></div>
          {/* <div className='bg-[#333] h-[6px] w-[6px] absolute left-[49.8%] origin-center rotate-45 max-lg:bg-transparent'></div> */}
          {/* <div className='bg-[#333] h-[6px] w-[6px] absolute left-[49.8%] bottom-[-24px] origin-center rotate-45 max-lg:bg-transparent'></div> */}
          <div className=' '>
            <div className='flex items-center mb-[37px]'>
              <div className='w-[66px] h-[66px] mr-[16px]'>
                <img src='/images/token/vPLS_trans.svg' alt='icon' />
              </div>
              <div>
                <p className='text-[18px] font-normal text-[#FFFBFA] flex mb-[10px]'>
                  vPLS
                  <a
                    href='#'
                    className='ml-[.06rem] flex items-center m-l-[2px]'
                  >
                    <Icomoon icon='share' size='.12rem' color='#FFF' />
                  </a>
                </p>
                <p className='text-[13px] font-normal text-[#A6A6A6] mt-[3px]'>
                  The Liquid Staking Token of Vouch. Stake to receive Rewards.
                </p>
              </div>
            </div>
            <div className='flex justify-between'>
              <div>
                <p className='text-[15px] font-normal text-[#FFFBFA] mb-[6px]'>
                  Available Balance
                </p>
                <p className='text-[28px] max-sm:text-[22px] font-normal text-[#A6A6A6]'>
                  <span className='text-[#FFFBFA] mr-[3px]'>
                    {tokensLoading
                      ? '...'
                      : formatNumber(vplsBalance.balance, { decimals: 4 })}
                  </span>
                  vPLS
                </p>
              </div>
              <button className='text-[15px] font-normal text-[#FFFBFA] border-[#333] hover:border-[#fff] border rounded-[4px] px-[17px] max-sm:px-[11px]'>
                Stake PLS
              </button>
            </div>
            <div className='border-color-border1 border rounded-[8px] my-[37px] relative p-l[8px]'>
              <div className='grid grid-cols-2 gap-4 py-[18px]'>
                {/* Staked Column */}
                <div className='flex flex-col items-center'>
                  <p className='text-[14px] font-medium text-[#8E9397] mb-[7px] text-center'>
                    Staked <Icomoon icon='tip' size='.12rem' color='#333333' />
                  </p>
                  <p className='text-[16px] font-normal text-[#A6A6A6] mb-[7px] text-center'>
                    <span className='text-[#FFFBFA] mr-[3px]'>
                      {loading
                        ? '...'
                        : formatNumber(userTotalVplsStaked, { decimals: 4 })}
                    </span>
                    vPLS
                  </p>
                  <p className='text-[13px] font-medium text-[#A6A6A6] mb-[7px] text-center'>
                    $
                    {tokensLoading
                      ? '...'
                      : Number(vplsInfo.price) * Number(userTotalVplsStaked)}
                  </p>
                </div>

                {/* Unstaking Column */}
                <div className='flex flex-col items-center'>
                  <p className='text-[14px] font-medium text-[#8E9397] mb-[7px] text-center'>
                    Unstaking{' '}
                    <Icomoon icon='tip' size='.12rem' color='#333333' />
                  </p>
                  <p className='text-[16px] font-normal text-[#A6A6A6] mb-[7px] text-center'>
                    <span className='text-[#FFFBFA] mr-[3px]'>
                      {loading
                        ? '-'
                        : formatNumber(totalVouchUnlocking, { decimals: 4 })}
                    </span>
                    vPLS
                  </p>
                  <p className='text-[13px] font-medium text-[#A6A6A6] mb-[7px] text-center'>
                    $
                    {tokensLoading
                      ? '-'
                      : Number(vplsInfo.price) * Number(totalVplsUnlocking)}
                  </p>
                </div>
              </div>
              <div className='grid grid-flow-col grid-rows-1 max-sm:grid-rows-2 gap-4 max-sm:gap-1 mt-[20px]'>
                <div>
                  <p className='text-[14px] font-medium text-[#8E9397] mb-[13px] text-center relative z-[1]'>
                    Staking Rewards
                  </p>
                  <div className='flex max-w-[160px] justify-between mx-auto mt-[20px] mb-[8px]'>
                    <p className='text-[18px] font-normal text-[#FFFBFA] text-center'>
                      {loading
                        ? '...'
                        : formatNumber(
                            pendingTripleByPid?.[2]?.vplsPending || '0',
                            {
                              decimals: 6,
                            }
                          )}
                    </p>
                    <p className='text-[18px] font-normal text-[#A6A6A6] text-center'>
                      {' '}
                      vPLS
                    </p>
                  </div>
                  <div className='flex max-w-[160px] justify-between mx-auto mb-[8px]'>
                    <p className='text-[18px] font-normal text-[#FFFBFA] text-center'>
                      {loading
                        ? '...'
                        : formatNumber(
                            pendingTripleByPid?.[2]?.vouchPending || '0',
                            {
                              decimals: 6,
                            }
                          )}
                    </p>
                    <p className='text-[18px] font-normal text-[#A6A6A6] text-center'>
                      {' '}
                      VOUCH
                    </p>
                  </div>
                  <div className='flex max-w-[160px] justify-between mx-auto mb-[10px]'>
                    <p className='text-[18px] font-normal text-[#FFFBFA] text-center'>
                      {loading
                        ? '...'
                        : formatNumber(
                            pendingTripleByPid?.[2]?.wplsPending || '0',
                            {
                              decimals: 6,
                            }
                          )}
                    </p>
                    <p className='text-[18px] font-normal text-[#A6A6A6] text-center'>
                      {' '}
                      PLS
                    </p>
                  </div>
                </div>
                <div>
                  <p className='text-[13px] font-medium text-[#8E9397] mb-[13px] text-center relative z-[1]'>
                    Holder APR
                  </p>
                  <div className='flex max-w-[160px] justify-between mx-auto mt-[20px] mb-[8px]'>
                    <p className='text-[18px] font-normal text-[#FFFBFA] text-center'>
                      {formatNumber(apr, { decimals: 2 })}%
                    </p>
                    <p className='text-[18px] font-normal text-[#A6A6A6] text-center mr-[8px]'>
                      {' '}
                      7 Day Avg
                    </p>
                  </div>
                  <div className='flex max-w-[160px] justify-between mx-auto mb-[10px]'>
                    <p className='text-[18px] font-normal text-[#FFFBFA] text-center'>
                      {formatNumber(yearlyApr, { decimals: 2 })}%
                    </p>
                    <p className='text-[18px] font-normal text-[#A6A6A6] text-center mr-[8px]'>
                      {' '}
                      1 Yr Avg
                    </p>
                  </div>
                </div>
                <div className='bg-[#333] h-[1px] w-[45px] absolute top-[49%]'></div>
                <div className='bg-[#333] h-[1px] w-[45px] absolute right-0 top-[49%]'></div>
              </div>
            </div>
            <div>
              <VplsStaking selectedTab={vplsTab} onTabChange={setVplsTab} />
            </div>
            <div className='px-[30px]'>
              <div className='mt-[37px] flex justify-between mb-[20px]'>
                <div>
                  <p className='text-[13px] font-normal text-[#A6A6A6] mb-[8px]'>
                    VPLS Price
                  </p>
                  <p className='text-[23px] font-normal text-[#FFFBFA]'>
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
                  <p className='text-[13px] font-normal text-[#A6A6A6]'>
                    Market Cap
                  </p>
                  <p className='text-[23px] font-normal text-[#FFFBFA] mt-[9px]'>
                    ${tokensLoading ? '...' : vplsInfo.marketCap}
                  </p>
                </div>
              </div>
              <div className='border-color-border1 border rounded-[8px] p-[3px] flex'>
                <div
                  className='h-[36px] rounded-l-[6px]'
                  style={{
                    width: `${vplsUnstakingPercent}%`,
                    backgroundColor: '#4F8CEF',
                  }}
                ></div>
                <div
                  className='bg-gradient-to-r from-[#ff8533] via-[#ffa162] to-[#ff8c3e] h-[36px]'
                  style={{ width: `${vplsStakedPercent}%` }}
                ></div>
                <div
                  className='h-[36px] rounded-r-[6px]'
                  style={{
                    width: `${vplsRemainingPercent}%`,
                    backgroundColor: '#333333',
                  }}
                ></div>
              </div>

              <div className='mt-[37px] flex justify-between mb-[20px]'>
                <div>
                  <p className='text-[13px] font-medium text-[#A6A6A6] mb-[8px]'>
                    Unstaking
                  </p>
                  <div className='flex items-center mt-[10px]'>
                    <div
                      className='h-[11px] w-[11px] rounded-[2px] mr-[6px]'
                      style={{ backgroundColor: '#4F8CEF' }}
                    ></div>
                    <p className='text-[13px] font-normal text-[#A6A6A6]'>
                      {loading
                        ? '...'
                        : formatNumber(totalVplsUnlocking, {
                            decimals: 2,
                          })}{' '}
                    </p>
                  </div>
                </div>
                <div>
                  <p className='text-[13px] font-medium text-[#A6A6A6] mb-[8px]'>
                    Staked
                  </p>
                  <div className='flex items-center mt-[10px]'>
                    <div className='h-[11px] w-[11px] rounded-[2px] mr-[6px] bg-gradient-to-r from-[#ff8533] to-[#ffa162]'></div>
                    <p className='text-[13px] font-normal text-[#A6A6A6]'>
                      {loading
                        ? '-'
                        : formatNumber(
                            Web3.utils.fromWei(
                              vplsPoolInfo.totalStaked,
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
                  <p className='text-[13px] font-medium text-[#A6A6A6]'>
                    Total Supply
                  </p>
                  <div className='flex items-center mt-[10px]'>
                    <div
                      className='h-[11px] w-[11px] rounded-[2px] mr-[6px]'
                      style={{ backgroundColor: '#333333' }}
                    ></div>
                    <p className='text-[13px] font-normal text-[#A6A6A6]'>
                      {tokensLoading
                        ? '...'
                        : formatNumber(vplsInfo.totalSupply, {
                            decimals: 2,
                          })}{' '}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* col2 */}
          <div className=' '>
            <div className='flex items-center mb-[37px]'>
              <div className='w-[66px] h-[66px] mr-[16px]'>
                <img
                  src='/favicon.png'
                  alt='icon'
                  className='w-[66px] h-[66px] '
                />
              </div>
              <div>
                <p className='text-[18px] font-normal text-[#FFFBFA] flex mb-[10px]'>
                  VOUCH
                  <a
                    href='#'
                    className='ml-[.06rem] flex items-center m-l-[2px]'
                  >
                    <Icomoon icon='share' size='.12rem' color='#FFF' />
                  </a>
                </p>
                <p className='text-[13px] font-normal text-[#A6A6A6] mt-[3px]'>
                  The Liquid Staking Token of Vouch. Stake to receive Rewards.
                </p>
              </div>
            </div>
            <div className='flex justify-between'>
              <div>
                <p className='text-[15px] font-normal text-[#FFFBFA] mb-[6px]'>
                  Available Balance
                </p>
                <p className='text-[28px] font-normal text-[#A6A6A6]'>
                  <span className='text-[#FFFBFA] mr-[3px]'>
                    {tokensLoading
                      ? '...'
                      : formatNumber(vouchBalance.balance, { decimals: 4 })}
                  </span>
                  VOUCH
                </p>
              </div>
              <button className='text-[15px] font-normal text-[#FFFBFA] border-[#333] hover:border-[#fff] border rounded-[4px] px-[17px]'>
                BUY VOUCH
              </button>
            </div>
            <div className='border-color-border1 border rounded-[8px] my-[37px] relative p-l[8px]'>
              <div className='grid grid-cols-2 gap-4 py-[18px]'>
                {/* Staked Column */}
                <div className='flex flex-col items-center'>
                  <p className='text-[14px] font-medium text-[#8E9397] mb-[7px] text-center'>
                    Staked <Icomoon icon='tip' size='.12rem' color='#333333' />
                  </p>
                  <p className='text-[16px] font-normal text-[#A6A6A6] mb-[7px] text-center'>
                    <span className='text-[#FFFBFA] mr-[3px]'>
                      {loading
                        ? '...'
                        : formatNumber(userTotalVouchStaked, { decimals: 4 })}
                    </span>
                    VOUCH
                  </p>
                  <p className='text-[13px] font-medium text-[#A6A6A6] mb-[7px] text-center'>
                    $
                    {tokensLoading
                      ? '-'
                      : Number(vouchInfo.price) * Number(userTotalVouchStaked)}
                  </p>
                </div>

                {/* Unstaking Column */}
                <div className='flex flex-col items-center'>
                  <p className='text-[14px] font-medium text-[#8E9397] mb-[7px] text-center'>
                    Unstaking{' '}
                    <Icomoon icon='tip' size='.12rem' color='#333333' />
                  </p>
                  <p className='text-[16px] font-normal text-[#A6A6A6] mb-[7px] text-center'>
                    <span className='text-[#FFFBFA] mr-[3px]'>
                      {loading
                        ? '...'
                        : formatNumber(totalVouchUnlocking, { decimals: 4 })}
                    </span>
                    VOUCH
                  </p>
                  <p className='text-[13px] font-medium text-[#A6A6A6] mb-[7px] text-center'>
                    $
                    {tokensLoading
                      ? '-'
                      : Number(vouchInfo.price) * Number(totalVouchUnlocking)}
                  </p>
                </div>
              </div>

              <div className='grid grid-flow-col grid-rows-1 max-sm:grid-rows-2 gap-4 max-sm:gap-2 mt-[20px]'>
                <div>
                  <p className='text-[14px] font-medium text-[#8E9397] mb-[13px] text-center relative z-[1]'>
                    Staking Rewards
                  </p>
                  <div className='flex max-w-[160px] justify-between mx-auto mt-[20px] mb-[8px]'>
                    <p className='text-[18px] font-normal text-[#FFFBFA] text-center'>
                      {loading
                        ? '...'
                        : formatNumber(
                            pendingTripleByPid?.[1]?.vplsPending || '0',
                            {
                              decimals: 6,
                            }
                          )}
                    </p>
                    <p className='text-[18px] font-normal text-[#A6A6A6] text-center'>
                      {' '}
                      vPLS
                    </p>
                  </div>
                  <div className='flex max-w-[160px] justify-between mx-auto mb-[8px]'>
                    <p className='text-[18px] font-normal text-[#FFFBFA] text-center'>
                      {loading
                        ? '...'
                        : formatNumber(
                            pendingTripleByPid?.[1]?.vouchPending || '0',
                            {
                              decimals: 6,
                            }
                          )}
                    </p>
                    <p className='text-[18px] font-normal text-[#A6A6A6] text-center'>
                      {' '}
                      VOUCH
                    </p>
                  </div>
                  <div className='flex max-w-[160px] justify-between mx-auto mb-[10px]'>
                    <p className='text-[18px] font-normal text-[#FFFBFA] text-center'>
                      {loading
                        ? '...'
                        : formatNumber(
                            pendingTripleByPid?.[1]?.wplsPending || '0',
                            {
                              decimals: 6,
                            }
                          )}
                    </p>
                    <p className='text-[18px] font-normal text-[#A6A6A6] text-center'>
                      {' '}
                      PLS
                    </p>
                  </div>
                </div>
                <div>
                  <p className='text-[13px] font-medium text-[#8E9397] mb-[13px] text-center relative z-[1]'>
                    Holder Rewards
                  </p>
                  <div className='flex max-w-[160px] justify-between mx-auto mt-[20px] mb-[8px]'>
                    <p className='text-[18px] font-normal text-[#FFFBFA] text-center'>
                      {loading
                        ? '...'
                        : formatNumber(holderRewardInfo.vplsPending, {
                            decimals: 6,
                          })}
                    </p>
                    <p className='text-[18px] font-normal text-[#A6A6A6] text-center mr-[8px]'>
                      {' '}
                      vPLS
                    </p>
                  </div>
                  <div className='flex max-w-[160px] justify-between mx-auto mb-[10px]'>
                    <p className='text-[18px] font-normal text-[#FFFBFA] text-center'>
                      {loading
                        ? '...'
                        : formatNumber(holderRewardInfo.vouchPending, {
                            decimals: 6,
                          })}
                    </p>
                    <p className='text-[18px] font-normal text-[#A6A6A6] text-center mr-[8px]'>
                      {' '}
                      VOUCH
                    </p>
                  </div>
                  <div className='flex max-w-[160px] justify-between mx-auto mb-[10px]'>
                    <p className='text-[18px] font-normal text-[#FFFBFA] text-center'>
                      {loading
                        ? '...'
                        : formatNumber(holderRewardInfo.plsPending, {
                            decimals: 6,
                          })}
                    </p>
                    <p className='text-[18px] font-normal text-[#A6A6A6] text-center mr-[8px]'>
                      {' '}
                      PLS
                    </p>
                  </div>
                </div>
                <div className='bg-[#333] h-[1px] w-[45px] absolute top-[49%]'></div>
                <div className='bg-[#333] h-[1px] w-[45px] absolute right-0 top-[49%]'></div>
              </div>

              {/* Claim Holder Rewards Button */}
              {/* <div className='mt-[20px] text-center'>
                <button
                  onClick={handleClaimHolderRewards}
                  disabled={isClaimingHolderRewards || loading}
                  className='text-[15px] font-normal text-[#FFFBFA] bg-[#333] hover:bg-[#444] disabled:opacity-50 disabled:cursor-not-allowed border-[#333] hover:border-[#fff] border rounded-[4px] px-[20px] py-[8px] transition-colors duration-200'
                >
                  {isClaimingHolderRewards
                    ? 'Claiming...'
                    : 'Claim Holder Rewards'}
                </button>
              </div> */}
            </div>
            <div>
              <VouchStaking selectedTab={vouchTab} onTabChange={setVouchTab} />
            </div>
            <div></div>
            <div className='px-[30px]'>
              <div className='mt-[37px] flex justify-between mb-[20px]'>
                <div>
                  <p className='text-[13px] font-normal text-[#A6A6A6] mb-[8px]'>
                    VOUCH Price
                  </p>
                  <p className='text-[23px] font-normal text-[#FFFBFA]'>
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
                  <p className='text-[13px] font-normal text-[#A6A6A6]'>
                    Market Cap
                  </p>
                  <p className='text-[23px] font-normal text-[#FFFBFA] mt-[9px]'>
                    ${tokensLoading ? '...' : vouchInfo.marketCap}
                  </p>
                </div>
              </div>
              <div className='border-color-border1 border rounded-[8px] p-[3px] flex'>
                <div
                  className='h-[36px] rounded-l-[6px]'
                  style={{
                    width: `${vouchUnstakingPercent}%`,
                    backgroundColor: '#4F8CEF',
                  }}
                ></div>
                <div
                  className='bg-gradient-to-r from-[#ff8533] via-[#ffa162] to-[#ff8c3e] h-[36px]'
                  style={{ width: `${vouchStakedPercent}%` }}
                ></div>
                <div
                  className='h-[36px] rounded-r-[6px]'
                  style={{
                    width: `${vouchRemainingPercent}%`,
                    backgroundColor: '#333333',
                  }}
                ></div>
              </div>
              <div className='mt-[37px] flex justify-between mb-[20px]'>
                <div>
                  <p className='text-[13px] font-medium text-[#A6A6A6] mb-[8px]'>
                    Unstaking
                  </p>
                  <div className='flex items-center mt-[10px]'>
                    <div
                      className='h-[11px] w-[11px] rounded-[2px] mr-[6px]'
                      style={{ backgroundColor: '#4F8CEF' }}
                    ></div>
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
                  <p className='text-[13px] font-medium text-[#A6A6A6] mb-[8px]'>
                    Staked
                  </p>
                  <div className='flex items-center mt-[10px]'>
                    <div className='h-[11px] w-[11px] rounded-[2px] mr-[6px] bg-gradient-to-r from-[#ff8533] to-[#ffa162]'></div>
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
                  <p className='text-[13px] font-medium text-[#A6A6A6]'>
                    Total Supply
                  </p>
                  <div className='flex items-center mt-[10px]'>
                    <div
                      className='h-[11px] w-[11px] rounded-[2px] mr-[6px]'
                      style={{ backgroundColor: '#333333' }}
                    ></div>
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
        </div>
      </div>
    </div>
  );
}
