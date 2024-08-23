import classNames from 'classnames';
import { RootState } from 'redux/store';
import { useAppSelector } from 'hooks/common';
import { CircularLoading } from './CircularLoading';
import styles from 'styles/CustomButton.module.css';

type ButtonProps = React.PropsWithChildren<{
  disabled?: boolean;
  loading?: boolean;
  type?: 'primary' | 'secondary' | 'bg3' | 'bg4' | 'small' | 'stroke';
  mt?: string;
  width?: string;
  height?: string;
  fontSize?: string;
  radius?: string;
  tlRaidus?: string;
  trRaidus?: string;
  blRaidus?: string;
  brRaidus?: string;
  className?: string;
  textColor?: string;
  onClick?: () => void;
  border?: string;
}>;

export const CustomButton = (props: ButtonProps) => {
  const { darkMode } = useAppSelector((state: RootState) => {
    return { darkMode: state.app.darkMode };
  });

  const textColor = darkMode
    ? props.disabled
      ? '#6C86AD80'
      : props.type === 'stroke'
      ? '#E8EFFD'
      : '#1B1B1F'
    : props.disabled
    ? '#6C86AD80'
    : '#1B1B1F';

  return (
    <div
      className={classNames(
        props.disabled
          ? props.type === 'stroke'
            ? styles['button-stroke-disabled']
            : styles['button-disabled']
          : !props.type || props.type === 'primary'
          ? styles['button']
          : props.type === 'secondary'
          ? styles['button-secondary']
          : props.type === 'bg3'
          ? styles['button-bg3']
          : props.type === 'bg4'
          ? styles['button-bg4']
          : props.type === 'small'
          ? styles['button-small']
          : props.type === 'stroke'
          ? styles['button-stroke']
          : styles['button'],
        { 'opacity-50': props.loading },
        'px-[.28rem] cursor-pointer overflow-hidden',
        props.className || '',
        'active:opacity-50'
      )}
      style={{
        ...(props.width ? { width: props.width } : {}),
        color: props.textColor || textColor,
        height: props.height || '.42rem',
        marginTop: props.mt || '0',
        fontSize: props.fontSize || '0.16rem',
        // cursor: props.loading || props.disabled ? "default" : "pointer",
        borderRadius: props.radius || '.3rem',
        borderTopLeftRadius: props.tlRaidus || props.radius || '.3rem',
        borderTopRightRadius: props.trRaidus || props.radius || '.3rem',
        borderBottomLeftRadius: props.blRaidus || props.radius || '.3rem',
        borderBottomRightRadius: props.brRaidus || props.radius || '.3rem',
        border: props.border || '0.01rem solid rgba(108, 134, 173, 0.5)',
      }}
      onClick={() => {
        if (!props.disabled && !props.loading) {
          props.onClick && props.onClick();
        }
      }}
    >
      {props.loading && (
        <div
          style={{
            color: textColor,
          }}
        >
          <CircularLoading color='inherit' size={props.fontSize || '0.16rem'} />
        </div>
      )}

      <div className={classNames({ 'ml-1': props.loading })}>
        {props.children}
      </div>
    </div>
  );
};
