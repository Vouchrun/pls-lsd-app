import { useCallback, useEffect, useState } from 'react';
import Web3 from 'web3';
import { getEthWeb3, getEthWeb3ForTransactions } from 'utils/web3Utils';
import {
  getVouchStakingContract,
  getVouchStakingContractAbi,
} from 'config/contract';
import {
  getLPRewardPoolContract,
  getStakingRewardPoolContract,
} from 'config/contract';
import { useWalletAccount } from './useWalletAccount';
import { useAppSlice } from './selector';
import { TOKEN_ADDRESSES } from './useVouchTokens';
import { AbiItem } from 'web3-utils';

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

export interface PendingTripleByPidItem {
  vouchPending: string;
  vplsPending: string;
  wplsPending: string;
}

export interface PendingTripleByPid {
  [pid: number]: PendingTripleByPidItem;
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

  // Per-pool pending triple rewards
  const [pendingTripleByPid, setPendingTripleByPid] =
    useState<PendingTripleByPid>({});

  // State for pool info
  const [totalPools, setTotalPools] = useState<number>(0);
  const [totalStandardAllocPoint, setTotalStandardAllocPoint] =
    useState<string>('0');
  const [totalLiquidityAllocPoint, setTotalLiquidityAllocPoint] =
    useState<string>('0');
  const [userTotalVouchStaked, setUserTotalVouchStaked] = useState<string>('0');
  const [userTotalVplsStaked, setUserTotalVplsStaked] = useState<string>('0');
  const [totalVouchUnlocking, setTotalVouchUnlocking] = useState<string>('0');
  const [totalVplsUnlocking, setTotalVplsUnlocking] = useState<string>('0');
  const [vouchUnlockPeriod, setVouchUnlockPeriod] = useState<number>(0);
  const [vplsUnlockPeriod, setVplsUnlockPeriod] = useState<number>(0);
  const [vplsPoolInfo, setVplsPoolInfo] = useState<PoolInfo>({
    stakingToken: '',
    allocPoint: '',
    lastRewardBlock: '',
    accVouchPerShare: '',
    accVplsPerShare: '',
    accWplsPerShare: '',
    totalStaked: '',
    active: false,
  });
  const [vouchPoolInfo, setVouchPoolInfo] = useState<PoolInfo>({
    stakingToken: '',
    allocPoint: '',
    lastRewardBlock: '',
    accVouchPerShare: '',
    accVplsPerShare: '',
    accWplsPerShare: '',
    totalStaked: '',
    active: false,
  });

  // Loading states
  const [loading, setLoading] = useState(false);

  // Get contract instance for read operations
  const getContract = useCallback(() => {
    const web3 = getEthWeb3();
    return new web3.eth.Contract(
      getVouchStakingContractAbi(),
      getVouchStakingContract()
    );
  }, []);

  // Get contract instance for transactions
  const getContractForTransactions = useCallback(() => {
    const web3 = getEthWeb3ForTransactions();
    return new web3.eth.Contract(
      getVouchStakingContractAbi(),
      getVouchStakingContract()
    );
  }, []);

  // Minimal ERC20 ABI for allowance/approve
  const ERC20_MINI_ABI: AbiItem[] = [
    {
      constant: true,
      inputs: [
        { name: '_owner', type: 'address' },
        { name: '_spender', type: 'address' },
      ],
      name: 'allowance',
      outputs: [{ name: '', type: 'uint256' }],
      type: 'function',
    },
    {
      constant: false,
      inputs: [
        { name: '_spender', type: 'address' },
        { name: '_value', type: 'uint256' },
      ],
      name: 'approve',
      outputs: [{ name: '', type: 'bool' }],
      type: 'function',
    },
  ];

  const getErc20Contract = useCallback((tokenAddress: string) => {
    const web3 = getEthWeb3();
    return new web3.eth.Contract(ERC20_MINI_ABI, tokenAddress);
  }, []);

  const getErc20ContractForTransactions = useCallback(
    (tokenAddress: string) => {
      const web3 = getEthWeb3ForTransactions();
      return new web3.eth.Contract(ERC20_MINI_ABI, tokenAddress);
    },
    []
  );

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

  // Fetch pending triple for specific pool id
  const fetchPendingTripleForPid = useCallback(
    async (pid: number) => {
      if (!metaMaskAccount) return;
      try {
        const contract = getContract();
        const result = await contract.methods
          .pendingStandardTriple(pid, metaMaskAccount)
          .call();

        const mapped: PendingTripleByPidItem = {
          vouchPending: Web3.utils.fromWei(result.vouchPending || '0', 'ether'),
          vplsPending: Web3.utils.fromWei(result.vplsPending || '0', 'ether'),
          wplsPending: Web3.utils.fromWei(result.wplsPending || '0', 'ether'),
        };

        setPendingTripleByPid((prev) => ({ ...prev, [pid]: mapped }));
      } catch (error) {
        console.error(`Error fetching pending triple for pid ${pid}:`, error);
        setPendingTripleByPid((prev) => ({
          ...prev,
          [pid]: { vouchPending: '0', vplsPending: '0', wplsPending: '0' },
        }));
      }
    },
    [metaMaskAccount, getContract]
  );

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

