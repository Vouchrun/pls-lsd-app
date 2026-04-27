import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppThunk } from 'redux/store';
import {
  getErc20AssetBalance,
  getEthWeb3,
} from 'utils/web3Utils';
import {
  getLsdEthTokenContract,
  getLsdEthTokenContractAbi,
  getNetworkBalanceContract,
  getNetworkBalanceContractAbi,
} from 'config/contract';
import { getDefaultApr } from 'utils/configUtils';
import {
  getBlockSeconds,
  getNetworkBalanceContractDeploymentBlock,
} from 'config/env';

function bigIntDivide(numerator: string, denominator: string): number {
  if (!denominator || denominator === '0') return NaN;
  const PRECISION = 10n ** 18n;
  const scaled = (BigInt(numerator) * PRECISION) / BigInt(denominator);
  return Number(scaled) / 1e18;
}

export interface LsdEthState {
  balance: string | undefined; // balance of lsdETH
  rate: string | undefined; // rate of lsdETH to ETH
  apr: number | undefined; // lsdETH apr
  price: string | undefined; // price of lsdETH
  yearlyApr: number | undefined; // yearly apr of lsdETH
}

const initialState: LsdEthState = {
  balance: undefined,
  rate: undefined,
  apr: undefined,
  price: undefined,
  yearlyApr: undefined,
};

export const lsdEthSlice = createSlice({
  name: 'lsdEth',
  initialState,
  reducers: {
    setBalance: (
      state: LsdEthState,
      action: PayloadAction<string | undefined>
    ) => {
      state.balance = action.payload;
    },
    setRate: (state: LsdEthState, action: PayloadAction<string>) => {
      state.rate = action.payload;
    },
    setPrice: (state: LsdEthState, action: PayloadAction<string>) => {
      state.price = action.payload;
    },
    setApr: (state: LsdEthState, action: PayloadAction<number>) => {
      state.apr = action.payload;
    },
    setYearlyApr: (state: LsdEthState, action: PayloadAction<number>) => {
      state.yearlyApr = action.payload;
    },
  },
});

export const { setBalance, setRate, setPrice, setApr, setYearlyApr } =
  lsdEthSlice.actions;

export default lsdEthSlice.reducer;

export const clearLsdEthBalance =
  (): AppThunk => async (dispatch, getState) => {
    dispatch(setBalance(undefined));
  };

/**
 * update lsdEth balance
 */
export const updateLsdEthBalance =
  (): AppThunk => async (dispatch, getState) => {
    try {
      const metaMaskAccount = getState().wallet.metaMaskDisconnected
        ? undefined
        : getState().wallet.metaMaskAccount;

      const tokenAbi = getLsdEthTokenContractAbi();
      const tokenAddress = getLsdEthTokenContract();
      const newBalance = await getErc20AssetBalance(
        metaMaskAccount,
        tokenAbi,
        tokenAddress
      );
      dispatch(setBalance(newBalance));
    } catch (err: unknown) {}
  };

/**
 * query lsdETH to ETH's rate
 */
export const updateLsdEthRate = (): AppThunk => async (dispatch, getState) => {
  try {
    let newRate = '--';

    const web3 = getEthWeb3();
    let contract = new web3.eth.Contract(
      getLsdEthTokenContractAbi(),
      getLsdEthTokenContract()
    );
    const result = await contract.methods.getRate().call();
    newRate = web3.utils.fromWei(result + '', 'ether');

    dispatch(setRate(newRate));
  } catch (err: unknown) {}
};

/**
 * query apr of lsd ETH (7-day average)
 */
