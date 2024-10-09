import { Box, Modal } from '@mui/material';
import classNames from 'classnames';
import { PrimaryLoading } from 'components/common/PrimaryLoading';
import { Icomoon } from 'components/icon/Icomoon';
import {
  getEthWithdrawContract,
  getEthWithdrawContractAbi,
  getLsdEthTokenContract,
  getLsdEthTokenContractAbi,
} from 'config/contract';
import { roboto } from 'config/font';
import { CANCELLED_MESSAGE, LOADING_MESSAGE_UNSTAKING } from 'constants/common';
import { useAppDispatch, useAppSelector } from 'hooks/common';
import Image from 'next/image';
import errorIcon from 'public/images/tx_error.png';
import successIcon from 'public/images/tx_success.png';
import { useEffect, useMemo, useState } from 'react';
import {
  setUnstakeLoading,
  setUnstakeLoadingParams,
  updateUnstakeLoadingParams,
} from 'redux/reducers/AppSlice';
import { handleLsdEthUnstake } from 'redux/reducers/EthSlice';
import { updateLsdEthBalance } from 'redux/reducers/LsdEthSlice';
import { RootState } from 'redux/store';
import {
  getLsdEthName,
  getTokenName,
  getUnstakeDuration,
} from 'utils/configUtils';
import { formatNumber } from 'utils/numberUtils';
import snackbarUtil from 'utils/snackbarUtils';
import { parseEther } from 'viem';
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';

