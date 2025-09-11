import React from 'react'
import { Icomoon } from "components/icon/Icomoon";
import { StakePagetwo } from 'components/staking/StakePagetwo';


export default function vouchstaking() {
    return (
        <div className=' mt-[37px] px-[30px] max-md:px-[15px] pt-[40px]'>
            <div className='max-w-[1360px] bg-color-bg2 border-color-border1 border justify-center m-auto rounded-[30px] h-[1200px] max-lg:h-auto'>
                <div className='py-[20px] mb-[16px] bg-[#333] rounded-t-[30px] rounded-t-0'>
                    <p className='text-[24px] max-md:text-[20px] font-normal text-[#E8EFFD] text-center'>My Vouch Holdings</p>
                </div>
                <div className='grid grid-flow-col grid-rows-1 max-lg:grid-rows-2 gap-4 px-[35px] max-sm:px-[21px] relative'>
                    <div className='bg-[#333] h-[1000px] w-[1px] absolute left-[50%] max-lg:bg-transparent'></div>
                    <div className='bg-[#333] h-[6px] w-[6px] absolute left-[49.8%] origin-center rotate-45 max-lg:bg-transparent'></div>
                    <div className='bg-[#333] h-[6px] w-[6px] absolute left-[49.8%] bottom-[-24px] origin-center rotate-45 max-lg:bg-transparent'></div>
                    <div className=' '>
                        <div className='flex items-center mb-[37px]'>
                            <div className="w-[66px] h-[66px] mr-[16px]">
                                <img src='/images/token/vPLS_trans.svg' alt="icon" />
                            </div>
                            <div>
                                <p className='text-[18px] font-normal text-[#FFFBFA] flex mb-[10px]'>vPLS
                                    <a href='#' className="ml-[.06rem] flex items-center m-l-[2px]">
                                        <Icomoon icon="share" size=".12rem" color="#FFF" />
                                    </a>
                                </p>
                                <p className='text-[13px] font-normal text-[#A6A6A6] mt-[3px]'>The Liquid Staking Token of Vouch. Stake to receive Rewards.</p>
                            </div>
                        </div>
                        <div className='flex justify-between'>
                            <div>
                                <p className='text-[15px] font-normal text-[#FFFBFA] mb-[6px]'>Available Balance</p>
                                <p className='text-[28px] max-sm:text-[22px] font-normal text-[#A6A6A6]'> <span className='text-[#FFFBFA] mr-[3px]'>0</span>vPLS</p>
                            </div>
                            <button className='text-[15px] font-normal text-[#FFFBFA] border-[#333] hover:border-[#fff] border rounded-[4px] px-[17px] max-sm:px-[11px]'>Stake PLS</button>
                        </div>
                        <div className='border-color-border1 border rounded-[8px] my-[37px] relative p-l[8px]'>
                            <p className='text-[14px] font-medium text-[#8E9397] mb-[7px] mt-[18px] text-center'>Staked <Icomoon icon="tip" size=".12rem" color="#333333" /></p>
                            <p className='text-[16px] font-normal text-[#A6A6A6] mb-[7px] text-center'> <span className='text-[#FFFBFA] mr-[3px]'>0</span>vPLS</p>
                            <p className='text-[13px] font-medium text-[#A6A6A6] mb-[7px] text-center'>$0.00</p>
                            <div className='grid grid-flow-col grid-rows-1 max-sm:grid-rows-2 gap-4 max-sm:gap-1 mt-[20px]'>
                                <div>
                                    <p className='text-[14px] font-medium text-[#8E9397] mb-[13px] text-center relative z-[1]'>Staking Rewards</p>
                                    <div className='flex max-w-[160px] justify-between mx-auto mt-[20px] mb-[8px]'>
                                        <p className='text-[18px] font-normal text-[#FFFBFA] text-center'>000000.0 </p>
                                        <p className='text-[18px] font-normal text-[#A6A6A6] text-center'> vPLS</p>
                                    </div>
                                    <div className='flex max-w-[160px] justify-between mx-auto mb-[8px]'>
                                        <p className='text-[18px] font-normal text-[#FFFBFA] text-center'>000000.0 </p>
                                        <p className='text-[18px] font-normal text-[#A6A6A6] text-center'>  VOUCH</p>
                                    </div>
                                    <div className='flex max-w-[160px] justify-between mx-auto mb-[10px]'>
                                        <p className='text-[18px] font-normal text-[#FFFBFA] text-center'>000000.0 </p>
                                        <p className='text-[18px] font-normal text-[#A6A6A6] text-center'>   PLS</p>
                                    </div>
                                </div>
                                <div>
                                    <p className='text-[13px] font-medium text-[#8E9397] mb-[13px] text-center relative z-[1]'>Holder APR</p>
                                    <div className='flex max-w-[160px] justify-between mx-auto mt-[20px] mb-[8px]'>
                                        <p className='text-[18px] font-normal text-[#FFFBFA] text-center'>15%  </p>
                                        <p className='text-[18px] font-normal text-[#A6A6A6] text-center mr-[8px]'>  7 Day Avg</p>
                                    </div>
                                    <div className='flex max-w-[160px] justify-between mx-auto mb-[10px]'>
                                        <p className='text-[18px] font-normal text-[#FFFBFA] text-center'>12.5% </p>
                                        <p className='text-[18px] font-normal text-[#A6A6A6] text-center mr-[8px]'>   1 Yr Avg</p>
                                    </div>
                                </div>
                                <div className='bg-[#333] h-[1px] w-[45px] absolute top-[49%]'></div>
                                <div className='bg-[#333] h-[1px] w-[45px] absolute right-0 top-[49%]'></div>

                            </div>
                        </div>
                        <div>
                            <StakePagetwo />
                        </div>
                        <div className='mt-[37px] flex justify-between mb-[20px]'>
                            <div>
                                <p className='text-[13px] font-normal text-[#A6A6A6] mb-[8px]'>VPLS Price</p>
                                <p className='text-[23px] font-normal text-[#FFFBFA]'>$2.62<span className='text-[#FC8181] text-[18px]'>-1.50%</span></p>
                                <p className='text-[#A6A6A6] text-[13px] mt-[3px]'>VPLS Token Supply</p>
                            </div>
                            <div>
                                <p className='text-[13px] font-normal text-[#A6A6A6]'>Market Cap</p>
                                <p className='text-[23px] font-normal text-[#FFFBFA] mt-[9px]'>$94.02M</p>
                            </div>
                        </div>
                        <div className='border-color-border1 border rounded-[8px] p-[3px] flex'>
                            <div className='bg-[#333] h-[36px] w-[30%] rounded-l-[6px]'></div>
                            <div className='bg-gradient-to-r from-[#ff8533] via-[#ffa162] to-[#ff8c3e] w-[70%]  rounded-r-[6px]'></div>
                        </div>

                        <div className='mt-[37px] flex justify-between mb-[20px]'>
                            <div>
                                <p className='text-[13px] font-medium text-[#A6A6A6] mb-[8px]'>Staked</p>
                                <div className='flex items-center mt-[10px]'>
                                    <div className='h-[11px] w-[11px] rounded-[2px] mr-[6px] bg-[#333]'></div>
                                    <p className='text-[13px] font-normal text-[#A6A6A6]'>4.76M </p>
                                    
                                </div>
                            </div>
                            <div>
                                <p className='text-[13px] font-medium text-[#A6A6A6]'>Total. Supply</p>
                                <div className='flex items-center mt-[10px]'>
                                    <div className='h-[11px] w-[11px] rounded-[2px] mr-[6px] bg-[#B0CED1]'></div>
                                    <p className='text-[13px] font-normal text-[#A6A6A6]'>35.86M </p>
                                    
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* col2 */}
                    <div className=' '>
                        <div className='flex items-center mb-[37px]'>
                            <div className="w-[66px] h-[66px] mr-[16px]">
                                <img src='/favicon.png' alt="icon" className="w-[66px] h-[66px] "/>
                            </div>
                            <div>
                                <p className='text-[18px] font-normal text-[#FFFBFA] flex mb-[10px]'>VOUCH
                                    <a href='#' className="ml-[.06rem] flex items-center m-l-[2px]">
                                        <Icomoon icon="share" size=".12rem" color="#FFF" />
                                    </a>
                                </p>
                                <p className='text-[13px] font-normal text-[#A6A6A6] mt-[3px]'>The Liquid Staking Token of Vouch. Stake to receive Rewards.</p>
                            </div>
                        </div>
                        <div className='flex justify-between'>
                            <div>
                                <p className='text-[15px] font-normal text-[#FFFBFA] mb-[6px]'>Available Balance</p>
                                <p className='text-[28px] font-normal text-[#A6A6A6]'> <span className='text-[#FFFBFA] mr-[3px]'>0</span>VOUCH</p>
                            </div>
                            <button className='text-[15px] font-normal text-[#FFFBFA] border-[#333] hover:border-[#fff] border rounded-[4px] px-[17px]'>BUY VOUCH</button>
                        </div>
                        <div className='border-color-border1 border rounded-[8px] my-[37px] relative p-l[8px]'>
                            <p className='text-[14px] font-medium text-[#8E9397] mb-[7px] mt-[18px] text-center'>Staked <Icomoon icon="tip" size=".12rem" color="#333333" /></p>
                            <p className='text-[16px] font-normal text-[#A6A6A6] mb-[7px] text-center'> <span className='text-[#FFFBFA] mr-[3px]'>0</span>VOUCH</p>
                            <p className='text-[13px] font-medium text-[#A6A6A6] mb-[7px] text-center'>$0.00</p>
                            <div className='grid grid-flow-col grid-rows-1 max-sm:grid-rows-2 gap-4 max-sm:gap-2 mt-[20px]'>
                                <div>
                                    <p className='text-[14px] font-medium text-[#8E9397] mb-[13px] text-center relative z-[1]'>Staking Rewards</p>
                                    <div className='flex max-w-[160px] justify-between mx-auto mt-[20px] mb-[8px]'>
                                        <p className='text-[18px] font-normal text-[#FFFBFA] text-center'>000000.0 </p>
                                        <p className='text-[18px] font-normal text-[#A6A6A6] text-center'> vPLS</p>
                                    </div>
                                    <div className='flex max-w-[160px] justify-between mx-auto mb-[8px]'>
                                        <p className='text-[18px] font-normal text-[#FFFBFA] text-center'>000000.0 </p>
                                        <p className='text-[18px] font-normal text-[#A6A6A6] text-center'>  VOUCH</p>
                                    </div>
                                    <div className='flex max-w-[160px] justify-between mx-auto mb-[10px]'>
                                        <p className='text-[18px] font-normal text-[#FFFBFA] text-center'>000000.0 </p>
                                        <p className='text-[18px] font-normal text-[#A6A6A6] text-center'>   PLS</p>
                                    </div>
                                </div>
                                <div>
                                    <p className='text-[13px] font-medium text-[#8E9397] mb-[13px] text-center relative z-[1]'>Holder Rewards</p>
                                    <div className='flex max-w-[160px] justify-between mx-auto mt-[20px] mb-[8px]'>
                                        <p className='text-[18px] font-normal text-[#FFFBFA] text-center'>000000.0 </p>
                                        <p className='text-[18px] font-normal text-[#A6A6A6] text-center mr-[8px]'>  vPLS</p>
                                    </div>
                                    <div className='flex max-w-[160px] justify-between mx-auto mb-[10px]'>
                                        <p className='text-[18px] font-normal text-[#FFFBFA] text-center'>000000.0 </p>
                                        <p className='text-[18px] font-normal text-[#A6A6A6] text-center mr-[8px]'> VOUCH</p>
                                    </div>
                                     <div className='flex max-w-[160px] justify-between mx-auto mb-[10px]'>
                                        <p className='text-[18px] font-normal text-[#FFFBFA] text-center'>000000.0 </p>
                                        <p className='text-[18px] font-normal text-[#A6A6A6] text-center mr-[8px]'> PLS</p>
                                    </div>
                                </div>
                                <div className='bg-[#333] h-[1px] w-[45px] absolute top-[49%]'></div>
                                <div className='bg-[#333] h-[1px] w-[45px] absolute right-0 top-[49%]'></div>

                            </div>
                        </div>
                        <div>
                            <StakePagetwo />
                        </div>
                        <div className='mt-[37px] flex justify-between mb-[20px]'>
                            <div>
                                <p className='text-[13px] font-normal text-[#A6A6A6] mb-[8px]'>VOUCH Price</p>
                                <p className='text-[23px] font-normal text-[#FFFBFA]'>$2.62<span className='text-[#FC8181] text-[18px]'>-1.50%</span></p>
                                <p className='text-[#A6A6A6] text-[13px] mt-[3px]'>VOUCH Token Supply</p>
                            </div>
                            <div>
                                <p className='text-[13px] font-normal text-[#A6A6A6]'>Market Cap</p>
                                <p className='text-[23px] font-normal text-[#FFFBFA] mt-[9px]'>$94.02M</p>
                            </div>
                        </div>
                        <div className='border-color-border1 border rounded-[8px] p-[3px] flex'>
                            <div className='bg-[#333] h-[36px] w-[30%] rounded-l-[6px]'></div>
                            <div className='bg-gradient-to-r from-[#ff8533] via-[#ffa162] to-[#ff8c3e] w-[70%]  rounded-r-[6px]'></div>
                        </div>

                        <div className='mt-[37px] flex justify-between mb-[20px]'>
                            <div>
                                <p className='text-[13px] font-medium text-[#A6A6A6] mb-[8px]'>Staked</p>
                                <div className='flex items-center mt-[10px]'>
                                    <div className='h-[11px] w-[11px] rounded-[2px] mr-[6px] bg-[#333]'></div>
                                    <p className='text-[13px] font-normal text-[#A6A6A6]'>4.76M </p>
                                    
                                </div>
                            </div>
                            <div>
                                <p className='text-[13px] font-medium text-[#A6A6A6]'>Total. Supply</p>
                                <div className='flex items-center mt-[10px]'>
                                    <div className='h-[11px] w-[11px] rounded-[2px] mr-[6px] bg-[#B0CED1]'></div>
                                    <p className='text-[13px] font-normal text-[#A6A6A6]'>35.86M </p>
                                    
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
