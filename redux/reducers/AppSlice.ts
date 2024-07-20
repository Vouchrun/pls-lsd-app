import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppThunk } from "redux/store";
import {
  addNoticeInternal,
  LocalNotice,
  updateNoticeInternal,
} from "utils/noticeUtils";
import {
  getStorage,
  removeStorage,
  saveStorage,
  STORAGE_KEY_DARK_MODE,
  STORAGE_KEY_UNREAD_NOTICE,
} from "utils/storageUtils";

export interface StakeLoadingParams {
  modalVisible?: boolean;
  noticeUuid?: string;
  status?: "loading" | "success" | "error";
  displayMsg?: string;
  amount?: string;
  willReceiveAmount?: string;
  newLsdTokenBalance?: string;
  scanUrl?: string;
  txHash?: string;
  targetAddress?: string;
  blockHash?: string;
  customTitle?: string;
  customMsg?: string;
}

export interface UnstakeLoadingParams {
  modalVisible?: boolean;
  noticeUuid?: string;
  status?: "loading" | "success" | "error";
  errorMsg?: string;
  amount?: string;
  willReceiveAmount?: string;
  newLsdTokenBalance?: string;
  scanUrl?: string;
  txHash?: string;
  targetAddress?: string;
  customTitle?: string;
  customMsg?: String;
  withdrawPoolIndex?: number;
  needApprove?: boolean;
  unbondingDuration?: number;
}

export interface WithdrawLoadingParams {
  modalVisible?: boolean;
  status?: "loading" | "success" | "error";
  broadcastStatus?: "loading" | "success" | "error";
  packStatus?: "loading" | "success" | "error";
  finalizeStatus?: "loading" | "success" | "error";
  tokenAmount?: string;
  scanUrl?: string;
  txHash?: string;
  customMsg?: string;
  relayFee?: string;
}

export interface AppState {
  darkMode: boolean;
  collapseOpenId: string | undefined;
  updateFlag: number;
  unreadNoticeFlag: boolean;
  stakeLoading: boolean;
  unstakeLoading: boolean;
  withdrawLoading: boolean;
  stakeLoadingParams: StakeLoadingParams | undefined;
  unstakeLoadingParams: UnstakeLoadingParams | undefined;
  withdrawLoadingParams: WithdrawLoadingParams | undefined;
}

const initialState: AppState = {
  darkMode: false,
  collapseOpenId: undefined,
  updateFlag: 0,
  unreadNoticeFlag: false,
  stakeLoading: false,
  unstakeLoading: false,
  withdrawLoading: false,
  stakeLoadingParams: undefined,
  unstakeLoadingParams: undefined,
  withdrawLoadingParams: undefined,
};

export const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setDarkMode: (state: AppState, action: PayloadAction<boolean>) => {
      saveStorage(STORAGE_KEY_DARK_MODE, JSON.stringify(action.payload));
      const darkMode = JSON.parse(getStorage(STORAGE_KEY_DARK_MODE) || "false");
      state.darkMode = action.payload ?? darkMode;
    },
    setCollapseOpenId: (
      state: AppState,
      action: PayloadAction<string | undefined>
    ) => {
      state.collapseOpenId = action.payload;
    },
    setUpdateFlag: (state: AppState, action: PayloadAction<number>) => {
      state.updateFlag = action.payload;
    },
    setUnreadNoticeFlag: (state: AppState, action: PayloadAction<boolean>) => {
      if (action.payload) {
        saveStorage(STORAGE_KEY_UNREAD_NOTICE, "1");
      } else {
        removeStorage(STORAGE_KEY_UNREAD_NOTICE);
      }
      state.unreadNoticeFlag = action.payload;
    },
    setStakeLoading: (state: AppState, action: PayloadAction<boolean>) => {
      state.stakeLoading = action.payload;
    },
    setUnstakeLoading: (state: AppState, action: PayloadAction<boolean>) => {
      state.unstakeLoading = action.payload;
    },
    setWithdrawLoading: (state: AppState, action: PayloadAction<boolean>) => {
      state.withdrawLoading = action.payload;
    },
    setStakeLoadingParams: (
      state: AppState,
      action: PayloadAction<StakeLoadingParams | undefined>
    ) => {
      state.stakeLoadingParams = action.payload;
    },
    setUnstakeLoadingParams: (
      state: AppState,
      action: PayloadAction<UnstakeLoadingParams | undefined>
    ) => {
      state.unstakeLoadingParams = action.payload;
    },
    setWithdrawLoadingParams: (
      state: AppState,
      action: PayloadAction<WithdrawLoadingParams | undefined>
    ) => {
      state.withdrawLoadingParams = action.payload;
    },
  },
});

export const {
  setDarkMode,
  setCollapseOpenId,
  setUpdateFlag,
  setUnreadNoticeFlag,
  setStakeLoading,
  setUnstakeLoading,
  setWithdrawLoading,
  setStakeLoadingParams,
  setUnstakeLoadingParams,
  setWithdrawLoadingParams,
} = appSlice.actions;

export default appSlice.reducer;

export const updateStakeLoadingParams =
  (
    stakeLoadingParams: StakeLoadingParams,
    cb?: (newParams: StakeLoadingParams | undefined) => void
  ): AppThunk =>
  async (dispatch, getState) => {
    let newParams;
    if (!stakeLoadingParams) {
      newParams = undefined;
    } else {
      newParams = {
        ...getState().app.stakeLoadingParams,
        ...stakeLoadingParams,
        // progressDetail: {
        //   ...getState().app.stakeLoadingParams?.progressDetail,
        //   ...stakeLoadingParams.progressDetail,
        // },
      };
    }

    dispatch(setStakeLoadingParams(newParams));
    cb && cb(newParams);
  };

export const updateUnstakeLoadingParams =
  (
    unstakeLoadingParams: UnstakeLoadingParams,
    cb?: (newParams: UnstakeLoadingParams | undefined) => void
  ): AppThunk =>
  async (dispatch, getState) => {
    let newParams;
    if (!unstakeLoadingParams) {
      newParams = undefined;
    } else {
      newParams = {
        ...getState().app.unstakeLoadingParams,
        ...unstakeLoadingParams,
      };
    }

    dispatch(setUnstakeLoadingParams(newParams));
    cb && cb(newParams);
  };

export const updateWithdrawLoadingParams =
  (
    withdrawLoadingParams: WithdrawLoadingParams,
    cb?: (newParams: WithdrawLoadingParams | undefined) => void
  ): AppThunk =>
  async (dispatch, getState) => {
    let newParams;
    if (!withdrawLoadingParams) {
      newParams = undefined;
    } else {
      newParams = {
        ...getState().app.withdrawLoadingParams,
        ...withdrawLoadingParams,
      };
    }

    dispatch(setWithdrawLoadingParams(newParams));
    cb && cb(newParams);
  };

/**
 * add notice record
 */
export const addNotice =
  (notice: LocalNotice): AppThunk =>
  async (dispatch, getState) => {
    addNoticeInternal(notice);
    dispatch(setUnreadNoticeFlag(true));
  };

/**
 * update notice status
 */
export const updateNotice =
  (id: string | undefined, newNotice: Partial<LocalNotice>): AppThunk =>
  async (dispatch, getState) => {
    if (!id) {
      return;
    }
    updateNoticeInternal(id, newNotice);
    dispatch(setUnreadNoticeFlag(true));
  };
