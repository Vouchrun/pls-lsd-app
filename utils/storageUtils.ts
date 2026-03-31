import dayjs from "dayjs";
import { getTokenName } from "./configUtils";

export const STORAGE_KEY_DARK_MODE = "eth_lsd_dark_mode_v2";
export const STORAGE_KEY_NOTICE = "eth_lsd_notice_v2";
export const STORAGE_KEY_UNREAD_NOTICE = "eth_lsd_unread_notice_v2";
export const STORAGE_KEY_UNBOND_RECORDS = "eth_lsd_unbond_records";
export const STORAGE_KEY_DISCONNECT_METAMASK = "eth_lsd_disconnect_metamask";
export const STORAGE_KEY_CUSTOM_RPC = "eth_lsd_custom_rpc";

const tokenName = getTokenName();

export function saveStorage(key: string, value: string) {
  localStorage.setItem(key, value);
}

export function getStorage(key: string): string | null {
  return localStorage.getItem(key);
}

export function removeStorage(key: string) {
  localStorage.removeItem(key);
}

export function addRTokenUnbondRecords(record: any) {
  const localUnbondRecords = getStorage(STORAGE_KEY_UNBOND_RECORDS);
  const unbondRecords = localUnbondRecords
    ? JSON.parse(localUnbondRecords)
    : null;
  let arr: any[] = [];
  if (unbondRecords && unbondRecords[tokenName]) {
    arr = unbondRecords[tokenName];
  }

  const newLen = arr.unshift({ ...record, timestamp: dayjs().valueOf() });
  if (newLen > 10) {
    arr.pop();
  }
  const newUnbondRecords = {
    ...unbondRecords,
    [tokenName]: arr,
  };

  saveStorage(STORAGE_KEY_UNBOND_RECORDS, JSON.stringify(newUnbondRecords));
}

export function removeRTokenUnbondRecords(record: any) {
  const localUnbondRecords = getStorage(STORAGE_KEY_UNBOND_RECORDS);
  const unbondRecords = localUnbondRecords
    ? JSON.parse(localUnbondRecords)
    : null;
  let arr: any[] = [];
  if (unbondRecords && unbondRecords[tokenName]) {
    arr = unbondRecords[tokenName];
  }

  const matchIndex = arr.findIndex((item) => item.txHash === record.txHash);
  arr.splice(matchIndex, 1);

  const newUnbondRecords = {
    ...unbondRecords,
    [tokenName]: arr,
  };

  saveStorage(STORAGE_KEY_UNBOND_RECORDS, JSON.stringify(newUnbondRecords));
}
