import classNames from "classnames";
import { useAppSelector } from "hooks/common";
import { RootState } from "redux/store";

interface CustomInputProps {
  disabled?: boolean;
  placeholder?: string;
  fontSize?: string;
  bold?: boolean;
  value: string;
  primary?: boolean;
  light?: boolean;
  handleValueChange?: (value: string) => void;
  alignRight?: boolean;
  styles?: any;
}

export const CustomNumberInput = (props: CustomInputProps) => {
  const { darkMode } = useAppSelector((state: RootState) => {
    return { darkMode: state.app.darkMode };
  });

  return (
    <input
      disabled={props.disabled}
      className={classNames(
        "w-full bg-transparent border-none outline-none bg-color-bg2 py-[10px] px-[20px] rounded-[35px] mr-[15px] h-[.42rem]",
        props.light
          ? "text-text-black1 placeholder:text-text2"
          : props.primary
          ? "text-primary placeholder:text-placdholder-primary"
          : "text-color-text1 placeholder:text-text2/50 dark:placeholder:text-text2Dark/50",
        props.alignRight ? "text-right" : "text-left"
      )}
      style={{
        fontSize: props.fontSize ? `${props.fontSize}` : ".2rem",
        fontWeight: props.bold ? "bold" : "400",
        ...(props.styles || {}),
      }}
      value={props.value}
      placeholder={props.placeholder}
      onChange={(e) => {
        let value = e.target.value.replace(/[^\d.]/g, "");
        // value = value.replace(/^\./g, "");
        value = value.replace(/\.{2,}/g, ".");
        value = value
          .replace(".", "$#$")
          .replace(/\./g, "")
          .replace("$#$", ".");
        const regexTemplate = /^(-)*(\d*)\.(\d\d\d\d\d\d).*$/;
        value = value.replace(regexTemplate, "$1$2.$3");
        props.handleValueChange && props.handleValueChange(value);
      }}
    />
  );
};
