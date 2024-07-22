import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  getEthDepositContract,
  getEthDepositContractAbi,
  getEthWithdrawContract,
  getEthWithdrawContractAbi,
  getLsdEthTokenContract,
  getLsdEthTokenContractAbi,
} from "config/contract";
import { getEtherScanTxUrl } from "config/explorer";
import { AppThunk } from "redux/store";
import { uuid } from "utils/commonUtils";
import {
  CANCELLED_MESSAGE,
  CONNECTION_ERROR_MESSAGE,
  LOADING_MESSAGE_UNSTAKING,
  LOADING_MESSAGE_WITHDRAWING,
  TRANSACTION_FAILED_MESSAGE,
} from "constants/common";
import { LocalNotice } from "utils/noticeUtils";
import { formatNumber, formatScientificNumber } from "utils/numberUtils";
import snackbarUtil from "utils/snackbarUtils";
import { createWeb3, getEthWeb3 } from "utils/web3Utils";
import Web3 from "web3";
import {
  addNotice,
  setStakeLoadingParams,
  setUnstakeLoadingParams,
  setStakeLoading,
  setUnstakeLoading,
  setWithdrawLoading,
  setWithdrawLoadingParams,
  updateStakeLoadingParams,
  updateWithdrawLoadingParams,
  updateUnstakeLoadingParams,
} from "./AppSlice";
import { getLsdEthName, getTokenName } from "utils/configUtils";

export interface EthState {
  txLoading: boolean;
  balance: string | undefined;
  currentNodeDepositAmount: string | undefined;
  latestBlockTimestamp: string;
  ethClaimRewardsLoading: boolean;
}

const initialState: EthState = {
  txLoading: false,
  balance: undefined,
  currentNodeDepositAmount: undefined,
  latestBlockTimestamp: "0",
  ethClaimRewardsLoading: false,
};

export const ethSlice = createSlice({
  name: "eth",
  initialState,
  reducers: {
    setEthTxLoading: (state: EthState, action: PayloadAction<boolean>) => {
      state.txLoading = action.payload;
    },
    setEthBalance: (
      state: EthState,
      action: PayloadAction<string | undefined>
    ) => {
      state.balance = action.payload;
    },
    setCurrentNodeDepositAmount: (
      state: EthState,
      action: PayloadAction<string>
    ) => {
      state.currentNodeDepositAmount = action.payload;
    },
    setLatestBlockTimestamp: (
      state: EthState,
      action: PayloadAction<string>
    ) => {
      state.latestBlockTimestamp = action.payload;
    },
    setEthClaimRewardsLoading: (
      state: EthState,
      action: PayloadAction<boolean>
    ) => {
      state.ethClaimRewardsLoading = action.payload;
    },
  },
});

export const {
  setEthTxLoading,
  setEthBalance,
  setCurrentNodeDepositAmount,
  setLatestBlockTimestamp,
  setEthClaimRewardsLoading,
} = ethSlice.actions;

export default ethSlice.reducer;

export const updateEthBalance = (): AppThunk => async (dispatch, getState) => {
  const metaMaskAccount = getState().wallet.metaMaskAccount;
  if (!metaMaskAccount) {
    dispatch(setEthBalance(undefined));
    return;
  }

  let ethWeb3 = getEthWeb3();
  try {
    const balance = await ethWeb3.eth.getBalance(metaMaskAccount);
    dispatch(setEthBalance(Web3.utils.fromWei(balance.toString(), "ether")));
  } catch (err: unknown) {}
};

/**
 * stake ETH
 * @param stakeAmount stake ETH amount
 * @param willReceiveAmount will receive lsdETH amount
 * @param newLsdTokenBalance new lsdETH balance after staking
 * @param isReTry is retry staking
 * @param cb callback function
 */
