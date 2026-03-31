import {
  getEthDepositContractAbi,
  getEthDepositContract,
} from "config/contract";
import { useEffect, useState } from "react";
import { executeWithRpcFallback } from "utils/web3Utils";
import { useAppSlice } from "./selector";
import { useWalletAccount } from "./useWalletAccount";
import Web3 from "web3";

export function useMinimumStakeLimit() {
  const { updateFlag } = useAppSlice();
  const { metaMaskAccount } = useWalletAccount();

  const [minimumDeposit, setMinimumDeposit] = useState<string>();

  useEffect(() => {
    (async () => {
      if (!metaMaskAccount) {
        return;
      }
      try {
        const minimumDeposit = await executeWithRpcFallback(async (web3) => {
          let contract = new web3.eth.Contract(
            getEthDepositContractAbi(),
            getEthDepositContract(),
            {}
          );
          return await contract.methods.minDeposit().call();
        });
        
        if (!minimumDeposit) {
          setMinimumDeposit("0");
        } else {
          setMinimumDeposit(Web3.utils.fromWei(minimumDeposit + "", "ether"));
        }
      } catch (err: any) {}
    })();
  }, [metaMaskAccount, updateFlag]);

  return {
    minimumDeposit,
  };
}
