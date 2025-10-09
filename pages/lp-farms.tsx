import React, { useState, useCallback } from 'react';
import { useLpFarms } from 'hooks/useLpFarms';
import { LpStakingCard } from 'components/lp-farms/LpStakingCard';

export default function LpFarms() {
  const { lpPoolsData, lpPools, loading, stake, unstake, claim, refreshData } =
    useLpFarms();

  const [isProcessing, setIsProcessing] = useState(false);

  const handleStake = useCallback(
    async (pid: number, amount: string, lpTokenAddress: string) => {
      setIsProcessing(true);
      try {
        await stake(pid, amount, lpTokenAddress);
        await refreshData();
      } catch (error) {
        console.error('Stake error:', error);
      } finally {
        setIsProcessing(false);
      }
    },
    [stake, refreshData]
  );

  const handleUnstake = useCallback(
    async (pid: number, amount: string) => {
      setIsProcessing(true);
      try {
        await unstake(pid, amount);
        await refreshData();
      } catch (error) {
        console.error('Unstake error:', error);
      } finally {
        setIsProcessing(false);
      }
    },
    [unstake, refreshData]
  );

  const handleClaim = useCallback(
    async (pid: number) => {
      setIsProcessing(true);
      try {
        await claim(pid);
        await refreshData();
      } catch (error) {
        console.error('Claim error:', error);
      } finally {
        setIsProcessing(false);
      }
    },
    [claim, refreshData]
  );

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
                    onStake={handleStake}
                    onUnstake={handleUnstake}
                    onClaim={handleClaim}
                    isProcessing={isProcessing}
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
