import { Icomoon } from "components/icon/Icomoon";
import { openLink } from "utils/commonUtils";
import { useAppSlice } from 'hooks/selector';

interface Props {
  text: string;
  link: string;
  mt?: string;
}

export const MenuItem = (props: Props) => {
  const { darkMode, unreadNoticeFlag } = useAppSlice();
  return (
    <div
      className="cursor-pointer flex items-center justify-between"
      style={{
        marginTop: props.mt || "0",
      }}
      onClick={() => {
        openLink(props.link);
      }}
    >
      <div
        className="text-color-text2 text-[.16rem] font-[500] flex-1"
        style={{
          maxLines: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          WebkitLineClamp: 1,
          lineClamp: 1,
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          color: darkMode ? '#fff' : '#1b1b1f'
        }}
      >
        {props.text}
      </div>

      <Icomoon icon="right" size=".12rem" color="#6C86AD" />
    </div>
  );
};
