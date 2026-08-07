import { useCallback, useEffect, useState } from 'react';
import Web3 from 'web3';
import { getEthWeb3, getEthWeb3ForTransactions } from 'utils/web3Utils';
import {
  getVouchStakingContractLegacy,
  getVouchStakingContractAbi,
} from 'config/contract';
import {
  getLPRewardPoolContract,
  getStakingRewardPoolContractLegacy,
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

export interface UnlockInfo {
  amount: string;
  startTime: string;
  unlockAt: string;
  secondsRemaining: string;
  ready: boolean;
}

export function useVouchStakingLegacy() {
  const { metaMaskAccount } = useWalletAccount();
  const { updateFlag } = useAppSlice();

  const [pendingRewards, setPendingRewards] = useState<PendingRewards>({
    standardTotal: '0',
    liqVouchTotal: '0',
    liqVplsTotal: '0',
    liqWplsTotal: '0',
    holderVouch: '0',
    holderVpls: '0',
    holderPls: '0',
  });

  const [holderRewardInfo, setHolderRewardInfo] = useState<HolderRewardInfo>({
    vouchPending: '0',
    vplsPending: '0',
    plsPending: '0',
    redeemedVouch: '0',
    redeemedVpls: '0',
    redeemedPls: '0',
  });

  const [dripRedeemed, setDripRedeemed] = useState<DripRedeemed>({
    vouchClaimed: '0',
    vplsClaimed: '0',
    plsClaimed: '0',
  });

  const [pendingTripleByPid, setPendingTripleByPid] =
    useState<PendingTripleByPid>({});

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

  const [vouchUnlockInfo, setVouchUnlockInfo] = useState<UnlockInfo>({
    amount: '0',
    startTime: '0',
    unlockAt: '0',
    secondsRemaining: '0',
    ready: false,
  });
  const [vplsUnlockInfo, setVplsUnlockInfo] = useState<UnlockInfo>({
    amount: '0',
    startTime: '0',
    unlockAt: '0',
    secondsRemaining: '0',
    ready: false,
  });

  const [loading, setLoading] = useState(false);

  const getContract = useCallback(() => {
    const web3 = getEthWeb3();
    return new web3.eth.Contract(
      getVouchStakingContractAbi(),
      getVouchStakingContractLegacy()
    );
  }, []);

  const getContractForTransactions = useCallback(() => {
    const web3 = getEthWeb3ForTransactions();
    return new web3.eth.Contract(
      getVouchStakingContractAbi(),
      getVouchStakingContractLegacy()
    );
  }, []);

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
      if (
        !tokenAddress ||
        tokenAddress === '0x0000000000000000000000000000000000000000'
      ) {
        throw new Error('Invalid token address');
      }
      return new web3.eth.Contract(ERC20_MINI_ABI, tokenAddress);
    },
    []
  );

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

  const fetchPoolInfo = useCallback(async () => {
    try {
      const contract = getContract();

      const totalPoolsResult = await contract.methods.totalPools().call();
      setTotalPools(Number(totalPoolsResult));

      const stakingRewardPool = getStakingRewardPoolContractLegacy();
      const lpRewardPool = getLPRewardPoolContract();

      const stakingRates = await contract.methods
        .getRewardPoolRates(stakingRewardPool)
        .call();
      const lpRates = await contract.methods
        .getRewardPoolRates(lpRewardPool)
        .call();

      setTotalStandardAllocPoint(stakingRates.totalAllocPoint_.toString());
      setTotalLiquidityAllocPoint(lpRates.totalAllocPoint_.toString());

      if (metaMaskAccount) {
        const userStakedResult = await contract.methods
          .userInfo(1, metaMaskAccount)
          .call();
        setUserTotalVouchStaked(
          Web3.utils.fromWei(userStakedResult[0] || '0', 'ether')
        );

        try {
          const userVplsStakedResult = await contract.methods
            .userInfo(2, metaMaskAccount)
            .call();

          setUserTotalVplsStaked(
            Web3.utils.fromWei(userVplsStakedResult[0] || '0', 'ether')
          );
        } catch (error) {
          setUserTotalVplsStaked('0');
        }
      }

      const vplsPoolInfoResult = await contract.methods.getPoolInfo(2).call();
      setVplsPoolInfo(vplsPoolInfoResult);

      const vouchPoolInfoResult = await contract.methods.getPoolInfo(1).call();
      setVouchPoolInfo(vouchPoolInfoResult);
    } catch (error) {
      console.error('Error fetching pool info:', error);
    }
  }, [metaMaskAccount, getContract]);

  const fetchVouchUnlockPeriod = useCallback(async () => {
    try {
      const contract = getContract();
      const unlockPeriodResult = await contract.methods
        .standardUnlockPeriod()
        .call();
      const unlockPeriodDays = Math.ceil(
        Number(unlockPeriodResult) / (24 * 60 * 60)
      );
      setVouchUnlockPeriod(unlockPeriodDays);
    } catch (error) {
      console.error('Error fetching vouch unlock period:', error);
      setVouchUnlockPeriod(7);
    }
  }, [getContract]);

  const fetchVplsUnlockPeriod = useCallback(async () => {
    try {
      const contract = getContract();
      const unlockPeriodResult = await contract.methods
        .standardUnlockPeriod()
        .call();
      const unlockPeriodDays = Math.ceil(
        Number(unlockPeriodResult) / (24 * 60 * 60)
      );
      setVplsUnlockPeriod(unlockPeriodDays);
    } catch (error) {
      console.error('Error fetching vpls unlock period:', error);
      setVplsUnlockPeriod(7);
    }
  }, [getContract]);

  const fetchTotalVouchUnlocking = useCallback(async () => {
    try {
      const contract = getContract();
      const totalUnlockingAmount = await contract.methods
        .totalUnlocking(1)
        .call();
      setTotalVouchUnlocking(
        Web3.utils.fromWei(totalUnlockingAmount || '0', 'ether')
      );
    } catch (error) {
      console.error('Error fetching total VOUCH unlocking:', error);
      setTotalVouchUnlocking('0');
    }
  }, [getContract]);

  const fetchTotalVplsUnlocking = useCallback(async () => {
    try {
      const contract = getContract();
      const totalUnlockingAmount = await contract.methods
        .totalUnlocking(2)
        .call();
      setTotalVplsUnlocking(
        Web3.utils.fromWei(totalUnlockingAmount || '0', 'ether')
      );
    } catch (error) {
      console.error('Error fetching total VPLS unlocking:', error);
      setTotalVplsUnlocking('0');
    }
  }, [getContract]);

  const checkAllowance = useCallback(
    async (pid: number, amount: string) => {
      if (!metaMaskAccount) return false;
      try {
        const amountWei = Web3.utils.toWei(amount, 'ether');
        const vouchToken =
          pid === 1 ? TOKEN_ADDRESSES.VOUCH : TOKEN_ADDRESSES.VPLS;
        const spender = getVouchStakingContractLegacy();
        const erc20 = getErc20Contract(vouchToken);

        const currentAllowanceWei: string = await erc20.methods
          .allowance(metaMaskAccount, spender)
          .call();

        const isAllowanceEnough = Web3.utils
          .toBN(currentAllowanceWei)
          .gte(Web3.utils.toBN(amountWei));

        return isAllowanceEnough;
      } catch (error) {
        console.error('Error checking allowance:', error);
        return false;
      }
    },
    [metaMaskAccount, getErc20Contract]
  );

  const approve = useCallback(
    async (pid: number, amount: string) => {
      if (!metaMaskAccount) {
        throw new Error('Wallet not connected');
      }

      if (!Web3.utils.isAddress(metaMaskAccount)) {
        throw new Error(`Invalid Ethereum address: ${metaMaskAccount}`);
      }

      setLoading(true);
      try {
        const amountWei = Web3.utils.toWei(amount, 'ether');
        const vouchToken =
          pid === 1 ? TOKEN_ADDRESSES.VOUCH : TOKEN_ADDRESSES.VPLS;
        const spender = getVouchStakingContractLegacy();

        if (!Web3.utils.isAddress(spender)) {
          throw new Error(`Invalid spender address: ${spender}`);
        }

        if (!Web3.utils.isAddress(vouchToken)) {
          throw new Error(`Invalid token address: ${vouchToken}`);
        }

        const erc20ForTx = getErc20ContractForTransactions(vouchToken);

        let gasEstimate;
        try {
          gasEstimate = await erc20ForTx.methods
            .approve(spender, amountWei)
            .estimateGas({ from: metaMaskAccount });
        } catch (estimateError: any) {
          console.error('Gas estimation error:', estimateError);
          gasEstimate = 100000;
        }

        const receipt = await erc20ForTx.methods
          .approve(spender, amountWei)
          .send({
            from: metaMaskAccount,
            gas: Math.floor(Number(gasEstimate) * 1.2),
          });

        return receipt;
      } catch (error: any) {
        console.error('Error approving:', error);
        if (error.message && error.message.includes('Invalid parameters')) {
          throw new Error(
            'Failed to approve tokens. Please ensure your wallet is properly connected and try again.'
          );
        }
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [metaMaskAccount, getErc20ContractForTransactions]
  );

  const stake = useCallback(
    async (pid: number, amount: string) => {
      if (!metaMaskAccount) throw new Error('Wallet not connected');
      setLoading(true);
      try {
        const amountWei = Web3.utils.toWei(amount, 'ether');

        const stakingContractForTx = getContractForTransactions();

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
    [metaMaskAccount, getContractForTransactions]
  );

  const unstake = useCallback(
    async (pid: number, amount: string) => {
      if (!metaMaskAccount) throw new Error('Wallet not connected');

      setLoading(true);
      try {
        const contract = getContractForTransactions();
        const amountWei = Web3.utils.toWei(amount, 'ether');

        const gasEstimate = await contract.methods
          .startUnlock(pid, amountWei)
          .estimateGas({
            from: metaMaskAccount,
          });

        const result = await contract.methods.startUnlock(pid, amountWei).send({
          from: metaMaskAccount,
          gas: Math.floor(gasEstimate * 1.2),
        });

        return result;
      } catch (error) {
        console.error('Error starting unlock:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [metaMaskAccount, getContractForTransactions]
  );

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

  const fetchUnlockInfo = useCallback(
    async (pid: number) => {
      if (!metaMaskAccount) {
        if (pid === 1) {
          setVouchUnlockInfo({
            amount: '0',
            startTime: '0',
            unlockAt: '0',
            secondsRemaining: '0',
            ready: false,
          });
        } else if (pid === 2) {
          setVplsUnlockInfo({
            amount: '0',
            startTime: '0',
            unlockAt: '0',
            secondsRemaining: '0',
            ready: false,
          });
        }
        return;
      }

      try {
        const contract = getContract();
        const result = await contract.methods
          .getUnlock(pid, metaMaskAccount)
          .call();

        const unlockInfo: UnlockInfo = {
          amount: Web3.utils.fromWei(result.amount || '0', 'ether'),
          startTime: result.startTime?.toString() || '0',
          unlockAt: result.unlockAt?.toString() || '0',
          secondsRemaining: result.secondsRemaining?.toString() || '0',
          ready: result.ready || false,
        };

        if (pid === 1) {
          setVouchUnlockInfo(unlockInfo);
        } else if (pid === 2) {
          setVplsUnlockInfo(unlockInfo);
        }
      } catch (error) {
        console.error(`Error fetching unlock info for pool ${pid}:`, error);
      }
    },
    [metaMaskAccount, getContract]
  );

  const cancelUnlock = useCallback(
    async (pid: number) => {
      if (!metaMaskAccount) throw new Error('Wallet not connected');

      setLoading(true);
      try {
        const contract = getContractForTransactions();

        const gasEstimate = await contract.methods
          .cancelUnlock(pid)
          .estimateGas({
            from: metaMaskAccount,
          });

        const result = await contract.methods.cancelUnlock(pid).send({
          from: metaMaskAccount,
          gas: Math.floor(gasEstimate * 1.2),
        });

        return result;
      } catch (error) {
        console.error('Error canceling unlock:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [metaMaskAccount, getContractForTransactions]
  );

  const finalizeUnlock = useCallback(
    async (pid: number) => {
      if (!metaMaskAccount) throw new Error('Wallet not connected');

      setLoading(true);
      try {
        const contract = getContractForTransactions();

        const gasEstimate = await contract.methods
          .finalizeUnlock(pid)
          .estimateGas({
            from: metaMaskAccount,
          });

        const result = await contract.methods.finalizeUnlock(pid).send({
          from: metaMaskAccount,
          gas: Math.floor(gasEstimate * 1.2),
        });

        return result;
      } catch (error) {
        console.error('Error finalizing unlock:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [metaMaskAccount, getContractForTransactions]
  );

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
      fetchUnlockInfo(1),
      fetchUnlockInfo(2),
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
    fetchUnlockInfo,
  ]);

  useEffect(() => {
    refreshData();
  }, [metaMaskAccount, updateFlag, refreshData]);

  return {
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
    vouchUnlockInfo,
    vplsUnlockInfo,

    checkAllowance,
    approve,
    stake,
    unstake,
    claim,
    claimAll,
    claimAllHolderRewards,
    exit,
    cancelUnlock,
    finalizeUnlock,
    refreshData,

    getContract,
    getContractForTransactions,
  };
}