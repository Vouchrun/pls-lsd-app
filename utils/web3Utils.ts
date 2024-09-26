import Web3 from 'web3';
import { getEthereumRpc, getLsdEthMetamaskParam } from 'config/env';
import snackbarUtil from './snackbarUtils';
import { AbiItem } from 'web3-utils';

declare const window: any;

export function createWeb3(provider?: any) {
  return new Web3(provider || (window.ethereum as any) || Web3.givenProvider);
}

let ethWeb3: Web3 | undefined = undefined;

/**
 * get Ethereum web3 instance singleton
 */
export function getEthWeb3() {
  const rpcLink = getEthereumRpc();
  if (!ethWeb3) {
    const useWebsocket = rpcLink.startsWith('wss');
    ethWeb3 = createWeb3(
      useWebsocket
        ? new Web3.providers.WebsocketProvider(rpcLink)
        : new Web3.providers.HttpProvider(rpcLink)
    );
  }
  return ethWeb3;
}

export async function getErc20AssetBalance(
  userAddress: string | undefined,
  tokenAbi: AbiItem | AbiItem[],
  tokenAddress: string | undefined
) {
  if (!userAddress || !tokenAbi || !tokenAddress) {
    return undefined;
  }
  try {
    let web3 = getEthWeb3();
    let contract = new web3.eth.Contract(tokenAbi, tokenAddress, {
      from: userAddress,
    });
    const result = await contract.methods.balanceOf(userAddress).call();
    let balance = web3.utils.fromWei(result + '', 'ether');

    return balance;
  } catch (err: any) {
    return undefined;
  }
}

/**
 * add lsd ETH to metamask
 */
export async function addLsdEthToMetaMask() {
  if (!window.ethereum) {
    return;
  }

  const params = getLsdEthMetamaskParam();

  try {
    window.ethereum
      .request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20', // Initially only supports ERC20, but eventually more!
          options: {
            address: params.tokenAddress, // The address that the token is at.
            symbol: params.tokenSymbol, // A ticker symbol or shorthand, up to 5 chars.
            decimals: params.tokenDecimals, // The number of decimals in the token
            image: params.tokenImage, // A string url of the token logo
          },
        },
      })
      .then((wasAdded: boolean) => {
        if (wasAdded) {
          snackbarUtil.success('Add token success');
        }
      });
  } catch (err: any) {}
}

/**
 * decode BalancesUpdated event log data
 * @param data event data
 * @param topics event topics
 * @returns decoded log values
 */
export function decodeBalancesUpdatedLog(data: string, topics: string[]) {
  const web3 = getEthWeb3();
  const values = web3.eth.abi.decodeLog(
    [
      {
        name: 'block',
        type: 'uint256',
      },
      {
        name: 'totalEth',
        type: 'uint256',
      },
      {
        name: 'lsdTokenSupply',
        type: 'uint256',
      },
      {
        name: 'time',
        type: 'uint256',
      },
    ],
    data,
    topics
  );
  return values;
}
