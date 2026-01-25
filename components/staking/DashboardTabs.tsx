import classNames from 'classnames';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import Image from 'next/image';
import menuIcon from 'public/images/burger-menu.svg';
import Link from 'next/link';

interface Props {
  selectedTab: 'stake' | 'unstake' | 'withdraw' | 'staking-pools';
  onChangeTab: (tab: 'stake' | 'unstake' | 'withdraw' | 'staking-pools') => void;
  showWithdrawTab?: boolean;
}

export const DashboardTabs = (props: Props) => {
  const router = useRouter();
  const { showWithdrawTab } = props;

  const showWithdraw = useMemo(() => {
    return showWithdrawTab || router.query.tab === 'withdraw';
  }, [router.query, showWithdrawTab]);
  const [isActive, setIsActive] = useState(false);
  const handleClick = () => {
    setIsActive((prev) => !prev); // Toggle state
  };

  return (
    <>
      <Image
        src={menuIcon}
        alt='stafi'
        height='30'
        width='30'
        className='cursor-pointer block xl:hidden ml-[60px]'
        onClick={handleClick}
      />
      <div
        className={`w-[280px] sm:w-[280px] xl:w-[650px] h-auto p-[20px] lg:p-[.04rem] items-stretch bg-[#edece3] dark:bg-[#111111] rounded-[15px] lg:rounded-[.6rem] xl:grid absolute xl:relative top-[40px] xl:top-0 gap-0
  ${isActive ? 'flex flex-col' : 'hidden'}
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
          gridTemplateColumns: '20% 20% 20% 20% 20%',
        }}
      >
        <Link
          className={classNames(
            'h-[35px] cursor-pointer flex items-center justify-center text-[.15rem] rounded-[.3rem]',
            (props.selectedTab === 'stake' ||
              props.selectedTab === 'unstake' ||
              router.pathname.startsWith('/PLS/')) &&
              !router.pathname.startsWith('/dashboard') &&
              !router.pathname.startsWith('/staking-pools')
              ? 'text-color-highlight bg-color-highlight'
              : 'text-color-text1'
          )}
          href={`/PLS/?tab=stake`}
          // onClick={() => props.onChangeTab("stake")}
        >
          Stake PLS
        </Link>

        {showWithdraw && (
          <div className='flex items-stretch'>
            {/* <div className="ml-[.1rem] w-[0.01rem] h-[.22rem] bg-[#DEE6F7] dark:bg-bg1Dark self-center" /> */}
            <Link
              className={classNames(
                'h-[35px] flex-1 ml-[.1rem] cursor-pointer flex items-center justify-center text-[.15rem] rounded-[.3rem]',
                props.selectedTab === 'withdraw' &&
                  !router.pathname.startsWith('/dashboard')
                  ? 'text-color-highlight bg-color-highlight'
                  : 'text-color-text1'
              )}
              href={`/PLS/?tab=withdraw`}
              // onClick={() => props.onChangeTab("withdraw")}
            >
              Withdraw
            </Link>
          </div>
        )}
        <div className='flex items-stretch'>
          {/* <div className="ml-[.1rem] mr-[.1rem] w-[0.01rem] h-[.22rem] bg-[#DEE6F7] dark:bg-bg1Dark self-center" /> */}
          <Link
            href={'/dashboard'}
            className={classNames(
              'h-[35px] flex-1 ml-[.1rem] cursor-pointer flex items-center justify-center text-[.15rem] rounded-[.3rem]',

              router.pathname.startsWith('/dashboard')
                ? 'text-color-highlight bg-color-highlight'
                : 'text-color-text1'
            )}
          >
            Dashboard
          </Link>
        </div>

        <div className='flex items-stretch'>
          {/* <div className="ml-[.1rem] w-[0.01rem] h-[.22rem] bg-[#DEE6F7] dark:bg-bg1Dark self-center" /> */}
          <Link
            className={classNames(
              'h-[35px] flex-1 ml-[.1rem] cursor-pointer flex items-center justify-center text-[.15rem] rounded-[.3rem] whitespace-nowrap',
              router.pathname.startsWith('/staking-pools')
                ? 'text-color-highlight bg-color-highlight'
                : 'text-color-text1'
            )}
            href='/staking-pools'
            // onClick={() => props.onChangeTab("withdraw")}
          >
            Staking Pools
          </Link>
        </div>

        <div className='flex items-stretch'>
          {/* <div className="ml-[.1rem] w-[0.01rem] h-[.22rem] bg-[#DEE6F7] dark:bg-bg1Dark self-center" /> */}
          <Link
            className={classNames(
              'h-[35px] flex-1 ml-[.1rem] cursor-pointer flex items-center justify-center text-[.15rem] rounded-[.3rem] whitespace-nowrap text-[#FFF]',
              router.pathname.startsWith('')
                // ? 'text-color-highlight bg-color-highlight'
                // : 'text-color-text1'
            )}
            target='_blank'
            href='https://pulseswap.io/?chain=pulsechain&from=0x0000000000000000000000000000000000000000&to=0xD34f5ADC24d8Cc55C1e832Bdf65fFfDF80D1314f'
            // onClick={() => props.onChangeTab("withdraw")}
          >
            Buy VOUCH
          </Link>
        </div>
      </div>
    </>
  );
};
