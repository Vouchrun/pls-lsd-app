import { useCallback, useEffect, useState } from "react";
import { executeWithRpcFallback } from "utils/web3Utils";
import { useAppSlice } from "./selector";

export function useGasPrice() {
  const { updateFlag } = useAppSlice();

  const [gasPrice, setGasPrice] = useState(0);

  const fetchGasPrice = useCallback(async () => {
    try {
      const gasPrice = await executeWithRpcFallback(async (web3) => {
        return await web3.eth.getGasPrice();
      });

      // console.log({ gasPrice });
      setGasPrice(Number(gasPrice));
    } catch (err: any) {}
  }, []);

  useEffect(() => {
    fetchGasPrice();
  }, [updateFlag]);

  return {
    gasPrice,
  };
}
