import React, { useState } from 'react';
import { useCapitalPools } from 'hooks/useCapitalPools';
import { useCapitalPoolsLegacy } from 'hooks/useCapitalPoolsLegacy';
import { useLpFarms } from 'hooks/useLpFarms';
import { CapitalPoolCard } from 'components/staking/CapitalPoolCard';
import { CapitalPoolCardLegacy } from 'components/staking/CapitalPoolCardLegacy';
import { RewardPoolCard } from 'components/staking/RewardPoolCard';
import { RewardPoolCardLegacy } from 'components/staking/RewardPoolCardLegacy';
import { LpStakingCard } from 'components/lp-farms/LpStakingCard';
import classNames from 'classnames';

export default function StakingPools() {
  const [mainTab, setMainTab] = useState<'new' | 'legacy' | 'lp'>('new');
  const [vouchTab, setVouchTab] = useState<'stake' | 'unstake'>('stake');
  const [legacyTab, setLegacyTab] = useState<'stake' | 'unstake'>('unstake');

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

  const {
    capitalPools: capitalPoolsLegacy,
    loading: capitalPoolsLegacyLoading,
    checkVplsAllowance: checkVplsAllowanceLegacy,
    approveVpls: approveVplsLegacy,
    depositVpls: depositVplsLegacy,
    depositPls: depositPlsLegacy,
    startUnlock: startUnlockLegacy,
    cancelUnlock: cancelUnlockLegacy,
    finalizeUnlock: finalizeUnlockLegacy,
    claimEmissions: claimEmissionsLegacy,
    refreshData: refreshCapitalPoolsLegacy,
  } = useCapitalPoolsLegacy();

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
      <div className='max-w-[1360px] bg-color-bg2 border-color-border1 border justify-center m-auto rounded-[30px] min-h-[800px] flex flex-col'>
        <div className='flex gap-[10px] bg-[#cdcabb] dark:bg-[#2a2a2a] rounded-tl-[30px] rounded-tr-[30px]'>
          <div
            className={classNames(
              'flex-1 py-[20px] cursor-pointer text-center text-[24px] max-md:text-[20px] max-sm:text-[16px] font-normal transition-colors rounded-tl-[30px] rounded-tr-[30px]',
              mainTab === 'new'
                ? 'bg-gradient-to-r from-[#ff8533] to-[#ffa162] text-[#000]'
                : 'bg-[#e2e0d0] dark:bg-[#333] text-color-text1'
            )}
            onClick={() => setMainTab('new')}
          >
            Vouch Token Staking Pools
          </div>
          <div
            className={classNames(
              'flex-1 py-[20px] cursor-pointer text-center text-[24px] max-md:text-[20px] max-sm:text-[16px] font-normal transition-colors rounded-tl-[30px] rounded-tr-[30px]',
              mainTab === 'legacy'
                ? 'bg-gradient-to-r from-[#ff8533] to-[#ffa162] text-[#000]'
                : 'bg-[#e2e0d0] dark:bg-[#333] text-color-text1'
            )}
            onClick={() => setMainTab('legacy')}
          >
            Old Pools (Unstake Only)
          </div>
          <div
            className={classNames(
              'flex-1 py-[20px] cursor-pointer text-center text-[24px] max-md:text-[20px] max-sm:text-[16px] font-normal transition-colors rounded-tl-[30px] rounded-tr-[30px]',
              mainTab === 'lp'
                ? 'bg-gradient-to-r from-[#ff8533] to-[#ffa162] text-[#000]'
                : 'bg-[#e2e0d0] dark:bg-[#333] text-color-text1'
            )}
            onClick={() => setMainTab('lp')}
          >
            LP Token Staking Pools
          </div>
        </div>

        <div className='px-[35px] max-sm:px-[21px] py-[40px] border border-[#FE8A3C] rounded-b-[30px] flex-1 flex flex-col'>
          {mainTab === 'new' ? (
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-5 relative'>
              <div className='hidden lg:block bg-[#FE8A3C] h-[calc(100%-180px)] w-[1px] absolute left-[50%] top-[110px]'></div>
              
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

              <div>
                <RewardPoolCard selectedTab={vouchTab} onTabChange={setVouchTab} />
              </div>
            </div>
          ) : mainTab === 'legacy' ? (
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-5 relative'>
              <div className='hidden lg:block bg-[#FE8A3C] h-[calc(100%-180px)] w-[1px] absolute left-[50%] top-[110px]'></div>
              
              <div>
                {capitalPoolsLegacyLoading && capitalPoolsLegacy.length === 0 ? (
                  <div className='text-center py-[40px] text-color-text1'>
                    Loading legacy pools...
                  </div>
                ) : capitalPoolsLegacy.length > 0 ? (
                  capitalPoolsLegacy.map((pool) => (
                    <CapitalPoolCardLegacy
                      key={pool.address}
                      poolData={pool}
                      checkVplsAllowance={checkVplsAllowanceLegacy}
                      onApproveVpls={approveVplsLegacy}
                      onDepositVpls={depositVplsLegacy}
                      onDepositPls={depositPlsLegacy}
                      onStartUnlock={startUnlockLegacy}
                      onCancelUnlock={cancelUnlockLegacy}
                      onFinalizeUnlock={finalizeUnlockLegacy}
                      onClaimEmissions={claimEmissionsLegacy}
                      refreshData={refreshCapitalPoolsLegacy}
                    />
                  ))
                ) : (
                  <div className='text-center py-[40px] text-color-text1'>
                    No legacy pools available
                  </div>
                )}
              </div>

              <div>
                <RewardPoolCardLegacy selectedTab={legacyTab} onTabChange={setLegacyTab} />
              </div>
            </div>
          ) : (
            <div>
              {lpLoading && lpPools.length === 0 ? (
                <div className='text-center py-[40px] text-color-text1'>
                  Loading LP pools...
                </div>
              ) : lpPools.length === 0 ? (
                <div className='text-center py-[40px] text-color-text1'>
                  LP Pools Coming Soon
                </div>
              ) : (
                <div className='grid grid-cols-2 gap-2 max-md:grid-cols-1 items-stretch'>
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