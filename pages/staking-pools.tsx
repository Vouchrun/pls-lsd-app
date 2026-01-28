import React, { useState, useMemo } from 'react';
import { useCapitalPools } from 'hooks/useCapitalPools';
import { useLpFarms } from 'hooks/useLpFarms';
import { CapitalPoolCard } from 'components/staking/CapitalPoolCard';
import { RewardPoolCard } from 'components/staking/RewardPoolCard';
import { LpStakingCard } from 'components/lp-farms/LpStakingCard';
import classNames from 'classnames';

export default function StakingPools() {
  const [mainTab, setMainTab] = useState<'vouch' | 'lp'>('vouch');
  const [vouchTab, setVouchTab] = useState<'stake' | 'unstake'>('stake');

  // Capital Pools hook
  const {
    capitalPools,
    loading: capitalPoolsLoading,
    checkVplsAllowance,
    approveVpls,
    depositVpls,
    depositPls,
    startUnlock,
    cancelUnlock,
    finalizeUnlock,
    claimEmissions,
    refreshData: refreshCapitalPools,
  } = useCapitalPools();

  // LP Farms hook
  const {
    lpPoolsData,
    lpPools,
    loading: lpLoading,
    checkAllowance,
    approve,
    stake,
    unstake,
    claim,
    refreshData: refreshLpFarms,
  } = useLpFarms();

  return (
    <div className='mt-[37px] px-[30px] max-md:px-[15px] pt-[40px]'>
      <div className='max-w-[1360px] bg-color-bg2 border-color-border1 border  justify-center m-auto rounded-[30px] min-h-[800px]'>
        {/* Main Tab Headers */}
        <div className='flex bg-[#333] rounded-tl-[30px] rounded-tr-[30px] '>
          <div
            className={classNames(
              'flex-1 py-[20px] cursor-pointer text-center text-[24px] max-md:text-[20px] font-normal transition-colors rounded-tl-[30px] rounded-tr-[30px]',
              mainTab === 'vouch'
                ? 'bg-gradient-to-r from-[#ff8533] to-[#ffa162] text-[#000]'
                : 'bg-[#e2e0d0] dark:bg-[#333] text-color-text1'
            )}
            onClick={() => setMainTab('vouch')}
          >
            Vouch Token Staking Pools
          </div>
          <div
            className={classNames(
              'flex-1 py-[20px] cursor-pointer text-center text-[24px] max-md:text-[20px] font-normal transition-colors rounded-tl-[30px] rounded-tr-[30px]',
              mainTab === 'lp'
                ? 'bg-gradient-to-r from-[#ff8533] to-[#ffa162] text-[#000]'
                : 'bg-[#e2e0d0] dark:bg-[#333] text-color-text1'
            )}
            onClick={() => setMainTab('lp')}
          >
            LP Token Staking Pools
          </div>
        </div>

        {/* Tab Content */}
        <div className='px-[35px] max-sm:px-[21px] py-[40px] border border-[#FE8A3C] rounded-b-[30px]'>
          {mainTab === 'vouch' ? (
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-5 relative'>
              {/* Vertical separator for desktop */}
              <div className='bg-[#FE8A3C] h-[calc(100%-80px)] w-[1px] absolute left-[50%] top-[40px] max-lg:bg-transparent'></div>
              
              {/* Left Side - Capital Pools */}
              <div>
                {capitalPoolsLoading && capitalPools.length === 0 ? (
                  <div className='text-center py-[40px] text-color-text1'>
                    Loading capital pools...
                  </div>
                ) : capitalPools.length > 0 ? (
                  capitalPools.map((pool) => (
                    <CapitalPoolCard
                      key={pool.address}
                      poolData={pool}
                      checkVplsAllowance={checkVplsAllowance}
                      onApproveVpls={approveVpls}
                      onDepositVpls={depositVpls}
                      onDepositPls={depositPls}
                      onStartUnlock={startUnlock}
                      onCancelUnlock={cancelUnlock}
                      onFinalizeUnlock={finalizeUnlock}
                      onClaimEmissions={claimEmissions}
                      refreshData={refreshCapitalPools}
                    />
                  ))
                ) : (
                  <div className='text-center py-[40px] text-color-text1'>
                    No capital pools available
                  </div>
                )}
              </div>

              {/* Right Side - Reward Pool (VOUCH) */}
              <div>
                <RewardPoolCard selectedTab={vouchTab} onTabChange={setVouchTab} />
              </div>
            </div>
          ) : (
            <div>
              {/* LP Token Staking Pools */}
              {lpLoading && lpPools.length === 0 ? (
                <div className='text-center py-[40px] text-color-text1'>
                  Loading LP pools...
                </div>
              ) : lpPools.length === 0 ? (
                <div className='text-center py-[40px] text-color-text1'>
                  No LP pools available
                </div>
              ) : (
                <div className='grid grid-cols-2 gap-2 max-md:grid-cols-1'>
                  {lpPools.map((pool) => {
                    const poolData = lpPoolsData[pool.pid];
                    if (!poolData) return null;

                    return (
                      <LpStakingCard
                        key={pool.pid}
                        poolData={poolData}
                        checkAllowance={checkAllowance}
                        onApprove={approve}
                        onStake={stake}
                        onUnstake={unstake}
                        onClaim={claim}
                        refreshData={refreshLpFarms}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
