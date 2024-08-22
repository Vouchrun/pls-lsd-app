import classNames from "classnames";
import { CustomTag } from "components/common/CustomTag";
import { FaqItem } from "components/common/FaqItem";
import { PageTitleContainer } from "components/common/PageTitleContainer";
import { DashboardTabs } from "components/staking/DashboardTabs";
import { WithdrawUnstaked } from "components/staking/WithdrawUnstaked";
import { Icomoon } from "components/icon/Icomoon";
import {
  getEthDepositContract,
  getEthWithdrawContract,
  getLsdEthTokenContract,
} from "config/contract";
import { getEtherScanAccountUrl } from "config/explorer";
import { useEthUnclaimedWithdrawls } from "hooks/useUnclaimedWithdrawals";
import Image from "next/image";
import { useRouter } from "next/router";
import auditIcon from "public/images/audit.svg";
import cooperationIcon from "public/images/cooperation.svg";
import { useMemo } from "react";
import { openLink } from "utils/commonUtils";
import { formatNumber } from "utils/numberUtils";
import { addLsdEthToMetaMask } from "utils/web3Utils";
import { getLsdTokenIcon } from "utils/iconUtils";
import {
  IFaqItem,
  getDetailInfoAudit,
  getDetailInfoListedIns,
  getFaqList,
  getLsdEthName,
  getSupportChains,
  IFaqContent,
  getTokenName,
} from "utils/configUtils";
import { StakePage } from "components/staking/StakePage";
import { useBalance } from "hooks/useBalance";
import { useLsdEthRate } from "hooks/useLsdEthRate";
import { useWalletAccount } from "hooks/useWalletAccount";
import { useApr } from "hooks/useApr";
import { GetStaticProps } from "next";

export async function getStaticPaths() {
  return {
    paths: [{ params: { tokenName: getTokenName() } }],
    fallback: false,
  };
}

export const getStaticProps: GetStaticProps = async (context) => {
  return { props: {} };
};

