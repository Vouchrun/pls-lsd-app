import appConfig from 'config/appConf/app.json';

export function getTokenName() {
  return appConfig.token.tokenName;
}

export function getLsdEthName() {
  return appConfig.token.lsdTokenName;
}

export function getAppTitle() {
  return appConfig.appTitle;
}

export function getSupportChains() {
  return appConfig.token.supportChains;
}

export function getDetailInfoListedIns() {
  return appConfig.detailedInfo.listedIns;
}

export function getDetailInfoAudit() {
  return appConfig.detailedInfo.audit;
}

export interface IFaqContent {
  type: string;
  content: string;
  link?: string;
}
export interface IFaqItem {
  title: string;
  contents: IFaqContent[];
}

export function getFaqList(): IFaqItem[] {
  return appConfig.faqList;
}

export function getUnstakeTipLink() {
  return appConfig.unstake.lockTipLink;
}

export function getUnstakeDuration() {
  return appConfig.unstake.duration;
}

export function getAuditList() {
  return appConfig.auditList;
}

export function getTokenPriceUrl() {
  return appConfig.tokenPriceUrl;
}

export function getDefaultApr() {
  return appConfig.apr;
}

export function getContactList() {
  return appConfig.contactList;
}

export function getExternalLinkList() {
  return appConfig.externalLinkList;
}

export function getThresholdAPR() {
  return appConfig.APR_warning_threshold;
}