export const handleEthStake =
  (
    stakeAmount: string,
    willReceiveAmount: string,
    newLsdTokenBalance: string,
    isReTry: boolean,
    cb?: (success: boolean, result: any) => void
  ): AppThunk =>
  async (dispatch, getState) => {
    const noticeUuid = isReTry
      ? getState().app.stakeLoadingParams?.noticeUuid
      : uuid();
    try {
      dispatch(setStakeLoading(true));
      dispatch(
        setStakeLoadingParams({
          modalVisible: true,
          noticeUuid,
          status: "loading",
          amount: Number(stakeAmount) + "",
          willReceiveAmount,
          newLsdTokenBalance,
        })
      );

      const web3 = createWeb3();
      const metaMaskAccount = getState().wallet.metaMaskAccount;
      if (!metaMaskAccount) {
        throw new Error("Please connect MetaMask");
      }
      let contract = new web3.eth.Contract(
        getEthDepositContractAbi(),
        getEthDepositContract(),
        {
          from: metaMaskAccount,
        }
      );

      const stakeAmountInWei = web3.utils.toWei(
        formatScientificNumber(stakeAmount),
        "ether"
      );
      const result = await contract.methods
        .deposit()
        .send({ value: stakeAmountInWei });

      cb && cb(result.status, result);
      if (result && result.status) {
        const txHash = result.transactionHash;
        dispatch(
          updateStakeLoadingParams(
            {
              status: "success",
              txHash: txHash,
              scanUrl: getEtherScanTxUrl(txHash),
            },
            (newParams) => {
              const newNotice: LocalNotice = {
                id: noticeUuid || uuid(),
                type: "Stake",
                txDetail: { transactionHash: txHash, sender: metaMaskAccount },
                data: {
                  amount: Number(stakeAmount) + "",
                  willReceiveAmount: Number(willReceiveAmount) + "",
                },
                scanUrl: getEtherScanTxUrl(result.transactionHash),
                status: "Confirmed",
                stakeLoadingParams: newParams,
              };
              dispatch(addNotice(newNotice));
            }
          )
        );
      } else {
        throw new Error(TRANSACTION_FAILED_MESSAGE);
      }
    } catch (err: any) {
      let displayMsg = TRANSACTION_FAILED_MESSAGE;
      if (err.code === -32603) {
        displayMsg = CONNECTION_ERROR_MESSAGE;
      } else if (err.code === 4001) {
        snackbarUtil.error(CANCELLED_MESSAGE);
        dispatch(setStakeLoadingParams(undefined));
        return;
      }
      dispatch(
        updateStakeLoadingParams(
          {
            status: "error",
            displayMsg: displayMsg,
          },
          (newParams) => {
            dispatch(
              addNotice({
                id: noticeUuid || uuid(),
                type: "Stake",
                data: {
                  amount: Number(stakeAmount) + "",
                  willReceiveAmount: Number(willReceiveAmount) + "",
                },
                status: "Error",
                stakeLoadingParams: newParams,
              })
            );
          }
        )
      );
    } finally {
      dispatch(setStakeLoading(false));
      dispatch(updateEthBalance());
    }
  };

export const updateEthLatestBlockTimestamp =
  (): AppThunk => async (dispatch, getState) => {
    try {
      const web3 = getEthWeb3();
      const blockNumber = await web3.givenProvider.request({
        method: "eth_blockNumber",
      });
      const block = await web3.givenProvider.request({
        method: "eth_getBlockByNumber",
        params: [blockNumber, true],
      });
      const latestBlockTimestamp = parseInt(block.timestamp, 16);
      dispatch(setLatestBlockTimestamp(latestBlockTimestamp + ""));
    } catch (err: unknown) {}
  };

/**
 * unstake lsd ETH
 * @param unstakeAmount unstake lsdETH amount
 * @param willReceiveAmount will receive ETH amount
 * @param newLsdTokenBalance new lsdETH balance after unstaking
 * @param isReTry is retry unstaking
 * @param cb callback function
 */
