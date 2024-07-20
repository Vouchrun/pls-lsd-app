import { isDev } from "./env";
import appDevConfig from "./appConf/dev.json";
import appProdConfig from "./appConf/prod.json";
import lsdTokenContractAbi from "./abi/lsdToken.json";
import networkBalanceContractAbi from "./abi/networkBalance.json";
import networkWithdrawContractAbi from "./abi/networkWithdraw.json";
import depositContractAbi from "./abi/deposit.json";
import { AbiItem } from "web3-utils";

/**
 * get lsdETH token contract address.
 */
export function getLsdEthTokenContract() {
  if (isDev()) {
    return appDevConfig.contracts.lsdTokenContract.address;
  }
  return appProdConfig.contracts.lsdTokenContract.address;
}

/**
 * get ETH deposit contract address
 */
export function getEthDepositContract() {
  if (isDev()) {
    return appDevConfig.contracts.depositContract.address;
  }
  return appProdConfig.contracts.depositContract.address;
}

/**
 * get ETH withdraw contract address
 */
export function getEthWithdrawContract() {
  if (isDev()) {
    return appDevConfig.contracts.withdrawContract.address;
  }
  return appProdConfig.contracts.withdrawContract.address;
}

/**
 * get networkBalance contract address
 */
export function getNetworkBalanceContract() {
  if (isDev()) {
    return appDevConfig.contracts.networkBalanceContract.address;
  }
  return appProdConfig.contracts.networkBalanceContract.address;
}

/**
 * get lsdETH token contract ABI
 */
export function getLsdEthTokenContractAbi() {
  return lsdTokenContractAbi as AbiItem[];
}

/**
 * get ETH deposit contract ABI
 */
export function getEthDepositContractAbi() {
  return depositContractAbi as AbiItem[];
}

/**
 * get ETH withdraw contract ABI
 */
export function getEthWithdrawContractAbi() {
  return networkWithdrawContractAbi as AbiItem[];
}

/**
 * get networkBalance contract ABI
 */
export function getNetworkBalanceContractAbi() {
  return networkBalanceContractAbi as AbiItem[];
}
