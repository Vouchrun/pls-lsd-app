import classNames from "classnames";
import { useMemo } from "react";
import { useRouter } from "next/router";
import styles from "styles/CustomButton.module.css";
import { LsdTokenStaketwo } from "./LsdTokenStaketwo";
import { LsdTokenUnstaketwo } from "./LsdTokenUnstaketwo";

export const StakePagetwo = () => {
  const router = useRouter();

  const selectedTab = useMemo(() => {
    const tabParam = router.query.tab;
    if (tabParam) {
      switch (tabParam) {
        case "stake":
        case "unstake":
        case "trade":
        case "bridge":
        case "withdraw":
          return tabParam;
        default:
          return "stake";
      }
    }
    return "stake";
  }, [router.query]);

  const updateTab = (tab: string) => {
    router.replace({
      pathname: router.pathname,
      query: {
        ...router.query,
        tab,
      },
    });
  };

  return (
    <div>
      <div className="bg-color-bg2 rounded-[.3rem] pb-[.14rem] border-[.01rem] border-color-border1">
        <div
          className="h-[.56rem] grid items-stretch"
          style={{ gridTemplateColumns: "50% 50%" }}
        >
          <div
            className={classNames(
              "cursor-pointer flex items-center justify-center rounded-tl-[.3rem] text-[.16rem] text-color-text1 border-[0.01rem]",
              selectedTab === "stake"
                ? "font-[700] border-[#ff4400]/30"
                : "border-color-border1",
              selectedTab === "stake"
                ? styles["selected-bg"]
                : "bg-[#E2E0D0] dark:bg-[#333333]"
            )}
            style={{
              // background:
              //   selectedTab === "stake"
              //     ? darkMode
              //       ? "linear-gradient(274.08deg, rgba(128, 202, 255, 0.5) 1.81%, rgba(133, 224, 163, 0.5) 96.22%)"
              //       : "linear-gradient(274.08deg, rgba(128, 202, 255, 0.2) 1.81%, rgba(133, 224, 163, 0.2) 96.22%)"
              //     : darkMode
              //     ? "#6C86AD4D"
              //     : "#ffffff80",
              borderRightWidth: selectedTab === "stake" ? "0.01rem" : "0px",
            }}
            onClick={() => {
              updateTab("stake");
            }}
          >
            Stake vPLS
          </div>

          <div
            className={classNames(
              "cursor-pointer flex items-center justify-center rounded-tr-[.3rem] text-[.16rem] text-color-text1 border-[0.01rem]",
              selectedTab === "unstake"
                ? "font-[700] border-[#ff4400]/30"
                : "border-color-border1",
              selectedTab === "unstake"
                ? styles["selected-bg"]
                : "bg-[#E2E0D0] dark:bg-[#333333]"
            )}
            style={{
              // background:
              //   selectedTab === "unstake"
              //     ? darkMode
              //       ? "linear-gradient(274.08deg, rgba(128, 202, 255, 0.5) 1.81%, rgba(133, 224, 163, 0.5) 96.22%)"
              //       : "linear-gradient(274.08deg, rgba(128, 202, 255, 0.2) 1.81%, rgba(133, 224, 163, 0.2) 96.22%)"
              //     : darkMode
              //     ? "#6C86AD4D"
              //     : "#ffffff80",
              borderLeftWidth: selectedTab === "unstake" ? "0.01rem" : "0px",
            }}
            onClick={() => {
              updateTab("unstake");
            }}
          >
            Unstake vPLS
          </div>
        </div>

        {selectedTab === "stake" && <LsdTokenStaketwo />}

        {selectedTab === "unstake" && <LsdTokenUnstaketwo />}
      </div>
    </div>
  );
};
