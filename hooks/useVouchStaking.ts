import { useCallback, useEffect, useState } from 'react';
import Web3 from 'web3';
import { getEthWeb3 } from 'utils/web3Utils';
import {
  getVouchStakingContract,
  getVouchStakingContractAbi,
} from 'config/contract';
import { useWalletAccount } from './useWalletAccount';
import { useAppSlice } from './selector';

export interface PendingRewards {
  standardTotal: string;
  liqVouchTotal: string;
  liqVplsTotal: string;
  liqWplsTotal: string;
  holderVouch: string;
  holderVpls: string;
  holderPls: string;
}

export interface HolderRewardInfo {
  vouchPending: string;
  vplsPending: string;
  plsPending: string;
  redeemedVouch: string;
  redeemedVpls: string;
  redeemedPls: string;
}

export interface DripRedeemed {
  vouchClaimed: string;
  vplsClaimed: string;
  plsClaimed: string;
}

export interface PoolInfo {
  stakingToken: string;
  allocPoint: string;
  lastRewardBlock: string;
  accVouchPerShare: string;
  accVplsPerShare: string;
  accWplsPerShare: string;
  totalStaked: string;
  active: boolean;
}

export function useVouchStaking() {
  const { metaMaskAccount } = useWalletAccount();
  const { updateFlag } = useAppSlice();

  // State for pending rewards
  const [pendingRewards, setPendingRewards] = useState<PendingRewards>({
    standardTotal: '0',
    liqVouchTotal: '0',
    liqVplsTotal: '0',
    liqWplsTotal: '0',
    holderVouch: '0',
    holderVpls: '0',
    holderPls: '0',
  });

  // State for holder reward info
  const [holderRewardInfo, setHolderRewardInfo] = useState<HolderRewardInfo>({
    vouchPending: '0',
    vplsPending: '0',
    plsPending: '0',
    redeemedVouch: '0',
    redeemedVpls: '0',
    redeemedPls: '0',
  });

  // State for drip redeemed
  const [dripRedeemed, setDripRedeemed] = useState<DripRedeemed>({
    vouchClaimed: '0',
    vplsClaimed: '0',
    plsClaimed: '0',
  });

  // State for pool info
  const [totalPools, setTotalPools] = useState<number>(0);
  const [totalStandardAllocPoint, setTotalStandardAllocPoint] =
    useState<string>('0');
  const [totalLiquidityAllocPoint, setTotalLiquidityAllocPoint] =
    useState<string>('0');
  const [userTotalVouchStaked, setUserTotalVouchStaked] = useState<string>('0');

  // Loading states
  const [loading, setLoading] = useState(false);

  // Get contract instance
  const getContract = useCallback(() => {
    const web3 = getEthWeb3();
    return new web3.eth.Contract(
      getVouchStakingContractAbi(),
      getVouchStakingContract()
    );
  }, []);

  // Fetch pending rewards for user
  const fetchPendingRewards = useCallback(async () => {
    if (!metaMaskAccount) return;

    try {
      const contract = getContract();
      const result = await contract.methods
        .pendingAllRewards(metaMaskAccount)
        .call();

      setPendingRewards({
        standardTotal: Web3.utils.fromWei(result.standardTotal || '0', 'ether'),
        liqVouchTotal: Web3.utils.fromWei(result.liqVouchTotal || '0', 'ether'),
        liqVplsTotal: Web3.utils.fromWei(result.liqVplsTotal || '0', 'ether'),
        liqWplsTotal: Web3.utils.fromWei(result.liqWplsTotal || '0', 'ether'),
        holderVouch: Web3.utils.fromWei(result.holderVouch || '0', 'ether'),
        holderVpls: Web3.utils.fromWei(result.holderVpls || '0', 'ether'),
        holderPls: Web3.utils.fromWei(result.holderPls || '0', 'ether'),
      });
    } catch (error) {
      console.error('Error fetching pending rewards:', error);
    }
  }, [metaMaskAccount, getContract]);

  // Fetch holder reward info
  const fetchHolderRewardInfo = useCallback(async () => {
    if (!metaMaskAccount) return;

    try {
      const contract = getContract();
      const result = await contract.methods
        .getHolderRewardInfo(metaMaskAccount)
        .call();

      setHolderRewardInfo({
        vouchPending: Web3.utils.fromWei(result.vouchPending || '0', 'ether'),
        vplsPending: Web3.utils.fromWei(result.vplsPending || '0', 'ether'),
        plsPending: Web3.utils.fromWei(result.plsPending || '0', 'ether'),
        redeemedVouch: Web3.utils.fromWei(result.redeemedVouch || '0', 'ether'),
        redeemedVpls: Web3.utils.fromWei(result.redeemedVpls || '0', 'ether'),
        redeemedPls: Web3.utils.fromWei(result.redeemedPls || '0', 'ether'),
      });
    } catch (error) {
      console.error('Error fetching holder reward info:', error);
    }
  }, [metaMaskAccount, getContract]);

  // Fetch drip redeemed for all pools
  const fetchDripRedeemed = useCallback(async () => {
    if (!metaMaskAccount) return;

    try {
      const contract = getContract();
      const result = await contract.methods
        .getDripRedeemedAll(metaMaskAccount)
        .call();

      setDripRedeemed({
        vouchClaimed: Web3.utils.fromWei(result.vouchClaimed || '0', 'ether'),
        vplsClaimed: Web3.utils.fromWei(result.vplsClaimed || '0', 'ether'),
        plsClaimed: Web3.utils.fromWei(result.plsClaimed || '0', 'ether'),
      });
    } catch (error) {
      console.error('Error fetching drip redeemed:', error);
    }
  }, [metaMaskAccount, getContract]);

  // Fetch pool information
  const fetchPoolInfo = useCallback(async () => {
    try {
      const contract = getContract();

      // Get total pools
      const totalPoolsResult = await contract.methods.totalPools().call();
      setTotalPools(Number(totalPoolsResult));

      // Get allocation points
      const standardAllocResult = await contract.methods
        .totalStandardAllocPoint()
        .call();
      const liquidityAllocResult = await contract.methods
        .totalLiquidityAllocPoint()
        .call();

      setTotalStandardAllocPoint(standardAllocResult.toString());
      setTotalLiquidityAllocPoint(liquidityAllocResult.toString());

      // Get user total vouch staked if user is connected
      if (metaMaskAccount) {
        const userStakedResult = await contract.methods
          .getUserTotalVouchStaked(metaMaskAccount)
          .call();
        setUserTotalVouchStaked(
          Web3.utils.fromWei(userStakedResult || '0', 'ether')
        );
      }
    } catch (error) {
      console.error('Error fetching pool info:', error);
    }
  }, [metaMaskAccount, getContract]);

  // Stake tokens
  const stake = useCallback(
    async (pid: number, amount: string) => {
      if (!metaMaskAccount) throw new Error('Wallet not connected');

      setLoading(true);
      try {
        const web3 = getEthWeb3();
        const contract = getContract();
        const amountWei = Web3.utils.toWei(amount, 'ether');

        const gasEstimate = await contract.methods
          .stake(pid, amountWei)
          .estimateGas({
            from: metaMaskAccount,
          });

        const result = await contract.methods.stake(pid, amountWei).send({
          from: metaMaskAccount,
          gas: Math.floor(gasEstimate * 1.2), // Add 20% buffer
        });

        return result;
      } catch (error) {
        console.error('Error staking:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [metaMaskAccount, getContract]
  );

  // Unstake tokens
  const unstake = useCallback(
    async (pid: number, amount: string) => {
      if (!metaMaskAccount) throw new Error('Wallet not connected');

      setLoading(true);
      try {
        const contract = getContract();
        const amountWei = Web3.utils.toWei(amount, 'ether');

        const gasEstimate = await contract.methods
          .unstake(pid, amountWei)
          .estimateGas({
            from: metaMaskAccount,
          });

        const result = await contract.methods.unstake(pid, amountWei).send({
          from: metaMaskAccount,
          gas: Math.floor(gasEstimate * 1.2),
        });

        return result;
      } catch (error) {
        console.error('Error unstaking:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [metaMaskAccount, getContract]
  );

  // Claim rewards from specific pool
  const claim = useCallback(
    async (pid: number) => {
      if (!metaMaskAccount) throw new Error('Wallet not connected');

      setLoading(true);
      try {
        const contract = getContract();

        const gasEstimate = await contract.methods.claim(pid).estimateGas({
          from: metaMaskAccount,
        });

        const result = await contract.methods.claim(pid).send({
          from: metaMaskAccount,
          gas: Math.floor(gasEstimate * 1.2),
        });

        return result;
      } catch (error) {
        console.error('Error claiming:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [metaMaskAccount, getContract]
  );

  // Claim all rewards
  const claimAll = useCallback(async () => {
    if (!metaMaskAccount) throw new Error('Wallet not connected');

    setLoading(true);
    try {
      const contract = getContract();

      const gasEstimate = await contract.methods.claimAll().estimateGas({
        from: metaMaskAccount,
      });

      const result = await contract.methods.claimAll().send({
        from: metaMaskAccount,
        gas: Math.floor(gasEstimate * 1.2),
      });

      return result;
    } catch (error) {
      console.error('Error claiming all:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [metaMaskAccount, getContract]);

  // Claim all holder rewards
  const claimAllHolderRewards = useCallback(async () => {
    if (!metaMaskAccount) throw new Error('Wallet not connected');

    setLoading(true);
    try {
      const contract = getContract();

      const gasEstimate = await contract.methods
        .claimAllHolderRewards()
        .estimateGas({
          from: metaMaskAccount,
        });

      const result = await contract.methods.claimAllHolderRewards().send({
        from: metaMaskAccount,
        gas: Math.floor(gasEstimate * 1.2),
      });

      return result;
    } catch (error) {
      console.error('Error claiming holder rewards:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [metaMaskAccount, getContract]);

  // Exit from pool (unstake all and claim)
  const exit = useCallback(
    async (pid: number) => {
      if (!metaMaskAccount) throw new Error('Wallet not connected');

      setLoading(true);
      try {
        const contract = getContract();

        const gasEstimate = await contract.methods.exit(pid).estimateGas({
          from: metaMaskAccount,
        });

        const result = await contract.methods.exit(pid).send({
          from: metaMaskAccount,
          gas: Math.floor(gasEstimate * 1.2),
        });

        return result;
      } catch (error) {
        console.error('Error exiting:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [metaMaskAccount, getContract]
  );

  // Refresh all data
  const refreshData = useCallback(async () => {
    await Promise.all([
      fetchPendingRewards(),
      fetchHolderRewardInfo(),
      fetchDripRedeemed(),
      fetchPoolInfo(),
    ]);
  }, [
    fetchPendingRewards,
    fetchHolderRewardInfo,
    fetchDripRedeemed,
    fetchPoolInfo,
  ]);

  // Effect to fetch data when component mounts or dependencies change
  useEffect(() => {
    refreshData();
  }, [metaMaskAccount, updateFlag, refreshData]);

  return {
    // State
    pendingRewards,
    holderRewardInfo,
    dripRedeemed,
    totalPools,
    totalStandardAllocPoint,
    totalLiquidityAllocPoint,
    userTotalVouchStaked,
    loading,

    // Actions
    stake,
    unstake,
    claim,
    claimAll,
    claimAllHolderRewards,
    exit,
    refreshData,

    // Utilities
    getContract,
  };
}
