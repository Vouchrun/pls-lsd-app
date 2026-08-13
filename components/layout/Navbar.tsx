import { Popover } from "@mui/material";
import classNames from "classnames";
import { CustomButton } from "components/common/CustomButton";
import { NoticeDrawer } from "components/drawer/NoticeDrawer";
import { SettingsDrawer } from "components/drawer/SettingsDrawer";
import { Icomoon } from "components/icon/Icomoon";
import { DashboardTabs } from "components/staking/DashboardTabs";
import { getEthereumChainId, getEthereumChainName } from "config/env";
import { useAppDispatch, useAppSelector } from "hooks/common";
import { useAppSlice } from "hooks/selector";
import { useEthUnclaimedWithdrawls } from "hooks/useUnclaimedWithdrawals";
import { useWalletAccount } from "hooks/useWalletAccount";
import { useRouter } from "next/router";
import {
  bindPopover,
  bindTrigger,
  usePopupState,
} from "material-ui-popup-state/hooks";
import Image from "next/image";
import appLogo from "public/images/appIconDark.svg";
import appLogoLight from "public/images/appIconLight.svg";

import defaultAvatar from "public/images/default_avatar.png";
import noticeIcon from "public/images/notice.png";
import { useEffect, useMemo, useState } from "react";
import {
  disconnectWallet,
  setMetaMaskAccount,
  setMetaMaskDisconnected,
} from "redux/reducers/WalletSlice";
import { RootState } from "redux/store";
import { getAuditList } from "utils/configUtils";
import { getChainIcon } from "utils/iconUtils";
import { getShortAddress } from "utils/stringUtils";
import { useAccount } from "wagmi";

const Navbar = () => {
  const router = useRouter();
  const { darkMode, unreadNoticeFlag } = useAppSlice();
  const dispatch = useAppDispatch();
  const [noticeDrawerOpen, setNoticeDrawerOpen] = useState(false);
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [auditExpand, setAuditExpand] = useState(false);
  // Navbar Withdraw link appears only when the connected wallet actually has
  // pending withdrawals (same wei-based detection as the page-level
  // StakePageTabs) — restores the auto-detection that was hard-coded to
  // `true` during the 2025-08 redesign.
  const { overallWei } = useEthUnclaimedWithdrawls();
  const showWithdrawTab = overallWei > 0n;
  const [pageWidth, setPageWidth] = useState(
    document.documentElement.clientWidth
  );

  const { isDisconnected, address } = useAccount();

  useEffect(() => {
    if (isDisconnected) {
      dispatch(setMetaMaskDisconnected(true));
      dispatch(setMetaMaskAccount(undefined));
    } else {
      if (address) {
        dispatch(setMetaMaskAccount(address));
        dispatch(setMetaMaskDisconnected(false));
      }
    }
  }, [isDisconnected, address, dispatch]);

  const resizeListener = () => {
    const clientW = document.documentElement.clientWidth;
    setPageWidth(clientW);
  };

  useEffect(() => {
    window.addEventListener("resize", resizeListener);
    resizeListener();

    return () => {
      window.removeEventListener("resize", resizeListener);
    };
  }, []);

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
    <div className="bg-color-bgPage py-[10px] lg:py-[25px] flex items-center justify-center">
      <div className="w-smallContentW xl:w-contentW 2xl:w-largeContentW mx-auto flex items-center justify-between relative">
        <div className="flex items-center relative">
          <AuditComponent
            expand={auditExpand}
            onExpandChange={setAuditExpand}
          />
          <div
            className={classNames(
              "flex items-center relative"
              // pageWidth >= 1600 ? "" : "pl-[1.06rem]"
            )}
          >
            {/* The nav strip itself is always visible; only the Withdraw
                link inside is conditional (showWithdrawTab). */}
            <DashboardTabs
              selectedTab={selectedTab}
              onChangeTab={updateTab}
              showWithdrawTab={showWithdrawTab}
            />
          </div>
        </div>
        {/* <div
          className={classNames(
            "absolute top-[.11rem] w-[82px] h-[20px] left-[-1.06rem]",
            pageWidth >= 1600 ? "left-[-1.06rem]" : "left-0"
          )}
        >
          
        </div> */}

        <div className={classNames("flex items-center")}>
          <div
            className={classNames(
              "ml-[.16rem] rounded-[80px]",
              darkMode ? "bg-[#333333]" : "bg-[#d7d4be]"
            )}
          >
            {/* {metaMaskAccount ? (
              <UserInfo auditExpand={auditExpand} />
            ) : (
              <ConnectButton />
            )} */}
            <w3m-button />
          </div>

          <div
            className={classNames(
              "cursor-pointer ml-[.3rem] w-[.42rem] h-[.42rem] flex items-center justify-center rounded-[.12rem] relative",
              noticeDrawerOpen ? "bg-color-selected" : ""
            )}
            onClick={() => {
              setSettingsDrawerOpen(false);
              setNoticeDrawerOpen(!noticeDrawerOpen);
            }}
          >
            <div className="h-[.25rem] w-[.22rem] relative">
              <Image src={noticeIcon} layout="fill" alt="notice" />
            </div>

            {unreadNoticeFlag && (
              <div className="bg-error rounded-full w-[.06rem] h-[.06rem] absolute right-[0.08rem] top-[0.08rem]"></div>
            )}
          </div>

          <div
            className={classNames(
              "cursor-pointer ml-[.3rem] w-[.42rem] h-[.42rem] flex items-center justify-center rounded-[.12rem]",
              settingsDrawerOpen ? "bg-color-selected" : ""
            )}
            onClick={() => {
              setNoticeDrawerOpen(false);
              setSettingsDrawerOpen(!settingsDrawerOpen);
            }}
          >
            <Icomoon icon="more" size=".2rem" color="#6C86AD" />
          </div>
        </div>

        <SettingsDrawer
          open={settingsDrawerOpen}
          onChangeOpen={setSettingsDrawerOpen}
        />

        <NoticeDrawer
          open={noticeDrawerOpen}
          onChangeOpen={setNoticeDrawerOpen}
        />
      </div>
    </div>
  );
};

