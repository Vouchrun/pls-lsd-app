import React, { useState } from "react";
import { NavigationItem } from "interfaces/common";
import Head from "next/head";
import { HideOnScroll } from "components/common/HideOnScroll";
import { AppBar } from "@mui/material";
import dynamic from "next/dynamic";
import { useInit } from "hooks/useInit";
import classNames from "classnames";
import { useAppSlice } from "hooks/selector";
import { roboto } from "config/font";
import { StakeLoadingModal } from "components/modal/StakeLoadingModal";
import { UnstakeLoadingModal } from "components/modal/UnstakeLoadingModal";
import { WithdrawLoadingModal } from "components/modal/WithdrawLoadingModal";
import { StakeLoadingSidebar } from "components/modal/StakeLoadingSidebar";
import { UnstakeLoadingSidebar } from "components/modal/UnstakeLoadingSidebar";
import { WithdrawLoadingSidebar } from "components/modal/WithdrawLoadingSidebar";
import { getAppTitle } from "utils/configUtils";
import Footer from "./Footer";

const Navbar = dynamic(() => import("./Navbar"), { ssr: false });

export const MyLayoutContext = React.createContext<{
  navigation: NavigationItem[] | undefined;
  setNavigation: any;
}>({
  navigation: undefined,
  setNavigation: undefined,
});

export const Layout = (props: React.PropsWithChildren) => {
  useInit();

  const { darkMode } = useAppSlice();

  const [navigation, setNavigation] = useState<NavigationItem[]>([]);

  return (
    <MyLayoutContext.Provider
      value={{
        navigation,
        setNavigation,
      }}
    >
      <div className={classNames(darkMode ? "dark" : "", roboto.className)}>
        <Head>
          <title>{getAppTitle()}</title>
          <meta name="description" content="" />
          <meta
            name="viewport"
            content="initial-scale=1.0, width=device-width"
          />
        </Head>

        <HideOnScroll>
          <AppBar
            position="fixed"
            color="transparent"
            elevation={0}
            sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
          >
            <Navbar />
          </AppBar>
        </HideOnScroll>

        <main className="flex flex-col items-center pt-[1.16rem] h-[100vh]">
          <div className="mb-[1rem] w-full">{props.children}</div>
          <Footer />
        </main>

        <StakeLoadingModal />
        <UnstakeLoadingModal />
        <WithdrawLoadingModal />

        <div className="fixed right-0 top-[4rem]">
          <StakeLoadingSidebar />
          <UnstakeLoadingSidebar />
          <WithdrawLoadingSidebar />
        </div>
      </div>
    </MyLayoutContext.Provider>
  );
};
