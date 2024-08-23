import classNames from 'classnames';
import { Icomoon } from 'components/icon/Icomoon';
import { useAppDispatch, useAppSelector } from 'hooks/common';
import Image from 'next/image';
import checkFileError from 'public/images/tx_error.png';
import checkFileSuccess from 'public/images/tx_success.png';
import loading from 'public/images/loading.png';
import { updateWithdrawLoadingParams } from 'redux/reducers/AppSlice';
import { RootState } from 'redux/store';
import commonStyles from 'styles/Common.module.scss';
import { useAppSlice } from 'hooks/selector';

export const WithdrawLoadingSidebar = () => {
  const dispatch = useAppDispatch();
  const { darkMode } = useAppSlice();
  const { withdrawLoadingParams } = useAppSelector((state: RootState) => {
    return {
      withdrawLoadingParams: state.app.withdrawLoadingParams,
    };
  });

  return (
    <div
      className={classNames(
        'mt-[.2rem] rounded-l-[.16rem] h-[.7rem] w-[1.9rem] flex items-center cursor-pointer border-solid border-[0.01rem] border-color-border1',
        {
          hidden:
            withdrawLoadingParams?.modalVisible === true ||
            !withdrawLoadingParams,
        }
      )}
      style={{
        backgroundColor: darkMode ? '#1B1B1F' : '#ffffff80',
        backdropFilter: 'blur(.13rem)',
        zIndex: 2000,
      }}
      onClick={() => {
        dispatch(updateWithdrawLoadingParams({ modalVisible: true }));
      }}
    >
      <div
        className={classNames(
          'ml-[.16rem] relative w-[.32rem] h-[.32rem]',
          withdrawLoadingParams?.status === 'loading'
            ? commonStyles.loading
            : ''
        )}
      >
        <Image
          src={
            withdrawLoadingParams?.status === 'success'
              ? checkFileSuccess
              : withdrawLoadingParams?.status === 'error'
              ? checkFileError
              : loading
          }
          layout='fill'
          alt='loading'
        />
      </div>

      <div
        className={classNames(
          'ml-[.16rem] text-[.16rem] leading-normal',
          withdrawLoadingParams?.status === 'success'
            ? 'text-color-text1'
            : withdrawLoadingParams?.status === 'error'
            ? 'text-error'
            : 'text-color-text2'
        )}
      >
        Withdraw
        <br />
        {withdrawLoadingParams?.status === 'success'
          ? 'Succeed'
          : withdrawLoadingParams?.status === 'error'
          ? 'Failed'
          : 'Operating'}
      </div>

      <div className='ml-[.2rem] rotate-90'>
        <Icomoon icon='right' color='#6C86AD' size='.16rem' />
      </div>
    </div>
  );
};