export const handleLsdEthUnstake =
  (
    unstakeAmount: string,
    willReceiveAmount: string,
    newLsdTokenBalance: string,
    isReTry: boolean,
    cb?: (success: boolean, needWithdraw: boolean, result: any) => void
  ): AppThunk =>
  async (dispatch, getState) => {
    const noticeUuid = isReTry
      ? getState().app.unstakeLoadingParams?.noticeUuid
      : uuid();
    const unstakeAmountInWei = Web3.utils.toWei(unstakeAmount);

    try {
      dispatch(setUnstakeLoading(true));
      const metaMaskAccount = getState().wallet.metaMaskAccount;
      if (!metaMaskAccount) {
        throw new Error("Please connect MetaMask");
      }

      const web3 = createWeb3();
      const contract = new web3.eth.Contract(
        getEthWithdrawContractAbi(),
        getEthWithdrawContract(),
        {
          from: metaMaskAccount,
        }
      );

      dispatch(
        setUnstakeLoadingParams({
          modalVisible: true,
          status: "loading",
          targetAddress: metaMaskAccount,
          amount: unstakeAmount,
          willReceiveAmount,
          newLsdTokenBalance,
          customMsg: LOADING_MESSAGE_UNSTAKING,
        })
      );

      const lsdEthTokenContract = new web3.eth.Contract(
        getLsdEthTokenContractAbi(),
        getLsdEthTokenContract(),
        {
          from: metaMaskAccount,
        }
      );

      const allowance = await lsdEthTokenContract.methods
        .allowance(metaMaskAccount, getEthWithdrawContract())
        .call();

      if (Number(allowance) < Number(unstakeAmountInWei)) {
        dispatch(
          updateUnstakeLoadingParams({
            customMsg:
              "Please approve the fund allowance request in your wallet",
          })
        );
        const approveResult = await lsdEthTokenContract.methods
          .approve(getEthWithdrawContract(), web3.utils.toWei("10000000"))
          .send();
        if (!approveResult || !approveResult.status) {
          return;
        }
      }

      const nextWithdrawIndex = await contract.methods
        .nextWithdrawIndex()
        .call();
      // console.log("nextWithdrawIndex", nextWithdrawIndex);

      dispatch(
        updateUnstakeLoadingParams({
          customMsg: `Please confirm the ${Number(
            unstakeAmount
          )} ${getLsdEthName()} unstaking transaction in your MetaMask wallet`,
        })
      );

      const result = await contract.methods.unstake(unstakeAmountInWei).send();

      if (result && result.status) {
        const unclaimedWithdrawsOfUser = await contract.methods
          .getUnclaimedWithdrawalsOfUser(metaMaskAccount)
          .call();
        // console.log("unclaimedWithdrawsOfUser", unclaimedWithdrawsOfUser);

        const needWithdraw =
          unclaimedWithdrawsOfUser.indexOf(nextWithdrawIndex) >= 0;
        const customMsg = !needWithdraw
          ? `Unstaking ${Number(
              unstakeAmount
            )} ${getTokenName()} operation was successful.`
          : `Unstaking operation was successful. Withdraw function will be shown in the page later, please wait for the withdraw opening to get your unstaked ${getTokenName()}.`;

        cb && cb(result.status, needWithdraw, result);

        const txHash = result.transactionHash;
        dispatch(
          updateUnstakeLoadingParams({
            status: "success",
            txHash: txHash,
            scanUrl: getEtherScanTxUrl(txHash),
            customMsg,
          })
        );
        const newNotice: LocalNotice = {
          id: noticeUuid || uuid(),
          type: "Unstake",
          txDetail: { transactionHash: txHash, sender: metaMaskAccount },
          data: {
            amount: Number(unstakeAmount) + "",
            willReceiveAmount: Number(willReceiveAmount) + "",
            needWithdraw,
          },
          scanUrl: getEtherScanTxUrl(result.transactionHash),
          status: "Confirmed",
        };
        dispatch(addNotice(newNotice));
      } else {
        throw new Error(TRANSACTION_FAILED_MESSAGE);
      }
    } catch (err: any) {
      {
        // snackbarUtil.error(err.message);
        let displayMsg = err.message || TRANSACTION_FAILED_MESSAGE;
        if (err.code === -32603) {
          displayMsg = CONNECTION_ERROR_MESSAGE;
        } else if (err.code === 4001) {
          snackbarUtil.error(CANCELLED_MESSAGE);
          dispatch(setUnstakeLoadingParams(undefined));
          return;
        }
        dispatch(
          updateUnstakeLoadingParams({
            status: "error",
            customMsg: displayMsg || "Unstake failed",
          })
        );
      }
    } finally {
      dispatch(setUnstakeLoading(false));
      dispatch(updateEthBalance());
    }
  };

