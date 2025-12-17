import {
  getEthDepositContractAbi,
  getEthDepositContract,
} from "config/contract";
import { useEffect, useState } from "react";
import { executeWithRpcFallback } from "utils/web3Utils";
import { useAppSlice } from "./selector";
import Web3 from "web3";

export function useDepositEnabled() {
  const { updateFlag } = useAppSlice();

  const [depositEnabled, setDepositEnabled] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const enabled = await executeWithRpcFallback(async (web3) => {
          let contract = new web3.eth.Contract(
            getEthDepositContractAbi(),
            getEthDepositContract(),
            {}
          );
          return await contract.methods.depositEnabled().call();
        });
        setDepositEnabled(enabled);
      } catch (err: any) {}
    })();
  }, [updateFlag]);

  return {
    depositEnabled,
  };
}
