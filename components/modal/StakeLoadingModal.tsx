import { Box, Modal } from '@mui/material';
import classNames from 'classnames';
import { PrimaryLoading } from 'components/common/PrimaryLoading';
import { Icomoon } from 'components/icon/Icomoon';
import { useAppDispatch, useAppSelector } from 'hooks/common';
import Image from 'next/image';
import successIcon from 'public/images/tx_success.png';
import errorIcon from 'public/images/tx_error.png';
import { useMemo } from 'react';
import {
  setStakeLoadingParams,
  updateStakeLoadingParams,
} from 'redux/reducers/AppSlice';
import { handleEthStake } from 'redux/reducers/EthSlice';
import { RootState } from 'redux/store';
import { formatNumber } from 'utils/numberUtils';
import { roboto } from 'config/font';
import { getLsdEthName, getTokenName } from 'utils/configUtils';
import { useWriteContract } from 'wagmi';

export const StakeLoadingModal = () => {
  const dispatch = useAppDispatch();
  const { writeContractAsync } = useWriteContract();
  const { stakeLoadingParams, darkMode } = useAppSelector(
    (state: RootState) => {
      return {
        stakeLoadingParams: state.app.stakeLoadingParams,
        darkMode: state.app.darkMode,
      };
    }
  );

  const title = useMemo(() => {
    return stakeLoadingParams?.customTitle
      ? stakeLoadingParams.customTitle
      : stakeLoadingParams?.status === 'success'
      ? `Your new balance is ${formatNumber(
          stakeLoadingParams?.newLsdTokenBalance
        )} ${getLsdEthName()}`
      : stakeLoadingParams?.status === 'error'
      ? 'Transaction Failed'
      : `You are now staking ${stakeLoadingParams?.amount} ${getTokenName()}`;
  }, [stakeLoadingParams]);

  const secondaryMsg = useMemo(() => {
    return stakeLoadingParams?.customMsg
      ? stakeLoadingParams.customMsg
      : stakeLoadingParams?.status === 'success'
      ? `Staking operation was successful`
      : stakeLoadingParams?.status === 'error'
      ? stakeLoadingParams?.displayMsg ||
        'Something went wrong, please try again'
      : stakeLoadingParams?.displayMsg ||
        `Staking ${
          stakeLoadingParams?.amount
        } ${getTokenName()}, you will receive ${formatNumber(
          stakeLoadingParams?.willReceiveAmount
        )} 
  ${getLsdEthName()}`;
  }, [stakeLoadingParams]);

  const closeModal = () => {
    if (stakeLoadingParams?.status !== 'loading') {
      dispatch(setStakeLoadingParams(undefined));
    } else {
      dispatch(updateStakeLoadingParams({ modalVisible: false }));
    }
  };

  const clickRetry = async () => {
    if (!stakeLoadingParams) {
      return;
    }
    dispatch(
      handleEthStake(
        writeContractAsync,
        stakeLoadingParams.amount + '',
        stakeLoadingParams.willReceiveAmount + '',
        stakeLoadingParams.newLsdTokenBalance + '',
        true
      )
    );
  };

  return (
    <Modal
      open={stakeLoadingParams?.modalVisible === true}
      onClose={closeModal}
    >
      <Box
        pt='0'
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
              'mr-[.24rem] self-end mt-[.24rem] cursor-pointer'
            )}
            onClick={closeModal}
          >
            <Icomoon
              icon='close'
              size='.16rem'
              color={darkMode ? '#FFFFFF80' : '#6C86AD80'}
            />
          </div>

          {(stakeLoadingParams?.status === 'loading' ||
            !stakeLoadingParams?.status) && (
            <div className='mt-[.0rem] w-[.8rem] h-[.8rem]'>
              <PrimaryLoading size='.8rem' />
            </div>
          )}

          {stakeLoadingParams?.status === 'success' && (
            <div className='mt-[.0rem] w-[.8rem] h-[.8rem] relative'>
              <Image src={successIcon} alt='success' layout='fill' />
            </div>
          )}

          {stakeLoadingParams?.status === 'error' && (
            <div className='mt-[.0rem] w-[.8rem] h-[.8rem] relative'>
              <Image src={errorIcon} alt='error' layout='fill' />
            </div>
          )}

          <div
            className={classNames(
              'mx-[.36rem] mt-[.24rem] text-[.24rem] text-color-text1 font-[700] text-center leading-tight'
            )}
          >
            {title}
          </div>

          <div
            className={classNames(
              'mx-[.36rem] mt-[.2rem] mb-[.32rem] leading-tight text-center text-[.16rem] text-color-text2'
            )}
            style={{
              maxLines: 3,
              WebkitLineClamp: 3,
              lineClamp: 3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
            }}
          >
            {secondaryMsg}
          </div>

          {stakeLoadingParams?.status === 'error' ? (
            <div
              className='mb-[.32rem] text-color-link text-[.16rem] cursor-pointer'
              onClick={clickRetry}
            >
              Retry
            </div>
          ) : (
            stakeLoadingParams?.scanUrl && (
              <a
                className='mb-[.32rem] flex items-center'
                href={stakeLoadingParams?.scanUrl || ''}
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
            )
          )}
        </div>
      </Box>
    </Modal>
  );
};