// const UserInfo = (props: { auditExpand: boolean }) => {
//   const { auditExpand } = props;
//   const dispatch = useAppDispatch();
//   const { metaMaskAccount } = useWalletAccount();
//   const { darkMode } = useAppSelector((state: RootState) => {
//     return {
//       darkMode: state.app.darkMode,
//     };
//   });

//   const hideAddress = useMemo(() => {
//     return auditExpand;
//   }, [auditExpand]);

//   const addressPopupState = usePopupState({
//     variant: 'popover',
//     popupId: 'address',
//   });

//   return (
//     <div className='h-[.42rem] bg-color-bg2 rounded-[.6rem] flex items-stretch'>
//       <div
//         className={classNames(
//           'items-center pl-[.04rem] pr-[.12rem] rounded-l-[.6rem] cursor-pointer',
//           auditExpand ? 'hidden 2xl:flex' : 'flex'
//         )}
//       >
//         <div className='w-[.34rem] h-[.34rem] relative'>
//           <Image
//             src={getChainIcon()}
//             alt='logo'
//             className='rounded-full  overflow-hidden'
//             layout='fill'
//           />
//         </div>

//         <div
//           className={classNames('ml-[.08rem] text-[.16rem] text-color-text1')}
//         >
//           {getEthereumChainName()}
//         </div>

//         {/* <div className="ml-[.12rem]">
//           <Icomoon icon="arrow-down" size=".1rem" color="#848B97" />
//         </div> */}
//       </div>

//       <div
//         className={classNames(
//           'self-center h-[.22rem] w-[.01rem] bg-[#DEE6F7] dark:bg-[#6C86AD80]',
//           auditExpand ? 'hidden 2xl:flex' : 'flex'
//         )}
//       />

//       <div
//         className={classNames(
//           'cursor-pointer pr-[.04rem] flex items-center rounded-r-[.6rem]',
//           addressPopupState.isOpen ? 'bg-color-selected' : '',
//           auditExpand
//             ? 'rounded-[.6rem] pl-[.04rem] 2xl:rounded-r-[.6rem] 2xl:pl-[.12rem]'
//             : 'rounded-r-[.6rem]  pl-[.12rem]'
//         )}
//         {...bindTrigger(addressPopupState)}
//       >
//         <Image
//           src={defaultAvatar}
//           alt='logo'
//           className='w-[.34rem] h-[.34rem] rounded-full'
//         />

//         {!hideAddress && (
//           <div
//             className={classNames(
//               'mx-[.12rem] text-[.16rem]',
//               addressPopupState.isOpen ? 'text-text1 ' : 'text-color-text1'
//             )}
//           >
//             {getShortAddress(metaMaskAccount, 5)}
//           </div>
//         )}
//       </div>