      // Get allocation points via reward pool rates (ABI exposes totalAllocPoint_ on this return)
      const stakingRewardPool = getStakingRewardPoolContract();
      const lpRewardPool = getLPRewardPoolContract();

      const stakingRates = await contract.methods
        .getRewardPoolRates(stakingRewardPool)
        .call();
      const lpRates = await contract.methods
        .getRewardPoolRates(lpRewardPool)
        .call();

      // stakingRates.totalAllocPoint_ and lpRates.totalAllocPoint_ are BigNumber-like strings
      setTotalStandardAllocPoint(stakingRates.totalAllocPoint_.toString());
      setTotalLiquidityAllocPoint(lpRates.totalAllocPoint_.toString());

      // Get user total vouch staked if user is connected
      if (metaMaskAccount) {
        const userStakedResult = await contract.methods
          .getUserTotalVouchStaked(metaMaskAccount)
          .call();
        setUserTotalVouchStaked(
          Web3.utils.fromWei(userStakedResult || '0', 'ether')
        );

        // Get user total vpls staked (assuming there's a similar method for vPLS)
        try {
          const userVplsStakedResult = await contract.methods
            .userInfo(2, metaMaskAccount)
            .call();

          setUserTotalVplsStaked(
            Web3.utils.fromWei(userVplsStakedResult[0] || '0', 'ether')
          );
        } catch (error) {
          // If the method doesn't exist, set to 0
          setUserTotalVplsStaked('0');
        }
      }

      // Get pool info
      const vplsPoolInfoResult = await contract.methods.getPoolInfo(2).call();
      setVplsPoolInfo(vplsPoolInfoResult);

