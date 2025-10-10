import React from 'react';
import classNames from 'classnames';

interface FarmsTabsProps {
  selectedTab: 'stake' | 'unstake';
  onTabChange: (tab: 'stake' | 'unstake') => void;
}

export const FarmsTabs: React.FC<FarmsTabsProps> = ({ selectedTab, onTabChange }) => {
  return (
    <div className="bg-color-bg2 border-[0px] ">
      {/* Tab Headers */}
      <div
        className="h-[.56rem] grid items-stretch"
        style={{ gridTemplateColumns: '50% 50%' }}
      >
        {/* Stake Tab */}
        <div
          className={classNames(
            'cursor-pointer flex items-center justify-center text-[.16rem] text-[#1B1B1F] text-color-text1 border-[0px]',
            selectedTab === 'stake'
              ? 'font-[700] border-[#ff4400]/30 bg-gradient-to-r from-[#ff8533] to-[#ffa162]'
              : 'border-color-border1 bg-[#E2E0D0] dark:bg-[#333333]'
          )}
          onClick={() => onTabChange('stake')}
        >
          Stake
        </div>

        {/* Unstake Tab */}
        <div
          className={classNames(
            'cursor-pointer flex items-center justify-center text-[#1B1B1F] text-[.16rem] text-color-text1 border-[0px]',
            selectedTab === 'unstake'
              ? 'font-[700] border-[#ff4400]/30 bg-gradient-to-r from-[#ff8533] to-[#ffa162] text-[#1B1B1F]'
              : 'border-color-border1 bg-[#E2E0D0] dark:bg-[#333333] text-[#1B1B1F]'
          )}
          onClick={() => onTabChange('unstake')}
        >
          Unstake 
        </div>
      </div>
    </div>
  );
};