export const UnstakeLoadingModal = () => {
  const dispatch = useAppDispatch();
  const { chainId: metaMaskChainId, address: metaMaskAccount } = useAccount();
  const { unstakeLoadingParams, darkMode } = useAppSelector(
    (state: RootState) => {
      return {
        unstakeLoadingParams: state.app.unstakeLoadingParams,
        darkMode: state.app.darkMode,
      };
    }
  );

  const title = useMemo(() => {
    return unstakeLoadingParams?.customTitle
      ? unstakeLoadingParams?.customTitle
      : unstakeLoadingParams?.status === 'success'
      ? `Your new balance is ${formatNumber(
          unstakeLoadingParams?.newLsdTokenBalance
        )} ${getLsdEthName()}`
      : unstakeLoadingParams?.status === 'error'
      ? 'Unstake Failed'
      : `You are now unstaking ${Number(
          unstakeLoadingParams?.amount
        )} ${getLsdEthName()}`;
  }, [unstakeLoadingParams]);

  const secondaryMsg = useMemo(() => {
    return unstakeLoadingParams?.customMsg
      ? unstakeLoadingParams.customMsg
      : unstakeLoadingParams?.status === 'success'
      ? `Unstaking operation was successful. It takes Est. ${getUnstakeDuration()} to complete the unstake operation`
      : unstakeLoadingParams?.status === 'error'
      ? unstakeLoadingParams?.errorMsg ||
        'Something went wrong, please try again'
      : `Unstake ${
          unstakeLoadingParams?.amount
        } ${getLsdEthName()}, you will receive ${formatNumber(
          unstakeLoadingParams?.willReceiveAmount
        )} ${getTokenName()}`;
  }, [unstakeLoadingParams]);

  const closeModal = () => {
    if (unstakeLoadingParams?.status !== 'loading') {
      dispatch(setUnstakeLoadingParams(undefined));
    } else {
      dispatch(updateUnstakeLoadingParams({ modalVisible: false }));
    }
  };

  const { data: allowance } = useReadContract({
    abi: getLsdEthTokenContractAbi(),
    address: getLsdEthTokenContract() as `0x${string}`,
    functionName: 'allowance',
    args: [metaMaskAccount, getEthWithdrawContract()],
  });

  const [approvetxHash, setApprovetxHash] = useState<`0x${string}`>('0x');
  const { isSuccess } = useWaitForTransactionReceipt({
    hash: approvetxHash,
  });

  useEffect(() => {
    const maketx = async () => {
      const txHash = await writeUnstakeContractAsync({
        abi: getEthWithdrawContractAbi(),
        address: getEthWithdrawContract() as `0x${string}`,
        functionName: 'unstake',
        args: [parseEther(unstakeLoadingParams?.amount + '')],
      });

      dispatch(
        handleLsdEthUnstake(
          unstakeLoadingParams?.amount + '',
          unstakeLoadingParams?.willReceiveAmount + '',
          unstakeLoadingParams?.newLsdTokenBalance + '',
          true,
          unstakeTxHash
        )
      );
    };
    console.log(isSuccess);
    if (isSuccess) {
      maketx();
    }
  }, [isSuccess]);

  const { writeContractAsync } = useWriteContract({
    mutation: {
      onSuccess: async (data) => {
        setApprovetxHash(data);
      },
      onError: (error) => {
        dispatch(setUnstakeLoading(false));
        snackbarUtil.error(CANCELLED_MESSAGE);
        dispatch(setUnstakeLoadingParams(undefined));
        return;
      },
    },
  });

  const [unstakeTxHash, setUnstakeTxHash] = useState<`0x${string}`>('0x');
  const { isSuccess: unstakeSuccess } = useWaitForTransactionReceipt({
    hash: unstakeTxHash,
  });

  useEffect(() => {
    const maketx = async () => {
      dispatch(
        handleLsdEthUnstake(
          unstakeLoadingParams?.amount + '',
          unstakeLoadingParams?.willReceiveAmount + '',
          unstakeLoadingParams?.newLsdTokenBalance + '',
          true,
          unstakeTxHash
        )
      );
    };
    if (unstakeSuccess && unstakeLoadingParams) {
      maketx();
    }
  }, [unstakeSuccess]);

  const { writeContractAsync: writeUnstakeContractAsync } = useWriteContract({
    mutation: {
      onSettled(data, error) {
        if (error) {
          dispatch(setUnstakeLoading(false));
          dispatch(
            updateUnstakeLoadingParams({
              customMsg: 'Unstake failed, please try again later',
            })
          );
          return;
        } else if (data) {
          setUnstakeTxHash(data);
        }
      },
      onError: (error) => {
        dispatch(setUnstakeLoading(false));
        snackbarUtil.error(CANCELLED_MESSAGE);
        dispatch(setUnstakeLoadingParams(undefined));
        return;
      },
    },
  });

  const clickRetry = async () => {
    if (!unstakeLoadingParams) {
      return;
    }

    const { amount, targetAddress, willReceiveAmount, newLsdTokenBalance } =
      unstakeLoadingParams;

    if (
      !amount ||
      !targetAddress ||
      !willReceiveAmount ||
      !newLsdTokenBalance
    ) {
      snackbarUtil.error('Invalid parameters, please retry manually');
      return;
    }

    try {
      dispatch(setUnstakeLoading(true));
      dispatch(
        setUnstakeLoadingParams({
          modalVisible: true,
          status: 'loading',
          targetAddress: metaMaskAccount,
          amount: unstakeLoadingParams?.amount + '',
          willReceiveAmount,
          newLsdTokenBalance: unstakeLoadingParams?.newLsdTokenBalance + '',
          customMsg: LOADING_MESSAGE_UNSTAKING,
        })
      );

      if (
        Number(allowance) <
        Number(parseEther(unstakeLoadingParams?.amount + ''))
      ) {
        dispatch(
          updateUnstakeLoadingParams({
            customMsg:
              'Please approve the fund allowance request in your wallet',
          })
        );
        await writeContractAsync({
          abi: getLsdEthTokenContractAbi(),
          address: getLsdEthTokenContract() as `0x${string}`,
          functionName: 'approve',
          args: [getEthWithdrawContract(), parseEther('10000000')],
        });
      } else {
        await writeUnstakeContractAsync({
          abi: getEthWithdrawContractAbi(),
          address: getEthWithdrawContract() as `0x${string}`,
          functionName: 'unstake',
          args: [parseEther(unstakeLoadingParams?.amount + '')],
        });
      }
    } catch (error) {
      dispatch(setUnstakeLoading(false));
    }
  };

  return (
    <Modal
      open={unstakeLoadingParams?.modalVisible === true}
      onClose={closeModal}
    >
      <Box
        pt='0'
        pl='.36rem'
        pr='.36rem'
        pb='0.36rem'
        sx={{
          backgroundColor: darkMode ? '#38475D' : '#ffffff',
          width: '3.5rem',
          borderRadius: '0.16rem',
          outline: 'none',
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div
          className={classNames(
            'flex-1 flex flex-col items-center',
            darkMode ? 'dark' : '',
            roboto.className
          )}
        >
          <div
            className={classNames(
              'self-end mr-[-0.12rem] mt-[.24rem] cursor-pointer'
            )}
            onClick={closeModal}
          >
            <Icomoon
              icon='close'
              size='.16rem'
              color={darkMode ? '#FFFFFF80' : '#6C86AD80'}
            />
          </div>

          {unstakeLoadingParams?.status === 'loading' && (
            <div className='mt-[.0rem] w-[.8rem] h-[.8rem]'>
              <PrimaryLoading size='.8rem' />
            </div>
          )}

          {unstakeLoadingParams?.status === 'success' && (
            <div className='mt-[.0rem] w-[.8rem] h-[.8rem] relative'>
              <Image src={successIcon} alt='success' layout='fill' />
            </div>
          )}

          {unstakeLoadingParams?.status === 'error' && (
            <div className='mt-[.0rem] w-[.8rem] h-[.8rem] relative'>
              <Image src={errorIcon} alt='error' layout='fill' />
            </div>
          )}

          <div
            className={classNames(
              'mt-[.24rem] text-[.24rem] text-color-text1 font-[700] text-center leading-tight'
            )}
          >
            {title}
          </div>

          <div
            className={classNames(
              'mt-[.12rem] text-[.16rem] text-color-text2 text-center leading-tight'
            )}
            style={{
              maxLines: 5,
              WebkitLineClamp: 5,
              lineClamp: 5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
            }}
          >
            {secondaryMsg}
          </div>

          <div className='mt-[.24rem] flex flex-col items-center'>
            {unstakeLoadingParams?.scanUrl && (
              <a
                className='flex items-center'
                href={unstakeLoadingParams?.scanUrl || ''}
                target='_blank'
                rel='noreferrer'
              >
                <span className='text-color-link text-[.16rem] mr-[.12rem] font-[500]'>
                  View on explorer
                </span>

                <Icomoon
                  icon='right'
                  size='.12rem'
                  color={darkMode ? '#ffffff' : '#5A5DE0'}
                />
              </a>
            )}

            {unstakeLoadingParams?.status === 'error' && (
              <div
                className='text-color-link text-[.24rem] cursor-pointer'
                onClick={clickRetry}
              >
                Retry
              </div>
            )}
          </div>
        </div>
      </Box>
    </Modal>
  );
};