      const vouchPoolInfoResult = await contract.methods.getPoolInfo(1).call();
      setVouchPoolInfo(vouchPoolInfoResult);
    } catch (error) {
      console.error('Error fetching pool info:', error);
    }
  }, [metaMaskAccount, getContract]);

  // Fetch vouch unlock period
  const fetchVouchUnlockPeriod = useCallback(async () => {
    try {
      const contract = getContract();
      const unlockPeriodResult = await contract.methods
        .vouchUnlockPeriod()
        .call();
      // Convert from seconds to days
      const unlockPeriodDays = Math.ceil(
        Number(unlockPeriodResult) / (24 * 60 * 60)
      );
      setVouchUnlockPeriod(unlockPeriodDays);
    } catch (error) {
      console.error('Error fetching vouch unlock period:', error);
      // Fallback to a default value if fetch fails
      setVouchUnlockPeriod(7); // Default to 7 days
    }
  }, [getContract]);

  // Fetch vpls unlock period
  const fetchVplsUnlockPeriod = useCallback(async () => {
    try {
      const contract = getContract();
      // For now, using the same vouchUnlockPeriod as there doesn't seem to be a separate vPLS unlock period
      // If a separate vplsUnlockPeriod method exists in the contract, update this line
      const unlockPeriodResult = await contract.methods
        .vouchUnlockPeriod()
        .call();
      // Convert from seconds to days
      const unlockPeriodDays = Math.ceil(
        Number(unlockPeriodResult) / (24 * 60 * 60)
      );
      setVplsUnlockPeriod(unlockPeriodDays);
    } catch (error) {
      console.error('Error fetching vpls unlock period:', error);
      // Fallback to a default value if fetch fails
      setVplsUnlockPeriod(7); // Default to 7 days
    }
  }, [getContract]);

  // Fetch total VOUCH unlocking
  const fetchTotalVouchUnlocking = useCallback(async () => {
    try {
      const contract = getContract();
      const totalUnlockingResult = await contract.methods
        .totalUnlocking(1)
        .call();
      setTotalVouchUnlocking(
        Web3.utils.fromWei(totalUnlockingResult || '0', 'ether')
      );
    } catch (error) {
      console.error('Error fetching total VOUCH unlocking:', error);
      setTotalVouchUnlocking('0');
    }
  }, [getContract]);

  // Fetch total VPLS unlocking
  const fetchTotalVplsUnlocking = useCallback(async () => {
    try {
      const contract = getContract();
      const totalUnlockingResult = await contract.methods
        .totalUnlocking(2)
        .call();
      setTotalVplsUnlocking(
        Web3.utils.fromWei(totalUnlockingResult || '0', 'ether')
      );
    } catch (error) {
      console.error('Error fetching total VPLS unlocking:', error);
      setTotalVplsUnlocking('0');
    }
  }, [getContract]);

  // Stake tokens
  const stake = useCallback(
    async (pid: number, amount: string) => {
      if (!metaMaskAccount) throw new Error('Wallet not connected');
      setLoading(true);
      try {
        const amountWei = Web3.utils.toWei(amount, 'ether');

        // 1) Ensure allowance of VOUCH for staking contract
        const vouchToken =
          pid === 1 ? TOKEN_ADDRESSES.VOUCH : TOKEN_ADDRESSES.VPLS;
        const spender = getVouchStakingContract();
        const erc20 = getErc20Contract(vouchToken);
        const erc20ForTx = getErc20ContractForTransactions(vouchToken);

        const currentAllowanceWei: string = await erc20.methods
          .allowance(metaMaskAccount, spender)
          .call();

        console.log(currentAllowanceWei, amountWei);
        const isAllowanceEnough = Web3.utils
          .toBN(currentAllowanceWei)
          .gte(Web3.utils.toBN(amountWei));

        if (!isAllowanceEnough) {
          console.log('approve');
          const approveGas = await erc20ForTx.methods
            .approve(spender, amountWei)
            .estimateGas({ from: metaMaskAccount });
          console.log('approveGas', approveGas);

          await erc20ForTx.methods
            .approve(spender, amountWei)
            .send({ from: metaMaskAccount, gas: Math.floor(approveGas * 1.2) });
        }

        // 2) Perform stake
        console.log('stake', pid, amountWei);
        const stakingContractForTx = getContractForTransactions();
        // const gasEstimate = await stakingContractForTx.methods
        //   .stake(pid, amountWei)
        //   .estimateGas({ from: metaMaskAccount });

        const receipt = await stakingContractForTx.methods
          .stake(pid, amountWei)
          .send({ from: metaMaskAccount });

        return receipt;
      } catch (error) {
        console.error('Error staking:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [
      metaMaskAccount,
      getContract,
      getErc20Contract,
      getContractForTransactions,
      getErc20ContractForTransactions,
    ]
  );

  // Unstake tokens
  const unstake = useCallback(
    async (pid: number, amount: string) => {
      if (!metaMaskAccount) throw new Error('Wallet not connected');

      setLoading(true);
      try {
        const contract = getContractForTransactions();
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
    [metaMaskAccount, getContractForTransactions]
  );

  // Claim rewards from specific pool
  const claim = useCallback(
    async (pid: number) => {
      if (!metaMaskAccount) throw new Error('Wallet not connected');

      setLoading(true);
      try {
        const contract = getContractForTransactions();

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
    [metaMaskAccount, getContractForTransactions]
  );

  // Claim all rewards
  const claimAll = useCallback(async () => {
    if (!metaMaskAccount) throw new Error('Wallet not connected');

    setLoading(true);
    try {
      const contract = getContractForTransactions();

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
  }, [metaMaskAccount, getContractForTransactions]);

  // Claim all holder rewards
  const claimAllHolderRewards = useCallback(async () => {
    if (!metaMaskAccount) throw new Error('Wallet not connected');

    setLoading(true);
    try {
      const contract = getContractForTransactions();

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
  }, [metaMaskAccount, getContractForTransactions]);

  // Exit from pool (unstake all and claim)
  const exit = useCallback(
    async (pid: number) => {
      if (!metaMaskAccount) throw new Error('Wallet not connected');

      setLoading(true);
      try {
        const contract = getContractForTransactions();

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
    [metaMaskAccount, getContractForTransactions]
  );

  // Refresh all data
  const refreshData = useCallback(async () => {
    await Promise.all([
      fetchPendingRewards(),
      fetchHolderRewardInfo(),
      fetchDripRedeemed(),
      fetchPoolInfo(),
      fetchVouchUnlockPeriod(),
      fetchVplsUnlockPeriod(),
      fetchTotalVouchUnlocking(),
      fetchTotalVplsUnlocking(),
      fetchPendingTripleForPid(1),
      fetchPendingTripleForPid(2),
    ]);
  }, [
    fetchPendingRewards,
    fetchHolderRewardInfo,
    fetchDripRedeemed,
    fetchPoolInfo,
    fetchVouchUnlockPeriod,
    fetchVplsUnlockPeriod,
    fetchTotalVouchUnlocking,
    fetchTotalVplsUnlocking,
    fetchPendingTripleForPid,
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
    userTotalVplsStaked,
    totalVouchUnlocking,
    totalVplsUnlocking,
    vouchUnlockPeriod,
    vplsUnlockPeriod,
    loading,
    vplsPoolInfo,
    vouchPoolInfo,
    pendingTripleByPid,

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
    getContractForTransactions,
  };
}