/**
 * withdraw unstaked ETH
 * @param claimableWithdrawals
 * @param withdrawAmount
 * @param willReceiveAmount will receive ETH amount
 * @param isReTry is retry withdraw
 * @param cb callback function
 */
export const handleEthWithdraw =
  (
    claimableWithdrawals: string[],
    withdrawAmount: string,
    willReceiveAmount: string,
    isReTry: boolean,
    cb?: (success: boolean, result: any) => void
  ): AppThunk =>
  async (dispatch, getState) => {
    const noticeUuid = isReTry
      ? getState().app.stakeLoadingParams?.noticeUuid
      : uuid();

    try {
      const metaMaskAccount = getState().wallet.metaMaskAccount;
      if (!metaMaskAccount) {
        throw new Error("Please connect MetaMask");
      }

      const web3 = createWeb3();
      const contract = new web3.eth.Contract(
        getEthWithdrawContractAbi(),
        getEthWithdrawContract(),
        {
          from: metaMaskAccount,
        }
      );

      dispatch(setWithdrawLoading(true));
      dispatch(
        setWithdrawLoadingParams({
          modalVisible: true,
          status: "loading",
          tokenAmount: withdrawAmount,
          customMsg: LOADING_MESSAGE_WITHDRAWING,
        })
      );

      dispatch(
        updateWithdrawLoadingParams({
          customMsg: `Please confirm the ${formatNumber(
            Number(withdrawAmount)
          )} ${getTokenName()} withdraw transaction in your MetaMask wallet`,
        })
      );

      const result = await contract.methods
        .withdraw(claimableWithdrawals)
        .send();

      cb && cb(result.status, result);
      if (result && result.status) {
        const txHash = result.transactionHash;
        dispatch(
          updateWithdrawLoadingParams(
            {
              status: "success",
              broadcastStatus: "success",
              packStatus: "success",
              finalizeStatus: "success",
              txHash: txHash,
              scanUrl: getEtherScanTxUrl(txHash),
              customMsg: undefined,
            },
            (newParams) => {
              dispatch(
                addNotice({
                  id: noticeUuid || "",
                  type: "Withdraw",
                  data: {
                    tokenAmount: withdrawAmount,
                  },
                  status: "Confirmed",
                  scanUrl: getEtherScanTxUrl(txHash),
                })
              );
            }
          )
        );
      } else {
        throw new Error(TRANSACTION_FAILED_MESSAGE);
      }
    } catch (err: any) {
      let displayMsg = err.message || TRANSACTION_FAILED_MESSAGE;
      if (err.code === -32603) {
        displayMsg = CONNECTION_ERROR_MESSAGE;
      } else if (err.code === 4001) {
        snackbarUtil.error(CANCELLED_MESSAGE);
        dispatch(setWithdrawLoadingParams(undefined));
        return;
      }
      dispatch(
        updateWithdrawLoadingParams({
          status: "error",
          customMsg: displayMsg || "Unstake failed",
        })
      );
    } finally {
      dispatch(setWithdrawLoading(false));
      dispatch(updateEthBalance());
    }
  };
