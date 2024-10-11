import { Box, Modal } from '@mui/material';
import classNames from 'classnames';
import { PrimaryLoading } from 'components/common/PrimaryLoading';
import { Icomoon } from 'components/icon/Icomoon';
import { roboto } from 'config/font';
import { useAppDispatch, useAppSelector } from 'hooks/common';
import Image from 'next/image';
import errorIcon from 'public/images/tx_error.png';
import successIcon from 'public/images/tx_success.png';
import { useMemo } from 'react';
import {
  setUnstakeLoadingParams,
  updateUnstakeLoadingParams,
} from 'redux/reducers/AppSlice';
import { handleLsdEthUnstake } from 'redux/reducers/EthSlice';
import { RootState } from 'redux/store';
import {
  getLsdEthName,
  getTokenName,
  getUnstakeDuration,
} from 'utils/configUtils';
import { formatNumber } from 'utils/numberUtils';
import snackbarUtil from 'utils/snackbarUtils';
import { useWriteContract } from 'wagmi';

export const UnstakeLoadingModal = () => {
  const dispatch = useAppDispatch();
  const { writeContractAsync } = useWriteContract();
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

  const clickRetry = () => {
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

    dispatch(
      handleLsdEthUnstake(
        writeContractAsync,
        unstakeLoadingParams.amount + '',
        unstakeLoadingParams.willReceiveAmount + '',
        unstakeLoadingParams.newLsdTokenBalance + '',
        true
      )
    );
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
