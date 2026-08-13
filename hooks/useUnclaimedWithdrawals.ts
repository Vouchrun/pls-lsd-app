import {
  getEthWithdrawContract,
  getEthWithdrawContractAbi,
} from 'config/contract';
import { useEffect, useMemo, useState } from 'react';
import { getEthWeb3 } from 'utils/web3Utils';
import Web3 from 'web3';
import { useAppSlice } from './selector';
import { useWalletAccount } from './useWalletAccount';

/**
 * Pending (unclaimed) withdrawals for the connected wallet.
 *
 * Amount math is done end-to-end in wei (BigInt) and converted to PLS strings
 * exactly once at the end — never via Number()/locale-dependent formatting.
 * The old path (formatScientificNumber -> toLocaleString -> Number) mangled
 * values for comma-decimal locales (e.g. de-DE), turning them into NaN, which
 * hid the Withdraw tab from affected users (the 2025-05 incident). web3
 * already returns uint256 values as decimal strings and BigInt handles them
 * exactly, so no intermediate formatting is needed at all.
 */

export function useEthUnclaimedWithdrawls() {
  const { updateFlag } = useAppSlice();
  const { metaMaskAccount } = useWalletAccount();

  const [overallAmount, setOverallAmount] = useState<string>();
  const [claimableAmount, setClaimableAmount] = useState<string>();
  const [overallWei, setOverallWei] = useState<bigint>(0n);
  const [claimableWei, setClaimableWei] = useState<bigint>(0n);
  const [claimableWithdrawals, setClaimableWithdrawals] = useState<string[]>(
    []
  );

  // withdrawalAtIndex._amount is the PLS (ethAmount) owed to the user — what
  // they receive on claim. (The old rate multiplication was vestigial.)
  const willReceiveAmount = useMemo(() => {
    return claimableAmount ?? '--';
  }, [claimableAmount]);

  useEffect(() => {
    (async () => {
      if (!metaMaskAccount) {
        return;
      }
      try {
        const web3 = getEthWeb3();
        const contract = new web3.eth.Contract(
          getEthWithdrawContractAbi(),
          getEthWithdrawContract(),
          {
            from: metaMaskAccount,
          }
        );

        const unclaimedWithdrawsOfUser: string[] = await contract.methods
          .getUnclaimedWithdrawalsOfUser(metaMaskAccount)
          .call();

        if (
          !unclaimedWithdrawsOfUser ||
          unclaimedWithdrawsOfUser.length === 0
        ) {
          setOverallAmount('0');
          setClaimableAmount('0');
          setOverallWei(0n);
          setClaimableWei(0n);
          setClaimableWithdrawals([]);
          return;
        }

        const requestList = unclaimedWithdrawsOfUser.map((index: string) => {
          return (async () => {
            try {
              return await contract.methods.withdrawalAtIndex(index).call();
            } catch (err: any) {}
          })();
        });

        const withdrawalList = await Promise.all(requestList);

        const maxClaimableWithdrawIndex: string = await contract.methods
          .maxClaimableWithdrawIndex()
          .call();

        const maxClaimable = BigInt(maxClaimableWithdrawIndex);
        let overallWeiSum = 0n;
        let claimableWeiSum = 0n;
        const claimableIndexes: string[] = [];
        unclaimedWithdrawsOfUser.forEach(
          (withdrawIndex: string, index: number) => {
            const withdrawal = withdrawalList[index];
            if (!withdrawal || withdrawal._amount === undefined) {
              return;
            }
            const amountWei = BigInt(withdrawal._amount);
            overallWeiSum += amountWei;
            if (BigInt(withdrawIndex) <= maxClaimable) {
              claimableWeiSum += amountWei;
              claimableIndexes.push(withdrawIndex);
            }
          }
        );

        setOverallWei(overallWeiSum);
        setClaimableWei(claimableWeiSum);
        // fromWei applied exactly once, on raw wei decimal strings (always
        // dot-decimal, locale-independent)
        setOverallAmount(Web3.utils.fromWei(overallWeiSum.toString()));
        setClaimableAmount(Web3.utils.fromWei(claimableWeiSum.toString()));
        setClaimableWithdrawals(claimableIndexes);
      } catch (err: any) {
        console.log(err);
      }
    })();
  }, [metaMaskAccount, updateFlag]);

  return {
    overallAmount,
    claimableAmount,
    overallWei,
    claimableWei,
    willReceiveAmount,
    claimableWithdrawals,
  };
}
