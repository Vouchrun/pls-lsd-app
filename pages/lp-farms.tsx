import React, { useState, useCallback } from 'react';
import { useLpFarms } from 'hooks/useLpFarms';
import { LpStakingCard } from 'components/lp-farms/LpStakingCard';

export default function LpFarms() {
  const {
    lpPoolsData,
    lpPools,
    loading,
    checkAllowance,
    approve,
    stake,
    unstake,
    claim,
    refreshData,
  } = useLpFarms();

  return (
    <>
      <div className='max-w-[1320px] w-full mx-auto mt-[18px] rounded-[30px] bg-[#1A1A1A] border-[1px] border-solid border-[#333] mb-[60px]'>
        <div className='h-[55px] mx-auto flex align-middle justify-center items-center bg-[#333] rounded-t-[30px]'>
          <p className='text-[#E8EFFD] text-[24px] font-normal text-center'>
            LP Token Staking Pools
          </p>
        </div>
        <div className='py-[20px] px-[70px] max-xl:px-[40px] max-md:px-[30px] max-sm:px-[18px]'>
          {loading && lpPools.length === 0 ? (
            <div className='text-center py-[40px] text-[#A6A6A6]'>
              Loading pools...
            </div>
          ) : lpPools.length === 0 ? (
            <div className='text-center py-[40px] text-[#A6A6A6]'>
              No LP pools available
            </div>
          ) : (
            <div className='grid grid-cols-2 gap-1 max-md:grid-cols-1'>
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
                    refreshData={refreshData}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
