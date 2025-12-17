import { RootState } from "redux/store";
import { useAppSelector } from "./common";
import { useMemo } from "react";

export function useAppSlice() {
  // Use separate selectors to avoid creating new objects
  const darkMode = useAppSelector((state: RootState) => state.app.darkMode);
  const updateFlag = useAppSelector((state: RootState) => state.app.updateFlag);
  const unreadNoticeFlag = useAppSelector((state: RootState) => state.app.unreadNoticeFlag);

  // Memoize the return value to prevent unnecessary rerenders
  return useMemo(
    () => ({ darkMode, updateFlag, unreadNoticeFlag }),
    [darkMode, updateFlag, unreadNoticeFlag]
  );
}
