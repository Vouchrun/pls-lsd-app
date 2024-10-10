import { useEthWithdrawRemainingTime } from 'hooks/useWithdrawRemainingTime';
import { CustomButton } from '../common/CustomButton';
import { useAppDispatch, useAppSelector } from 'hooks/common';
import { RootState } from 'redux/store';
import { formatNumber } from 'utils/numberUtils';
import { useEffect, useMemo, useState } from 'react';
import { handleEthWithdraw } from 'redux/reducers/EthSlice';
import { getTokenName } from 'utils/configUtils';
import { useRouter } from 'next/router';
import {
  setWithdrawLoading,
  setWithdrawLoadingParams,
  updateWithdrawLoadingParams,
} from 'redux/reducers/AppSlice';
import {
  CANCELLED_MESSAGE,
  LOADING_MESSAGE_WITHDRAWING,
} from 'constants/common';
import { parseEther } from 'viem';
import { uuid } from 'utils/commonUtils';
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import snackbarUtil from 'utils/snackbarUtils';
import {
  getEthWithdrawContract,
  getEthWithdrawContractAbi,
} from 'config/contract';

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

  const [withdrawTxHash, setWithdrawTxHash] = useState<`0x${string}`>('0x');
  const { isSuccess } = useWaitForTransactionReceipt({
    hash: withdrawTxHash,
  });

  useEffect(() => {
    const maketx = async () => {
      dispatch(
        handleEthWithdraw(
          claimableWithdrawals,
          claimableAmount || '0',
          willReceiveAmount,
          false,
          withdrawTxHash,
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
                  tab: 'stake',
                },
              });
            }
          }
        )
      );
    };

    if (isSuccess) {
      maketx();
    }
  }, [
    isSuccess,
    claimableAmount,
    claimableWithdrawals,
    dispatch,
    overallAmount,
    router,
    willReceiveAmount,
    withdrawTxHash,
  ]);

  const { writeContractAsync } = useWriteContract({
    mutation: {
      onSettled(data) {
        if (data) {
          setWithdrawTxHash(data);
        }
      },

      onError: (error) => {
        dispatch(setWithdrawLoading(false));
        snackbarUtil.error(CANCELLED_MESSAGE);
        dispatch(setWithdrawLoadingParams(undefined));
        return;
      },
    },
  });

  const clickWithdraw = async () => {
    if (withdrawDisabled) {
      return;
    }
    try {
      dispatch(setWithdrawLoading(true));
      dispatch(
        setWithdrawLoadingParams({
          modalVisible: true,
          status: 'loading',
          tokenAmount: claimableAmount || '0',
          customMsg: LOADING_MESSAGE_WITHDRAWING,
        })
      );
      dispatch(
        updateWithdrawLoadingParams({
          customMsg: `Please confirm the ${formatNumber(
            Number(claimableAmount || '0')
          )} ${getTokenName()} withdraw transaction in your MetaMask wallet`,
        })
      );

      await writeContractAsync({
        abi: getEthWithdrawContractAbi(),
        address: getEthWithdrawContract() as `0x${string}`,
        functionName: 'withdraw',
        args: [claimableWithdrawals],
      });
    } catch (error) {
      dispatch(setWithdrawLoading(false));
      dispatch(setWithdrawLoadingParams(undefined));
      console.error(error);
    }
    // dispatch(
    //   handleEthWithdraw(
    //     claimableWithdrawals,
    //     claimableAmount || "0",
    //     willReceiveAmount,
    //     false,
    //     (success) => {
    //       if (
    //         !overallAmount ||
    //         isNaN(Number(overallAmount)) ||
    //         Number(overallAmount) === 0
    //       ) {
    //         router.replace({
    //           pathname: router.pathname,
    //           query: {
    //             ...router.query,
    //             tab: "stake",
    //           },
    //         });
    //       }
    //     }
    //   )
    // );
  };

  return (
    <div className='mt-[.18rem] bg-color-bg2 rounded-[.3rem] py-[.18rem]'>
      <div className='mt-[.2rem] mx-[.24rem] flex items-center justify-between'>
        <div className='flex items-center'>
          <div className='text-[.14rem] text-color-text2 opacity-50 font-[500]'>
            Overall Amount
          </div>
          <div className='ml-[.12rem] text-[.16rem] text-color-text2 font-[500]'>
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

      <div className='h-[.77rem] mt-[.25rem] mx-[.24rem] px-[.24rem] bg-color-bgPage rounded-[.3rem] flex items-center justify-between'>
        <div className='text-[.14rem] text-color-text1 font-[500]'>
          Withdrawable
        </div>
        <div className='text-[.24rem] text-color-text1 font-[500]'>
          {formatNumber(claimableAmount)} {getTokenName()}
        </div>
        <div className='text-[.14rem] text-color-text2 invisible'>
          Withdrawable
        </div>
      </div>

      <div className='mt-[.2rem] mx-[.24rem]'>
        <CustomButton
          height='.56rem'
          disabled={withdrawDisabled}
          onClick={clickWithdraw}
        >
          Withdraw
        </CustomButton>
      </div>
    </div>
  );
};
