import React from 'react'
import { useAppSlice } from "hooks/selector";
import Image from "next/image";
import appLogo from "public/images/stafi_logo.png";
import appLogoLight from "public/images/stafi_logo_lightmode.png";

export default function Footer() {
    const { darkMode, unreadNoticeFlag } = useAppSlice();
  return (
    <div className='w-smallContentW xl:w-contentW 2xl:w-largeContentW mx-auto pb-1'>
        <a href='https://www.stafi.io/' target='_blank' className='flex items-center justify-end'>
            <div style={{ color: darkMode ? "#fff" : "#000" }}>Powered by staFi LSAAS</div>
            <Image
                src={darkMode ? appLogo : appLogoLight}
                alt="stafi"
                width={80}
                className='ml-[5px]'
            />
        </a>
    </div>
  )
}
