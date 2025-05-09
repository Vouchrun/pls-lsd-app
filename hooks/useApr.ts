import { RootState } from 'redux/store';
import { useAppSelector } from './common';

export function useApr() {
  const { apr, yearlyApr } = useAppSelector((state: RootState) => {
    return {
      apr: state.lsdEth.apr,
      yearlyApr: state.lsdEth.yearlyApr,
    };
  });

  return { apr, yearlyApr };
}
