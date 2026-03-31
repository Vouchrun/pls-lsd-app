import { Action, configureStore, ThunkAction } from "@reduxjs/toolkit";
import appReducer from "./reducers/AppSlice";
import walletReducer from "./reducers/WalletSlice";
import ethReducer from "./reducers/EthSlice";
import lsdEthReducer from "./reducers/LsdEthSlice";
import { getStorage, STORAGE_KEY_CUSTOM_RPC, STORAGE_KEY_DARK_MODE, STORAGE_KEY_UNREAD_NOTICE } from "utils/storageUtils";

// Initialize state from localStorage (only in browser)
const isBrowser = typeof window !== 'undefined';
const preloadedState = {
  app: {
    darkMode: isBrowser ? JSON.parse(getStorage(STORAGE_KEY_DARK_MODE) || "false") : false,
    customRpc: isBrowser ? getStorage(STORAGE_KEY_CUSTOM_RPC) : null,
    collapseOpenId: undefined,
    updateFlag: 0,
    unreadNoticeFlag: isBrowser ? !!getStorage(STORAGE_KEY_UNREAD_NOTICE) : false,
    stakeLoading: false,
    unstakeLoading: false,
    withdrawLoading: false,
    stakeLoadingParams: undefined,
    unstakeLoadingParams: undefined,
    withdrawLoadingParams: undefined,
  },
};

export const store = configureStore({
  reducer: {
    app: appReducer,
    wallet: walletReducer,
    eth: ethReducer,
    lsdEth: lsdEthReducer,
  },
  preloadedState,
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
