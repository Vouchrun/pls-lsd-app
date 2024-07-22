import {
  getEthWithdrawContract,
  getEthWithdrawContractAbi,
} from "config/contract";
import { useEffect, useMemo, useState } from "react";
import { RootState } from "redux/store";
import { getEthWeb3 } from "utils/web3Utils";
import Web3 from "web3";
import { useAppSelector } from "./common";
import { useAppSlice } from "./selector";
import { useWalletAccount } from "./useWalletAccount";
import { formatScientificNumber } from "utils/numberUtils";

export function useEthUnclaimedWithdrawls() {
  const { updateFlag } = useAppSlice();
  const { metaMaskAccount } = useWalletAccount();

  const [overallAmount, setOverallAmount] = useState<string>();
  const [claimableAmount, setClaimableAmount] = useState<string>();
  const [claimableWithdrawals, setClaimableWithdrawals] = useState<string[]>(
    []
  );

  const rate = useAppSelector((state: RootState) => {
    return state.lsdEth.rate;
  });

  const willReceiveAmount = useMemo(() => {
    if (!rate || isNaN(Number(rate))) {
      return "--";
    }
    return Number(rate) * Number(claimableAmount) + "";
  }, [rate, claimableAmount]);

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

        const unclaimedWithdrawsOfUser = await contract.methods
          .getUnclaimedWithdrawalsOfUser(metaMaskAccount)
          .call();
        // console.log("res", unclaimedWithdrawsOfUser);

        if (
          !unclaimedWithdrawsOfUser ||
          unclaimedWithdrawsOfUser.length === 0
        ) {
          setOverallAmount("0");
          setClaimableAmount("0");
          return;
        }

        const requestList = unclaimedWithdrawsOfUser.map((index: string) => {
          return (async () => {
            try {
              const withdrawal = await contract.methods
                .withdrawalAtIndex(index)
                .call();
              // console.log("withdrawal", withdrawal);

              return withdrawal;
            } catch (err: any) {}
          })();
        });

        const withdrawalList = await Promise.all(requestList);

        const maxClaimableWithdrawIndex = await contract.methods
          .maxClaimableWithdrawIndex()
          .call();
        // console.log("maxClaimableWithdrawIndex", maxClaimableWithdrawIndex);

        let overallAmount = 0;
        let claimableAmount = 0;
        let claimableWithdrawals: string[] = [];
        unclaimedWithdrawsOfUser.forEach(
          (withdrawIndex: string, index: number) => {
            const withdrawal = withdrawalList[index];
            if (withdrawal) {
              overallAmount += Number(
                Web3.utils.fromWei(formatScientificNumber(withdrawal._amount))
              );
              if (Number(withdrawIndex) <= Number(maxClaimableWithdrawIndex)) {
                claimableAmount += Number(
                  Web3.utils.fromWei(formatScientificNumber(withdrawal._amount))
                );
                claimableWithdrawals.push(withdrawIndex);
              }
            }
          }
        );

        setOverallAmount(formatScientificNumber(overallAmount));
        setClaimableAmount(formatScientificNumber(claimableAmount));
        setClaimableWithdrawals(claimableWithdrawals);
      } catch (err: any) {
        console.log(err);
      }
    })();
  }, [metaMaskAccount, updateFlag]);

  return {
    overallAmount,
    claimableAmount,
    willReceiveAmount,
    claimableWithdrawals,
  };
}
