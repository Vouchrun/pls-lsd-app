import { useEffect, useMemo } from "react";
import { updateLsdEthBalance } from "redux/reducers/LsdEthSlice";
import { RootState } from "redux/store";
import { useAppDispatch, useAppSelector } from "./common";
import { useAppSlice } from "./selector";

export function useBalance() {
  const { updateFlag } = useAppSlice();
  const dispatch = useAppDispatch();

  // Use separate selectors to avoid creating new objects
  const balance = useAppSelector((state: RootState) => state.eth.balance);
  const lsdBalance = useAppSelector((state: RootState) => state.lsdEth.balance);

  useEffect(() => {
    if (updateFlag) {
      dispatch(updateLsdEthBalance());
    }
  }, [dispatch, updateFlag]);

  // Memoize the return value to prevent unnecessary rerenders
  return useMemo(
    () => ({ balance, lsdBalance }),
    [balance, lsdBalance]
  );
}