//       {/* Address Menu */}
//       <Popover
//         {...bindPopover(addressPopupState)}
//         anchorOrigin={{
//           vertical: 'bottom',
//           horizontal: 'right',
//         }}
//         transformOrigin={{
//           vertical: 'top',
//           horizontal: 'right',
//         }}
//         elevation={0}
//         sx={{
//           marginTop: '.15rem',
//           '& .MuiPopover-paper': {
//             background: darkMode ? '#6C86AD4D' : '#ffffff80',
//             border: darkMode
//               ? '0.01rem solid #6C86AD80'
//               : '0.01rem solid #FFFFFF',
//             backdropFilter: 'blur(.4rem)',
//             borderRadius: '.3rem',
//           },
//           '& .MuiTypography-root': {
//             padding: '0px',
//           },
//           '& .MuiBox-root': {
//             padding: '0px',
//           },
//         }}
//       >
//         <div
//           className={classNames('p-[.16rem] w-[2rem]', darkMode ? 'dark' : '')}
//         >
//           <div
//             className='cursor-pointer flex items-center justify-between'
//             onClick={() => {
//               navigator.clipboard.writeText(metaMaskAccount || '').then(() => {
//                 addressPopupState.close();
//               });
//             }}
//           >
//             <div className='flex items-center'>
//               <div className='ml-[.12rem] text-color-text1 text-[.16rem]'>
//                 Copy Address
//               </div>
//             </div>
//           </div>

//           <div className='my-[.16rem] h-[0.01rem] bg-color-divider1' />

//           <div
//             className='cursor-pointer flex items-center justify-between'
//             onClick={() => {
//               addressPopupState.close();
//               dispatch(disconnectWallet());
//             }}
//           >
//             <div className='ml-[.12rem] text-color-text1 text-[.16rem]'>
//               Disconnect
//             </div>
//           </div>
//         </div>
//       </Popover>
//     </div>
//   );
// };

// const ConnectButton = () => {
//   const dispatch = useAppDispatch();
//   const { metaMaskChainId } = useWalletAccount();
//   const { switchChainAsync } = useSwitchChain();
//   const { connectAsync, connectors } = useConnect();

//   const isWrongMetaMaskNetwork = useMemo(() => {
//     return Number(metaMaskChainId) !== getEthereumChainId();
//   }, [metaMaskChainId]);

//   const clickConnectWallet = async () => {
//     if (isWrongMetaMaskNetwork) {
//       await (switchChainAsync &&
//         switchChainAsync({ chainId: getEthereumChainId() }));
//     }

//     const metamaskConnector = connectors.find(
//       (c) => c.name === 'MetaMask' || c.name === 'Rabby Wallet'
//     );
//     if (!metamaskConnector) {
//       return;
//     }
//     try {
//       dispatch(setMetaMaskDisconnected(false));
//       await connectAsync({
//         chainId: getEthereumChainId(),
//         connector: metamaskConnector,
//       });
//     } catch (err: any) {
//       if (err.code === 4001) {
//       } else {
//         console.error(err);
//       }
//     }
//   };

//   return (
//     <CustomButton
//       type='small'
//       height='.42rem'
//       onClick={() => {
//         clickConnectWallet();
//       }}
//       border='none'
//       // textColor={darkMode ? "#E8EFFD" : ""}
//     >
//       Connect Wallet
//     </CustomButton>
//   );
// };

interface AuditComponentProps {
  expand: boolean;
  onExpandChange: (expand: boolean) => void;
}

const AuditComponent = (props: AuditComponentProps) => {
  const { expand, onExpandChange } = props;
  const { darkMode } = useAppSlice();
  const { metaMaskAccount } = useWalletAccount();

  useEffect(() => {
    if (metaMaskAccount) {
      onExpandChange(false);
    }
  }, [metaMaskAccount, onExpandChange]);

  return (
    <div
      className={classNames(
        "cursor-pointer ml-[.04rem] w-[1.54rem] h-[.40rem] relative rounded-full mr-[10px]",
        expand ? "border-[0.01rem]" : ""
      )}
    >
      <div
        onClick={() => {
          onExpandChange(!expand);
        }}
      >
        <Image
          src={darkMode ? appLogo : appLogoLight}
          alt="stafi"
          className="relative h-auto w-auto"
        />
      </div>

      <div
        className={classNames(
          "items-center origin-left",
          expand ? "animate-expand flex" : "animate-collapse hidden"
        )}
      >
        <div
          className="text-color-text2 ml-[.06rem] text-[.14rem] w-[.8rem] min-w-[.8rem] break-normal"
          style={
            {
              // maxLines: 1,
              // overflow: "hidden",
              // textOverflow: "ellipsis",
              // WebkitLineClamp: 1,
              // lineClamp: 1,
              // display: "-webkit-box",
              // WebkitBoxOrient: "vertical",
            }
          }
        >
          Audited By
        </div>

        {getAuditList().map(
          (item: { name: string; icon: string; iconDark: string }) => (
            <div
              className="ml-[.1rem] w-[.8rem] h-[.17rem] relative"
              key={item.name}
            >
              <Image
                src={darkMode ? item.iconDark : item.icon}
                alt="audit"
                layout="fill"
              />
            </div>
          )
        )}

        <div
          className="mx-[.12rem] cursor-pointer"
          onClick={() => {
            onExpandChange(false);
          }}
        >
          <Icomoon icon="collapse" size=".12rem" />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
