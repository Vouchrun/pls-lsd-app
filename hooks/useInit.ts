import { hooks, metaMask } from 'connectors/metaMask';
import dayjs from 'dayjs';
import { useEffect } from 'react';
import {
  setDarkMode,
  setUnreadNoticeFlag,
  setUpdateFlag,
} from 'redux/reducers/AppSlice';
import { updateApr } from 'redux/reducers/LsdEthSlice';
import {
  setMetaMaskAccount,
  setMetaMaskChainId,
  setMetaMaskDisconnected,
} from 'redux/reducers/WalletSlice';
import {
  getStorage,
  STORAGE_KEY_DARK_MODE,
  STORAGE_KEY_DISCONNECT_METAMASK,
  STORAGE_KEY_UNREAD_NOTICE,
} from 'utils/storageUtils';
import { useAppDispatch } from './common';
import { useAppSlice } from './selector';
import { useInterval } from './useInterval';
import {
  updateEthBalance,
  updateEthLatestBlockTimestamp,
} from 'redux/reducers/EthSlice';
import { useWalletAccount } from './useWalletAccount';
import { useAccount } from 'wagmi';

declare const window: { ethereum: any };
declare const ethereum: any;

export function useInit() {
  const dispatch = useAppDispatch();
  const { updateFlag, darkMode } = useAppSlice();

  // const { useAccount: useMetaMaskAccount } = hooks;
  // const metaMaskAccount = useMetaMaskAccount();
  const { address: metaMaskAccount, chainId } = useAccount();

  // const { metaMaskAccount: walletMetaMaskAccount, metaMaskChainId } =
  //   useWalletAccount();

  useEffect(() => {
    // Init local data.
    const unreadNotice = getStorage(STORAGE_KEY_UNREAD_NOTICE);
    dispatch(setUnreadNoticeFlag(!!unreadNotice));
    dispatch(
      setMetaMaskDisconnected(!!getStorage(STORAGE_KEY_DISCONNECT_METAMASK))
    );
    const darkMode = JSON.parse(getStorage(STORAGE_KEY_DARK_MODE) || 'true');
    dispatch(setDarkMode(darkMode));
  }, [dispatch]);

  useEffect(() => {
    if (dispatch && updateFlag) {
      // Query Dex Price change data
      // dispatch(updatePriceChangeRateData());
      // Query eth latest block timestamp
      dispatch(updateEthLatestBlockTimestamp());
      // query apr
      dispatch(updateApr());
    }
  }, [updateFlag, dispatch]);

  useInterval(() => {
    dispatch(setUpdateFlag(dayjs().unix()));
  }, 180000); // 180s

  useInterval(() => {
    if (metaMaskAccount) {
      dispatch(setUpdateFlag(dayjs().unix()));
    }
  }, 6000); // 6s

  useEffect(() => {
    // if (!metaMaskAccount) {
    //   metaMask.connectEagerly();
    // }
    // dispatch(setMetaMaskAccount("0x7939869edf6dC94F668b8Ba726374C9501Ed5f35"));
    dispatch(setMetaMaskAccount(metaMaskAccount));
  }, [dispatch, metaMaskAccount]);

  useEffect(() => {
    // const listener = (chainId: any) => {
    //   dispatch(setMetaMaskChainId(parseInt(chainId, 16) + ''));
    // };

    // if (window.ethereum && window.ethereum.isMetaMask) {
    //   ethereum.request({ method: 'eth_chainId' }).then((chainId: string) => {
    //     dispatch(setMetaMaskChainId(parseInt(chainId, 16) + ''));
    //     // clearDefaultProviderWeb3();
    //   });

    //   ethereum.on('chainChanged', listener);
    // }

    // return () => {
    //   if (window.ethereum) {
    //     ethereum?.removeListener('chainChanged', listener);
    //   }
    // };
    if (chainId)
      dispatch(setMetaMaskChainId(parseInt(chainId?.toString(), 16) + ''));
  }, [chainId]);

  // Update wallet balances.
  useEffect(() => {
    dispatch(updateEthBalance());
  }, [dispatch, metaMaskAccount, chainId, updateFlag]);

  // Change body backgroundColor
  useEffect(() => {
    document.body.style.backgroundColor = darkMode ? '#1B1B1F' : '#E8EFFD';
  }, [darkMode]);
}