const ETHPage = () => {
  const router = useRouter();
  const { apr } = useApr();

  const {
    overallAmount,
    claimableAmount,
    claimableWithdrawals,
    willReceiveAmount,
  } = useEthUnclaimedWithdrawls();

  const { metaMaskAccount } = useWalletAccount();

  const { lsdBalance } = useBalance();
  const rate = useLsdEthRate();

  const stakedEth = useMemo(() => {
    if (isNaN(Number(lsdBalance)) || isNaN(Number(rate))) {
      return "--";
    }
    return Number(lsdBalance) * Number(rate);
  }, [lsdBalance, rate]);

  const selectedTab = useMemo(() => {
    const tabParam = router.query.tab;
    if (tabParam) {
      switch (tabParam) {
        case "stake":
        case "unstake":
        case "withdraw":
          return tabParam;
        default:
          return "stake";
      }
    }
    return "stake";
  }, [router.query]);

  const showWithdrawTab = useMemo(() => {
    return (
      !!overallAmount &&
      !isNaN(Number(overallAmount)) &&
      Number(overallAmount) > 0
    );
  }, [overallAmount]);

  const updateTab = (tab: string) => {
    router.replace({
      pathname: router.pathname,
      query: {
        ...router.query,
        tab,
      },
    });
  };

  const renderFaqContent = (content: IFaqContent, index: number) => {
    if (content.type === "link") {
      if (content.content.endsWith("\n")) {
        return (
          <div className={classNames(index > 0 ? "mt-faqGap" : "")} key={index}>
            <a
              className="text-color-link cursor-pointer"
              href={content.link}
              target="_blank"
              rel="noreferrer"
            >
              {content.content.trimEnd()}
            </a>
          </div>
        );
      } else {
        return (
          <a
            className="text-color-link cursor-pointer"
            href={content.link}
            target="_blank"
            rel="noreferrer"
            key={index}
          >
            {content.content}
          </a>
        );
      }
    } else {
      if (content.content.endsWith("\n")) {
        return (
          <div className={classNames(index > 0 ? "mt-faqGap" : "")} key={index}>
            {content.content}
          </div>
        );
      } else {
        return <span key={index}>{content.content}</span>;
      }
    }
  };

  const renderFaqContents = (contents: IFaqContent[]) => {
    const renderedJSX: React.ReactElement[] = [];
    contents.forEach((content: IFaqContent, index: number) => {
      const contentJSX = renderFaqContent(content, index);
      renderedJSX.push(contentJSX);
    });
    return renderedJSX;
  };

  return (
    <div>
      <PageTitleContainer>
        <div className="h-full flex items-center w-smallContentW xl:w-contentW 2xl:w-largeContentW">
          <div className="w-[.68rem] h-[.68rem] relative">
            <Image src={getLsdTokenIcon()} layout="fill" alt="icon" />
          </div>
          <div className="ml-[.12rem]">
            <div className="flex items-center">
              <div className="text-[.34rem] font-[700] text-color-text1">
                {getLsdEthName()}
              </div>

              <div className="ml-[.16rem]">
                <CustomTag type="stroke">
                  <div className="text-[.16rem] scale-75 origin-center">
                    PRC20
                  </div>
                </CustomTag>
              </div>

              <div className="ml-[.06rem]">
                <CustomTag>
                  <div className="text-[.16rem] scale-75 origin-center flex items-center">
                    <span className="font-[700]">
                      {formatNumber(apr, { decimals: 2 })}%
                    </span>
                    <span className="ml-[.02rem]">LST APR</span>
                  </div>
                </CustomTag>
              </div>

              <div
                className="ml-[.24rem] flex items-center cursor-pointer"
                onClick={() => {
                  addLsdEthToMetaMask();
                }}
              >
                <div className="text-color-link text-[.14rem]">
                  Add {getLsdEthName()} to Wallet
                </div>

                <span className="ml-[.06rem] flex items-center">
                  <Icomoon icon="share" size=".12rem" />
                </span>
              </div>
            </div>

            <div className="mt-[.04rem] text-color-text2 text-[.16rem] scale-75 origin-bottom-left">
              On {getSupportChains().join(", ")}{" "}
              {getSupportChains().length > 1 ? "Chains" : "Chain"}
            </div>
          </div>

          {metaMaskAccount && (
            <div className="ml-auto mr-[.56rem] flex flex-col justify-center items-end">
              <div className="text-[.34rem] font-[700] text-color-text1">
                {formatNumber(lsdBalance)}
              </div>
              <div className="text-[.12rem] text-color-text2 mt-[.04rem]">
                {formatNumber(stakedEth)} {getTokenName()} Staked
              </div>
            </div>
          )}
        </div>
      </PageTitleContainer>

      <div className="w-smallContentW xl:w-contentW 2xl:w-largeContentW mx-auto">
        <div className="my-[.36rem] mr-[.56rem]">
          {showWithdrawTab && (
            <DashboardTabs
              selectedTab={selectedTab}
              onChangeTab={updateTab}
              showWithdrawTab={showWithdrawTab}
            />
          )}

          <div className="mt-[.36rem] flex ">
            <div className={classNames("flex-1 min-w-[6.2rem] w-[6.2rem]")}>
              {(selectedTab === "stake" || selectedTab === "unstake") && (
                <StakePage />
              )}

              {selectedTab === "withdraw" && (
                <WithdrawUnstaked
                  overallAmount={overallAmount}
                  willReceiveAmount={willReceiveAmount}
                  claimableAmount={claimableAmount}
                  claimableWithdrawals={claimableWithdrawals}
                />
              )}
            </div>

            <div className="ml-[.87rem] flex-1">
              <div className="text-[.24rem] text-color-text1">Detail Info</div>

              <div className="mt-[.15rem] bg-color-bg3 rounded-[.12rem] py-[.16rem] px-[.24rem] text-[.14rem]">
                <div className="flex items-center">
                  <div className="w-[.22rem] h-[.22rem] relative">
                    <Image src={auditIcon} alt="audit" layout="fill" />
                  </div>
                  <div className="ml-[.06rem] text-color-text1 font-[700]">
                    Audit
                  </div>
                </div>

                <div
                  className="cursor-pointer mt-[.12rem] text-color-link"
                  onClick={() => {
                    openLink(getDetailInfoAudit().link);
                  }}
                >
                  <span className="mr-[.12rem] dark:text-linkDark/50">
                    Audited By {getDetailInfoAudit().nameList.join(", ")}
                  </span>
                  <span className="min-w-[.15rem] min-h-[.15rem]">
                    <Icomoon icon="share" size=".12rem" />
                  </span>
                </div>

                <div
                  className={classNames(
                    "mt-[.16rem] items-center",
                    getDetailInfoListedIns().length > 0 ? "flex" : "hidden"
                  )}
                >
                  <div className="w-[.22rem] h-[.22rem] relative">
                    <Image src={cooperationIcon} alt="audit" layout="fill" />
                  </div>

                  <div className="ml-[.06rem] text-color-text1 font-[700]">
                    Listed In
                  </div>
                </div>
                {getDetailInfoListedIns().map(
                  (item: { name: string; link: string }) => (
                    <div
                      className="cursor-pointer mt-[.12rem] text-color-link"
                      onClick={() => {
                        openLink(item.link);
                      }}
                      key={item.name}
                    >
                      <span className="mr-[.12rem] dark:text-linkDark/50">
                        {item.name}
                      </span>
                      <Icomoon icon="share" size=".12rem" />
                    </div>
                  )
                )}
              </div>

              <div className="mt-[.16rem] bg-color-bg3 rounded-[.12rem] py-[.16rem] px-[.24rem] text-[.14rem]">
                <div className="text-color-text1 font-[700]">
                  {getLsdEthName()} Token Contract Address
                </div>

                <div
                  className="cursor-pointer mt-[.12rem] text-color-link flex items-center"
                  onClick={() => {
                    openLink(getEtherScanAccountUrl(getLsdEthTokenContract()));
                  }}
                >
                  <span className="mr-[.12rem] flex-1 break-all leading-normal dark:text-linkDark/50">
                    {getLsdEthTokenContract()}
                  </span>

                  <div className="min-w-[.12rem]">
                    <Icomoon icon="share" size=".12rem" />
                  </div>
                </div>

                <div className="mt-[.16rem] text-color-text1 font-[700]">
                  {getLsdEthName()} Deposit Contract Address
                </div>

                <div
                  className="cursor-pointer mt-[.12rem] text-color-link flex items-center"
                  onClick={() => {
                    openLink(getEtherScanAccountUrl(getEthDepositContract()));
                  }}
                >
                  <span className="mr-[.12rem] flex-1 break-all leading-normal dark:text-linkDark/50">
                    {getEthDepositContract()}
                  </span>

                  <div className="min-w-[.12rem]">
                    <Icomoon icon="share" size=".12rem" />
                  </div>
                </div>

                <div className="mt-[.16rem] text-color-text1 font-[700]">
                  {getLsdEthName()} Withdraw Contract Address
                </div>

                <div
                  className="cursor-pointer mt-[.12rem] text-color-link flex items-center"
                  onClick={() => {
                    openLink(getEtherScanAccountUrl(getEthWithdrawContract()));
                  }}
                >
                  <span className="mr-[.12rem] flex-1 break-all leading-normal dark:text-linkDark/50">
                    {getEthWithdrawContract()}
                  </span>

                  <div className="min-w-[.12rem]">
                    <Icomoon icon="share" size=".12rem" />
                  </div>
                </div>

                <div className="mt-[.16rem] text-color-text1 font-[700] hidden">
                  {getLsdEthName()} Onchain Exchange Rate Source
                </div>

                <div className="mt-[.12rem] text-color-link hidden items-center">
                  <span className="mr-[.12rem] flex-1 break-all leading-normal dark:text-linkDark/50">
                    SDK
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {getFaqList().length > 0 && (
          <div className={classNames("mr-[.56rem] pb-[.56rem]")}>
            <div className="mt-[.16rem] text-[.24rem] text-color-text1">
              FAQ
            </div>

            <div
              className="grid items-start mt-[.16rem]"
              style={{
                gridTemplateColumns: "48% 48%",
                columnGap: "4%",
                rowGap: ".16rem",
              }}
            >
              {getFaqList().map((item: IFaqItem, index: number) => (
                <FaqItem text={item.title} key={index}>
                  {renderFaqContents(item.contents)}
                </FaqItem>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ETHPage;