export const updateApr = (): AppThunk => async (dispatch, getState) => {
  let apr = getDefaultApr();
  try {
    const web3 = getEthWeb3();
    const currentBlock = await web3.eth.getBlockNumber();
    const networkBalanceContract = new web3.eth.Contract(
      getNetworkBalanceContractAbi(),
      getNetworkBalanceContract()
    );

    const fromBlock =
      currentBlock - Math.floor((1 / getBlockSeconds()) * 60 * 60 * 24 * 7);
    const events = await networkBalanceContract.getPastEvents('BalancesUpdated', {
      fromBlock: fromBlock,
      toBlock: currentBlock,
    });

    if (events.length > 1) {
      const sorted = [...events].sort(
        (a, b) => a.blockNumber - b.blockNumber
      );
      const beginEvent = sorted[0];
      const endEvent = sorted[sorted.length - 1];

      const beginRate = bigIntDivide(
        beginEvent.returnValues.totalEth,
        beginEvent.returnValues.lsdTokenSupply
      );
      const endRate = bigIntDivide(
        endEvent.returnValues.totalEth,
        endEvent.returnValues.lsdTokenSupply
      );

      const beginTimestamp = Number(beginEvent.returnValues.time);
      const endTimestamp = Number(endEvent.returnValues.time);
      const daysBetween = (endTimestamp - beginTimestamp) / (60 * 60 * 24);

      if (
        !isNaN(beginRate) &&
        !isNaN(endRate) &&
        endRate !== 1 &&
        beginRate !== 1 &&
        daysBetween > 0
      ) {
        apr = ((endRate - beginRate) / daysBetween) * 365.25 * 100;
      }
    }
    dispatch(setApr(apr));
  } catch (err: any) {
    console.log({ err });
    dispatch(setApr(apr));
  }
};

export const updateYearlyApr = (): AppThunk => async (dispatch, getState) => {
  let apr = getDefaultApr();
  try {
    const web3 = getEthWeb3();
    const currentBlock = await web3.eth.getBlockNumber();
    const contract = new web3.eth.Contract(
      getNetworkBalanceContractAbi(),
      getNetworkBalanceContract()
    );

    // Get current rates from contract snapshot (1 instant call)
    const snapshot = await contract.methods.balancesSnapshot().call();
    const currentTotalEth = snapshot._totalEth || snapshot[1];
    const currentTotalLsdToken = snapshot._totalLsdToken || snapshot[2];

    if (!currentTotalEth || !currentTotalLsdToken || currentTotalLsdToken === '0') {
      dispatch(setYearlyApr(apr));
      return;
    }

    const currentRate = bigIntDivide(currentTotalEth, currentTotalLsdToken);

    // Calculate blocks for 365 days
    const blocksFor365Days = Math.floor(
      (1 / getBlockSeconds()) * 60 * 60 * 24 * 365
    );
    const deploymentBlock = getNetworkBalanceContractDeploymentBlock();
    const startBlock =
      currentBlock - deploymentBlock < blocksFor365Days
        ? deploymentBlock
        : currentBlock - blocksFor365Days;

    // Search for the first BalancesUpdated event in 50K-block chunks
    const CHUNK_SIZE = 50000;
    let firstEvent = null;

    for (
      let from = startBlock;
      from <= currentBlock && !firstEvent;
      from += CHUNK_SIZE
    ) {
      const to = Math.min(from + CHUNK_SIZE - 1, currentBlock);
      try {
        const events = await contract.getPastEvents('BalancesUpdated', {
          fromBlock: from,
          toBlock: to,
        });
        if (events.length > 0) {
          const sorted = [...events].sort(
            (a, b) => a.blockNumber - b.blockNumber
          );
          firstEvent = sorted[0];
        }
      } catch {
        // If chunk fails, retry with smaller 10K chunks
        const SMALLER_CHUNK = 10000;
        for (
          let innerFrom = from;
          innerFrom <= to && !firstEvent;
          innerFrom += SMALLER_CHUNK
        ) {
          const innerTo = Math.min(innerFrom + SMALLER_CHUNK - 1, to);
          try {
            const innerEvents = await contract.getPastEvents('BalancesUpdated', {
              fromBlock: innerFrom,
              toBlock: innerTo,
            });
            if (innerEvents.length > 0) {
              const sorted = [...innerEvents].sort(
                (a, b) => a.blockNumber - b.blockNumber
              );
              firstEvent = sorted[0];
            }
          } catch {
            // Skip failed small chunks
          }
        }
      }
    }

    if (firstEvent) {
      const beginRate = bigIntDivide(
        firstEvent.returnValues.totalEth,
        firstEvent.returnValues.lsdTokenSupply
      );

      const beginTimestamp = Number(firstEvent.returnValues.time);
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const daysBetween = (currentTimestamp - beginTimestamp) / (60 * 60 * 24);

      if (
        !isNaN(beginRate) &&
        !isNaN(currentRate) &&
        currentRate !== 1 &&
        beginRate !== 1 &&
        daysBetween > 0
      ) {
        apr =
          ((currentRate - beginRate) / daysBetween) * 365 * 100;
      }
    }
    dispatch(setYearlyApr(apr));
  } catch (err: any) {
    console.log({ err });
    dispatch(setYearlyApr(apr));
  }
};
