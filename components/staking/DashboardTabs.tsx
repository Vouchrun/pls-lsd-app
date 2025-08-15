import classNames from "classnames";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import Image from "next/image";
import menuIcon from "public/images/burger-menu.svg";
import Link from "next/link";

interface Props {
  selectedTab: "stake" | "unstake" | "withdraw";
  onChangeTab: (tab: "stake" | "unstake" | "withdraw") => void;
  showWithdrawTab?: boolean;
}

export const DashboardTabs = (props: Props) => {
  const router = useRouter();
  const { showWithdrawTab } = props;

  const showWithdraw = useMemo(() => {
    return showWithdrawTab || router.query.tab === "withdraw";
  }, [router.query, showWithdrawTab]);
  const [isActive, setIsActive] = useState(false);
  const handleClick = () => {
    setIsActive((prev) => !prev); // Toggle state
  };

  return (
    <>
      <Image
        src={menuIcon}
        alt="stafi"
        height="30"
        width="30"
        className="cursor-pointer block xl:hidden ml-[60px]"
        onClick={handleClick}
      />
      <div
        className={`w-[280px] sm:w-[280px] xl:w-[420px] h-auto p-[20px] lg:p-[.04rem] items-stretch bg-[#edece3] dark:bg-[#111111] rounded-[15px] lg:rounded-[.6rem] xl:grid absolute xl:relative top-[40px] xl:top-0 gap-0
  ${isActive ? "flex flex-col" : "hidden"}
  [&>*:not(:last-child):after]:content-['|'] 
  [&>*:not(:last-child):after]:absolute 
  [&>*:not(:last-child):after]:right-[-1px] 
  [&>*:not(:last-child):after]:top-1/2 
  [&>*:not(:last-child):after]:-translate-y-1/2 
  [&>*:not(:last-child):after]:text-color-text1 
  [&>*:not(:last-child):after]:opacity-30
  [&>*]:relative
  [&>*.tab-active:after]:hidden
  [&>*:has(+_.tab-active):after]:hidden`}
        style={{
          gridTemplateColumns: "33.33% 33.33% 33.33%",
        }}
      >
        <Link
          className={classNames(
            "h-[35px] cursor-pointer flex items-center justify-center text-[.16rem] rounded-[.3rem]",
            (props.selectedTab === "stake" ||
              props.selectedTab === "unstake" ||
              router.pathname.startsWith("/PLS/")) &&
              !router.pathname.startsWith("/dashboard")
              ? "text-color-highlight bg-color-highlight"
              : "text-color-text1"
          )}
          href={`/PLS/?tab=stake`}
          // onClick={() => props.onChangeTab("stake")}
        >
          Stake
        </Link>

        {showWithdraw && (
          <div className="flex items-stretch">
            {/* <div className="ml-[.1rem] w-[0.01rem] h-[.22rem] bg-[#DEE6F7] dark:bg-bg1Dark self-center" /> */}
            <Link
              className={classNames(
                "h-[35px] flex-1 ml-[.1rem] cursor-pointer flex items-center justify-center text-[.16rem] rounded-[.3rem]",
                props.selectedTab === "withdraw" &&
                  !router.pathname.startsWith("/dashboard")
                  ? "text-color-highlight bg-color-highlight"
                  : "text-color-text1"
              )}
              href={`/PLS/?tab=withdraw`}
              // onClick={() => props.onChangeTab("withdraw")}
            >
              Withdraw
            </Link>
          </div>
        )}
        <div className="flex items-stretch">
          {/* <div className="ml-[.1rem] mr-[.1rem] w-[0.01rem] h-[.22rem] bg-[#DEE6F7] dark:bg-bg1Dark self-center" /> */}
          <Link
            href={"/dashboard"}
            className={classNames(
              "h-[35px] flex-1 ml-[.1rem] cursor-pointer flex items-center justify-center text-[.16rem] rounded-[.3rem]",

              router.pathname.startsWith("/dashboard")
                ? "text-color-highlight bg-color-highlight"
                : "text-color-text1"
            )}
          >
            Dashboard
          </Link>
        </div>
      </div>
    </>
  );
};
