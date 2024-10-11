import { useEffect, useState } from 'react';
import { useWalletAccount } from './useWalletAccount';
import { createWeb3, getEthWeb3 } from 'utils/web3Utils';
import {
  getEthWithdrawContract,
  getEthWithdrawContractAbi,
} from 'config/contract';

/**
 * @deprecated
 */
export function useEthWithdrawLimit() {
  const { metaMaskAccount } = useWalletAccount();

  const [withdrawLimitPerCycle, setWithdrawLimitPerCycle] = useState('');
  const [userWithdrawLimitPerCycle, setUserWithdrawLimitPerCycle] =
    useState('');
  const [totalWithdrawAmountAtCycle, setTotalWithdrawAmountAtCycle] =
    useState('');
  const [userWithdrawAmountAtCycle, setUserWithdrawAmountAtCycle] =
    useState('');

  useEffect(() => {
    if (metaMaskAccount) {
      (async () => {
        const web3 = getEthWeb3();
        const customWeb3 = getEthWeb3();
        const contract = new web3.eth.Contract(
          getEthWithdrawContractAbi(),
          getEthWithdrawContract(),
          {
            from: metaMaskAccount,
          }
        );
        const customContract = new customWeb3.eth.Contract(
          getEthWithdrawContractAbi(),
          getEthWithdrawContract(),
          {
            from: metaMaskAccount,
          }
        );
      })();
    }
  }, [metaMaskAccount]);

  return {
    withdrawLimitPerCycle,
    userWithdrawLimitPerCycle,
    totalWithdrawAmountAtCycle,
    userWithdrawAmountAtCycle,
  };
}
