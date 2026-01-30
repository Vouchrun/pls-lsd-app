import { useCallback, useEffect, useState } from 'react';
import Web3 from 'web3';
import { getEthWeb3 } from 'utils/web3Utils';
import {
  getVouchStakingContract,
  getVouchStakingContractAbi,
  getStakingRewardPoolContract,
  getLPRewardPoolContract,
} from 'config/contract';

interface PoolApyData {
  totalApy: number;
  vouchApy: number;
  vplsApy: number;
  plsApy: number;
  isCalculating: boolean;
}

interface RewardRates {
  vouchPerYear: string;
  vplsPerYear: string;
  wplsPerYear: string;
  totalAllocPoint: string;
}

/**
 * Hook to calculate pool APY based on:
 * - Annual reward rates (vPLS, VOUCH, PLS)
 * - Pool allocation points
 * - Total staked value
 * - Token prices
 *
 * APY Formula:
 * APY = (Annual Rewards Value / Total Staked Value) * 100
 *
 * For triple rewards:
 * Total APY = VOUCH APY + vPLS APY + PLS APY
 */
export function usePoolApy(
  pid: number,
  totalStakedValue: number, // Total USD value staked in pool
  poolAllocPoint: number,
  isLiquidityPool: boolean = false,
  vouchPrice: number = 0,
  vplsPrice: number = 0,
  plsPrice: number = 0
) {
  const [apyData, setApyData] = useState<PoolApyData>({
    totalApy: 0,
    vouchApy: 0,
    vplsApy: 0,
    plsApy: 0,
    isCalculating: false,
  });

  const calculateApy = useCallback(async () => {
    if (totalStakedValue === 0 || poolAllocPoint === 0) {
      setApyData({
        totalApy: 0,
        vouchApy: 0,
        vplsApy: 0,
        plsApy: 0,
        isCalculating: false,
      });
      return;
    }

    setApyData((prev) => ({ ...prev, isCalculating: true }));

    try {
      const web3 = getEthWeb3();
      const contract = new web3.eth.Contract(
        getVouchStakingContractAbi(),
        getVouchStakingContract()
      );

      // Get the appropriate reward pool address
      const rewardPoolAddress = isLiquidityPool
        ? getLPRewardPoolContract()
        : getStakingRewardPoolContract();

      // Fetch reward rates from contract
      const rewardRates = await contract.methods
        .getRewardPoolRates(rewardPoolAddress)
        .call();

      const vouchPerYear = Web3.utils.fromWei(
        rewardRates.vouchPerYear,
        'ether'
      );
      const vplsPerYear = Web3.utils.fromWei(rewardRates.vplsPerYear, 'ether');
      const wplsPerYear = Web3.utils.fromWei(rewardRates.wplsPerYear, 'ether');
      const totalAllocPoint = parseFloat(rewardRates.totalAllocPoint_);

      // Calculate pool's share of rewards based on allocation points
      const poolShare =
        totalAllocPoint > 0 ? poolAllocPoint / totalAllocPoint : 0;

      // Calculate annual rewards for this pool
      const poolVouchRewards = parseFloat(vouchPerYear) * poolShare;
      const poolVplsRewards = parseFloat(vplsPerYear) * poolShare;
      const poolPlsRewards = parseFloat(wplsPerYear) * poolShare;

      
      // Calculate USD value of annual rewards
      const vouchRewardsValue = poolVouchRewards * vouchPrice;
      const vplsRewardsValue = poolVplsRewards * vplsPrice;
      const plsRewardsValue = poolPlsRewards * plsPrice;

      // Calculate APY for each reward token
      const vouchApy =
        totalStakedValue > 0 ? (vouchRewardsValue / totalStakedValue) * 100 : 0;
      const vplsApy =
        totalStakedValue > 0 ? (vplsRewardsValue / totalStakedValue) * 100 : 0;
      const plsApy =
        totalStakedValue > 0 ? (plsRewardsValue / totalStakedValue) * 100 : 0;

      // Total APY is the sum of individual APYs
      const totalApy = vouchApy + vplsApy + plsApy;

      setApyData({
        totalApy: isNaN(totalApy) ? 0 : totalApy,
        vouchApy: isNaN(vouchApy) ? 0 : vouchApy,
        vplsApy: isNaN(vplsApy) ? 0 : vplsApy,
        plsApy: isNaN(plsApy) ? 0 : plsApy,
        isCalculating: false,
      });
    } catch (error) {
      console.error('Error calculating APY:', error);
      setApyData({
        totalApy: 0,
        vouchApy: 0,
        vplsApy: 0,
        plsApy: 0,
        isCalculating: false,
      });
    }
  }, [
    pid,
    totalStakedValue,
    poolAllocPoint,
    isLiquidityPool,
    vouchPrice,
    vplsPrice,
    plsPrice,
  ]);

  useEffect(() => {
    calculateApy();
  }, [calculateApy]);

  return {
    ...apyData,
    refetch: calculateApy,
  };
}

/**
 * Simplified hook for calculating APY with automatic price fetching
 */
export function usePoolApySimple(
  pid: number,
  totalStakedAmount: string, // Amount in tokens
  stakedTokenPrice: number, // USD price per token
  poolAllocPoint: number,
  isLiquidityPool: boolean = false,
  vouchPrice: number = 0,
  vplsPrice: number = 0,
  plsPrice: number = 0
) {
  const totalStakedValue = parseFloat(totalStakedAmount) * stakedTokenPrice;

  return usePoolApy(
    pid,
    totalStakedValue,
    poolAllocPoint,
    isLiquidityPool,
    vouchPrice,
    vplsPrice,
    plsPrice
  );
}
