import classNames from 'classnames';
import { Icomoon } from 'components/icon/Icomoon';
import { useAppDispatch, useAppSelector } from 'hooks/common';
import Image from 'next/image';
import checkFileError from 'public/images/tx_error.png';
import checkFileSuccess from 'public/images/tx_success.png';
import loading from 'public/images/loading.png';
import { updateStakeLoadingParams } from 'redux/reducers/AppSlice';
import { RootState } from 'redux/store';
import commonStyles from 'styles/Common.module.scss';
import { useAppSlice } from 'hooks/selector';

export const StakeLoadingSidebar = () => {
  const { darkMode } = useAppSlice();
  const dispatch = useAppDispatch();
  const { stakeLoadingParams } = useAppSelector((state: RootState) => {
    return {
      stakeLoadingParams: state.app.stakeLoadingParams,
    };
  });

  return (
    <div
      className={classNames(
        'mt-[.2rem] rounded-l-[.16rem] h-[.7rem] w-[1.9rem] flex items-center cursor-pointer border-solid border-[0.01rem] border-color-border1',
        {
          hidden:
            stakeLoadingParams?.modalVisible === true || !stakeLoadingParams,
        }
      )}
      style={{
        backgroundColor: darkMode ? '#1B1B1F' : '#ffffff80',
        backdropFilter: 'blur(.13rem)',
        zIndex: 2000,
      }}
      onClick={() => {
        dispatch(updateStakeLoadingParams({ modalVisible: true }));
      }}
    >
      <div
        className={classNames(
          'ml-[.16rem] relative w-[.32rem] h-[.32rem]',
          stakeLoadingParams?.status === 'loading' ? commonStyles.loading : ''
        )}
      >
        <Image
          src={
            stakeLoadingParams?.status === 'success'
              ? checkFileSuccess
              : stakeLoadingParams?.status === 'error'
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
          stakeLoadingParams?.status === 'success'
            ? 'text-color-text1'
            : stakeLoadingParams?.status === 'error'
            ? 'text-error'
            : 'text-color-text2'
        )}
      >
        Stake
        <br />
        {stakeLoadingParams?.status === 'success'
          ? 'Succeed'
          : stakeLoadingParams?.status === 'error'
          ? 'Failed'
          : 'Operating'}
      </div>

      <div className='ml-[.2rem] rotate-90'>
        <Icomoon icon='right' color='#6C86AD' size='.16rem' />
      </div>
    </div>
  );
};
