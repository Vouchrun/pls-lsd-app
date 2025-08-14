import { useAppSlice } from 'hooks/selector';
import classNames from 'classnames';

type Props = React.PropsWithChildren<{}>;

export const PageTitleContainer = (props: Props) => {
  const { darkMode } = useAppSlice();

  return (
    <div
      className={classNames('flex justify-center pt-[15px] pb-[15px] bg-[#edece3] dark:bg-[#111111] border-color-border1 border-b-[1px]')}
      // style={{
      //   boxShadow: darkMode ? '0px 1px 0px #6C86AD4D' : '0px 1px 0px #FFFFFF',
      // }}
    >
      <div className='w-smallContentW xl:w-contentW 2xl:w-largeContentW flex flex-col'>
        <div>{props.children}</div>
      </div>
    </div>
  );
};
