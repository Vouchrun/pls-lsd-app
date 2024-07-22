import { useEthWithdrawRemainingTime } from "hooks/useWithdrawRemainingTime";
import { CustomButton } from "../common/CustomButton";
import { useAppDispatch, useAppSelector } from "hooks/common";
import { RootState } from "redux/store";
import { formatNumber } from "utils/numberUtils";
import { useMemo } from "react";
import { handleEthWithdraw } from "redux/reducers/EthSlice";
import { getTokenName } from "utils/configUtils";
import { useRouter } from "next/router";

interface Props {
  overallAmount: string | undefined;
  claimableAmount: string | undefined;
  willReceiveAmount: string;
  claimableWithdrawals: string[];
}

export const WithdrawUnstaked = (props: Props) => {
  const {
    overallAmount,
    claimableAmount,
    willReceiveAmount,
    claimableWithdrawals,
  } = props;

  const router = useRouter();

  const dispatch = useAppDispatch();
  const { withdrawLoading } = useAppSelector((state: RootState) => {
    return { withdrawLoading: state.app.withdrawLoading };
  });

  const { remainingDays } = useEthWithdrawRemainingTime();

  const withdrawDisabled = useMemo(() => {
    return (
      claimableWithdrawals.length === 0 ||
      !claimableAmount ||
      isNaN(Number(claimableAmount)) ||
      Number(claimableAmount) === 0 ||
      withdrawLoading
    );
  }, [claimableWithdrawals, claimableAmount, withdrawLoading]);

  const clickWithdraw = () => {
    if (withdrawDisabled) {
      return;
    }
    dispatch(
      handleEthWithdraw(
        claimableWithdrawals,
        claimableAmount || "0",
        willReceiveAmount,
        false,
        (success) => {
          if (
            !overallAmount ||
            isNaN(Number(overallAmount)) ||
            Number(overallAmount) === 0
          ) {
            router.replace({
              pathname: router.pathname,
              query: {
                ...router.query,
                tab: "stake",
              },
            });
          }
        }
      )
    );
  };

  return (
    <div className="mt-[.18rem] bg-color-bg2 rounded-[.3rem] py-[.18rem]">
      <div className="mt-[.2rem] mx-[.24rem] flex items-center justify-between">
        <div className="flex items-center">
          <div className="text-[.14rem] text-color-text2 opacity-50 font-[500]">
            Overall Amount
          </div>
          <div className="ml-[.12rem] text-[.16rem] text-color-text2 font-[500]">
            {formatNumber(overallAmount)} {getTokenName()}
          </div>
        </div>

        {/* <div className="flex items-center ">
          <div className="text-[.14rem] text-color-text2 font-[500] opacity-50">
            Remaining Lock Time
          </div>
          <div className="text-[.16rem] text-color-text2 font-[500] ml-[.12rem]">
            {remainingDays} D
          </div>
        </div> */}
      </div>

      <div className="h-[.77rem] mt-[.25rem] mx-[.24rem] px-[.24rem] bg-color-bgPage rounded-[.3rem] flex items-center justify-between">
        <div className="text-[.14rem] text-color-text1 font-[500]">
          Withdrawable
        </div>
        <div className="text-[.24rem] text-color-text1 font-[500]">
          {formatNumber(claimableAmount)} {getTokenName()}
        </div>
        <div className="text-[.14rem] text-color-text2 invisible">
          Withdrawable
        </div>
      </div>

      <div className="mt-[.2rem] mx-[.24rem]">
        <CustomButton
          height=".56rem"
          disabled={withdrawDisabled}
          onClick={clickWithdraw}
        >
          Withdraw
        </CustomButton>
      </div>
    </div>
  );
};
