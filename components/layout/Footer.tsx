import React from "react";
import { useAppSlice } from "hooks/selector";

export default function Footer() {
  const { darkMode, unreadNoticeFlag } = useAppSlice();
  return (
    <div className="w-smallContentW xl:w-contentW 2xl:w-largeContentW mx-auto pb-1 flex flex-row justify-between items-center">
      <div className="text-color-text1">v2.1.4 unstake</div>
      <a
        href="https://www.stafi.io/"
        target="_blank"
        className="flex items-center justify-end"
      >
        <div className="text-color-text1">
          Powered by StaFi LSaaS
        </div>
        <img
          src="/images/logoStafi.svg"
          alt="stafi"
          width={30}
          className="ml-[5px]"
        />
      </a>
    </div>
  );
}
