import classNames from 'classnames';
import { getEthereumChainId, getEthereumChainName } from 'config/env';
import { getReferralDepositContract, getReferralDepositContractAbi } from 'config/contract';
import { CustomButton } from 'components/common/CustomButton';
import { CustomNumberInput } from 'components/common/CustomNumberInput';
import { useAppDispatch } from 'hooks/common';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { setMetaMaskDisconnected } from 'redux/reducers/WalletSlice';
import { decodeEventLog, getEventSelector, isAddress, parseEther } from 'viem';
import { waitForTransactionReceipt } from 'viem/actions';
import type { Address, Hex } from 'viem';
import { useAccount, useConnect, usePublicClient, useSwitchChain, useWriteContract } from 'wagmi';

const REFERRAL_DEPOSIT_DEPLOYED_BLOCK = 27215580n;
const BPS_DENOMINATOR = 10_000n;
const WAD = 10n ** 18n;

const REFERRER_REGISTERED_EVENT = {
  type: 'event' as const,
  name: 'ReferrerRegistered',
  inputs: [
    { type: 'uint256', name: 'id', indexed: true },
    { type: 'address', name: 'owner', indexed: true },
    { type: 'address', name: 'wallet', indexed: true },
    { type: 'uint256', name: 'feeBps', indexed: false },
    { type: 'uint256', name: 'maxFeePls', indexed: false },
  ],
};

const REFERRER_REGISTERED_TOPIC = getEventSelector(REFERRER_REGISTERED_EVENT);

interface OwnedCode {
  id: bigint;
  wallet: Address;
  feeBps: bigint;
  maxFeePls: bigint;
}

const REFERRAL_OVERVIEW_URL =
  'https://vouch.run/docs/referral/';

export default function Referral() {
  const dispatch = useAppDispatch();
  const { address: account, chainId } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [payoutWallet, setPayoutWallet] = useState('');
  const [feeBps, setFeeBps] = useState('30');
  const [maxFeePls, setMaxFeePls] = useState('5000');
  const [globalMaxFeeBps, setGlobalMaxFeeBps] = useState<bigint | null>(null);
  const [rate, setRate] = useState<bigint | null>(null);
  const [contractAvailable, setContractAvailable] = useState(true);
  const [myCodes, setMyCodes] = useState<OwnedCode[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [created, setCreated] = useState<OwnedCode | null>(null);
  const [creating, setCreating] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  const contractAddress = getReferralDepositContract();
  const referralAbi = getReferralDepositContractAbi();

  const walletNotConnected = useMemo(() => !account, [account]);
  const isWrongNetwork = useMemo(
    () => Number(chainId) !== getEthereumChainId(),
    [chainId]
  );

  useEffect(() => {
    if (!publicClient) return;
    let cancelled = false;
    (async () => {
      try {
        const [cap, currentRate] = await Promise.all([
          publicClient.readContract({
            address: contractAddress as Address,
            abi: referralAbi as never,
            functionName: 'maxFeeBps',
            args: [],
          }),
          publicClient.readContract({
            address: contractAddress as Address,
            abi: referralAbi as never,
            functionName: 'getRate',
            args: [],
          }),
        ]);
        if (!cancelled) {
          setGlobalMaxFeeBps(cap as bigint);
          setRate(currentRate as bigint);
        }
      } catch {
        if (!cancelled) setContractAvailable(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [publicClient, contractAddress, referralAbi]);

  const loadMyCodes = useCallback(async () => {
    if (!account || !publicClient) return;
    setLoadingCodes(true);
    try {
      const logs = await publicClient.getLogs({
        address: contractAddress as Address,
        event: REFERRER_REGISTERED_EVENT,
        args: { owner: account },
        fromBlock: REFERRAL_DEPOSIT_DEPLOYED_BLOCK,
        toBlock: 'latest',
      });
      const codes = logs
        .map((log) => {
          const decoded = decodeEventLog({
            abi: referralAbi as never,
            data: log.data,
            topics: log.topics,
          });
          const args = decoded.args as unknown as {
            id: bigint;
            wallet: Address;
            feeBps: bigint;
            maxFeePls: bigint;
          };
          return {
            id: args.id,
            wallet: args.wallet,
            feeBps: args.feeBps,
            maxFeePls: args.maxFeePls,
          };
        })
        .filter((code): code is OwnedCode => code.id != null);
      setMyCodes(codes);
    } catch (err) {
      console.error('Failed to load referral codes', err);
      setMyCodes([]);
    } finally {
      setLoadingCodes(false);
    }
  }, [account, publicClient, contractAddress, referralAbi]);

  useEffect(() => {
    loadMyCodes();
  }, [loadMyCodes]);

  const resolvedPayoutWallet = useMemo<Address | null>(() => {
    const trimmed = payoutWallet.trim();
    if (trimmed === '') return account ?? null;
    if (!isAddress(trimmed)) return null;
    return trimmed as Address;
  }, [payoutWallet, account]);

  const feeBpsBig = useMemo(() => {
    const n = Math.floor(Number(feeBps) || 0);
    return Number.isFinite(n) && n >= 0 ? BigInt(n) : null;
  }, [feeBps]);

  const maxFeePlsBig = useMemo(() => {
    try {
      return parseEther((Number(maxFeePls) || 0).toString());
    } catch {
      return 0n;
    }
  }, [maxFeePls]);

  const feePreviewPls = useMemo(() => {
    if (!rate || feeBpsBig === null) return null;
    const cap = globalMaxFeeBps ?? 500n;
    const bps = feeBpsBig > cap ? cap : feeBpsBig;
    const amount = 100_000n * WAD;
    const estVpls = (amount * WAD) / rate;
    const rawFee = (estVpls * bps) / BPS_DENOMINATOR;
    const feeCap = maxFeePlsBig > 0n ? (maxFeePlsBig * WAD) / rate : rawFee;
    const fee = rawFee > feeCap ? feeCap : rawFee;
    return (fee * rate) / WAD;
  }, [rate, feeBpsBig, maxFeePlsBig, globalMaxFeeBps]);

  const formValid = useMemo(() => {
    return (
      !!resolvedPayoutWallet && feeBpsBig !== null && feeBpsBig <= (globalMaxFeeBps ?? 500n)
    );
  }, [resolvedPayoutWallet, feeBpsBig, globalMaxFeeBps]);

  const [buttonDisabled, buttonText, isButtonSecondary] = useMemo(() => {
    if (!contractAvailable) {
      return [true, 'Not available on this network'];
    }
    if (walletNotConnected) {
      return [false, 'Connect Wallet'];
    }
    if (isWrongNetwork) {
      return [
        false,
        `Wrong network, click to change into ${getEthereumChainName()}`,
        true,
      ];
    }
    if (!formValid) {
      return [true, 'Create Referral Code'];
    }
    return [false, 'Create Referral Code'];
  }, [contractAvailable, walletNotConnected, isWrongNetwork, formValid]);

  const clickConnectWallet = async () => {
    if (isWrongNetwork) {
      await (switchChainAsync && switchChainAsync({ chainId: getEthereumChainId() }));
      return;
    }
    const metamaskConnector = connectors.find(
      (c) => c.name === 'MetaMask' || c.name === 'Rabby Wallet'
    );
    if (!metamaskConnector) {
      return;
    }
    try {
      dispatch(setMetaMaskDisconnected(false));
      await connectAsync({
        chainId: getEthereumChainId(),
        connector: metamaskConnector,
      });
    } catch (err: any) {
      if (err.code === 4001) {
        return;
      }
      console.error(err);
    }
  };

  const handleCreate = useCallback(async () => {
    if (!publicClient || !resolvedPayoutWallet || feeBpsBig === null || creating) return;
    setTxError(null);
    setCreating(true);
    try {
      const hash = await writeContractAsync({
        address: contractAddress as Address,
        abi: referralAbi as never,
        functionName: 'registerReferrer',
        args: [resolvedPayoutWallet, feeBpsBig, maxFeePlsBig],
      });
      const receipt = await waitForTransactionReceipt(publicClient, { hash });
      const log = receipt.logs.find((l) => l.topics[0] === REFERRER_REGISTERED_TOPIC);
      if (log) {
        const decoded = decodeEventLog({
          abi: referralAbi as never,
          data: log.data,
          topics: log.topics,
        });
        const args = decoded.args as unknown as OwnedCode;
        const code: OwnedCode = {
          id: args.id,
          wallet: args.wallet,
          feeBps: args.feeBps,
          maxFeePls: args.maxFeePls,
        };
        if (code.id != null) {
          setCreated(code);
          setMyCodes((prev) => [code, ...prev.filter((c) => c.id !== code.id)]);
        }
      }
    } catch (err) {
      const e = err as { code?: number };
      if (e?.code === 4001) {
        setTxError('Transaction cancelled in your wallet.');
      } else {
        setTxError('Transaction failed. Check your fee settings and try again.');
      }
    } finally {
      setCreating(false);
    }
  }, [
    publicClient,
    resolvedPayoutWallet,
    feeBpsBig,
    maxFeePlsBig,
    creating,
    contractAddress,
    referralAbi,
    writeContractAsync,
  ]);

  const clickCreate = () => {
    if (walletNotConnected || isWrongNetwork) {
      clickConnectWallet();
      return;
    }
    handleCreate();
  };



  const fieldCard = 'bg-[#edece3] dark:bg-[#111111] rounded-[.3rem] p-[.16rem]';
  const fieldPill =
    'h-[.42rem] bg-color-bg2 rounded-[.3rem] flex items-center px-[.16rem] whitespace-nowrap';
  const fieldLabel = 'text-color-text1 text-[.16rem]';
  const fieldInput =
    'w-full bg-color-bg2 border-none outline-none py-[10px] px-[20px] rounded-[35px] h-[.42rem] text-color-text1 placeholder:text-text2/50 dark:placeholder:text-text2Dark/50';
  const helperText = 'text-[.14rem] text-color-text2 mt-[.08rem]';

  return (
    <div className='mt-[37px] px-[30px] max-md:px-[15px] pt-[40px]'>
      <div className='max-w-[1080px] m-auto'>
        <h1 className='text-center text-[.3rem] font-semibold text-color-text1'>
          Referral Code Creation
        </h1>
        <p className='mt-[.08rem] text-center text-[.17rem] text-color-text2'>
          Create your referral code settings and earn fees when integrating Vouch PLS staking into
          your site or protocol.
        </p>

        <div className='mt-[.25rem] grid grid-cols-1 lg:grid-cols-2 gap-[.25rem] items-start'>
          <div>
            <div className='bg-color-bg2 border border-color-border1 rounded-[30px] p-[.24rem] max-sm:p-[.16rem]'>
              <div className={fieldCard}>
                <div className={classNames(fieldPill, 'w-max')}>
                  <span className={fieldLabel}>Payout Wallet</span>
                </div>
                <div className='mt-[.08rem]'>
                  <input
                    className={fieldInput}
                    style={{ fontSize: '.14rem', fontFamily: 'monospace' }}
                    value={payoutWallet}
                    placeholder={account ?? '0x...'}
                    onChange={(e) => setPayoutWallet(e.target.value)}
                  />
                </div>
                <div className={helperText}>
                  Fees are paid to this wallet. Defaults to your connected wallet.
                </div>
                {payoutWallet.trim() !== '' && !resolvedPayoutWallet && (
                  <div className='text-[.14rem] text-error mt-[.06rem]'>
                    Invalid wallet address.
                  </div>
                )}
              </div>

              <div className={classNames(fieldCard, 'mt-[.16rem]')}>
                <div className='flex items-center'>
                  <div className={fieldPill}>
                    <span className={fieldLabel}>Fee Rate</span>
                  </div>
                  <div className='flex-1 pl-[.14rem]'>
                    <CustomNumberInput
                      value={feeBps}
                      handleValueChange={setFeeBps}
                      fontSize='.2rem'
                    />
                  </div>
                </div>
                <div className={helperText}>
                  Fee in basis points — 1% = 100 bps. Global maximum is{' '}
                  {globalMaxFeeBps !== null ? Number(globalMaxFeeBps) : 300} bps.
                </div>
                {feeBpsBig !== null && feeBpsBig > (globalMaxFeeBps ?? 500n) && (
                  <div className='text-[.14rem] text-error mt-[.06rem]'>
                    Fee rate exceeds the global maximum.
                  </div>
                )}
              </div>

              <div className={classNames(fieldCard, 'mt-[.16rem]')}>
                <div className='flex items-center'>
                  <div className={fieldPill}>
                    <span className={fieldLabel}>Max Fee (PLS)</span>
                  </div>
                  <div className='flex-1 pl-[.14rem]'>
                    <CustomNumberInput
                      value={maxFeePls}
                      handleValueChange={setMaxFeePls}
                      fontSize='.2rem'
                    />
                  </div>
                </div>
                <div className={helperText}>
                  Absolute fee cap per deposit, in PLS value. Set 0 for a fee-free promo link.
                </div>
              </div>

              <CustomButton
                loading={creating}
                disabled={buttonDisabled}
                mt='.18rem'
                height='.56rem'
                type={isButtonSecondary ? 'secondary' : 'primary'}
                onClick={clickCreate}
                border='none'
                width='100%'
              >
                {creating ? 'Creating...' : buttonText}
              </CustomButton>

              {txError && (
                <div className='text-[.14rem] text-error mt-[.1rem] text-center'>{txError}</div>
              )}

              <div
                className='mx-[.5rem] my-[.2rem] grid items-stretch font-[500]'
                style={{ gridTemplateColumns: '40% 30% 30%' }}
              >
                <div className='flex justify-start'>
                  <div className='flex flex-col items-center'>
                    <div className='text-text2/50 dark:text-text2Dark/50 text-[.14rem]'>
                      Fee @100k PLS
                    </div>
                    <div className='mt-[.1rem] text-color-text2 text-[.16rem]'>
                      {feePreviewPls !== null
                        ? `${(Number(feePreviewPls) / 1e18).toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })} PLS`
                        : '--'}
                    </div>
                  </div>
                </div>

                <div className='flex flex-col items-center'>
                  <div className='text-text2/50 dark:text-text2Dark/50 text-[.14rem]'>Fee Rate</div>
                  <div className='mt-[.1rem] text-color-text2 text-[.16rem]'>
                    {feeBpsBig !== null
                      ? `${(Number(feeBpsBig) / 100).toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}%`
                      : '--'}
                  </div>
                </div>

                <div className='flex justify-end'>
                  <div className='flex flex-col items-center'>
                    <div className='text-text2/50 dark:text-text2Dark/50 text-[.14rem]'>
                      Global Cap
                    </div>
                    <div className='mt-[.1rem] text-color-text2 text-[.16rem]'>
                      {globalMaxFeeBps !== null ? `${Number(globalMaxFeeBps)} bps` : '--'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {created && (
              <div
                className={classNames(
                  fieldCard,
                  'mt-[.16rem] border border-[#FE8A3C]'
                )}
              >
                <div className='text-[.2rem] font-semibold text-color-text1'>
                  Referrence ID: {created.id.toString()} created
                </div>
                <div className='mt-[.06rem] text-[.16rem] text-color-text2'>
                  {(Number(created.feeBps) / 100).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                  % fee · cap {(Number(created.maxFeePls) / 1e18).toLocaleString()} PLS · payouts to
                  your chosen wallet
                </div>
              </div>
            )}
          </div>

          <div className='bg-color-bg2 border border-color-border1 rounded-[30px] p-[.24rem] max-sm:p-[.16rem]'>
            <div className='text-[.2rem] font-semibold text-color-text1'>Your codes</div>

            {loadingCodes ? (
              <div className='text-[.16rem] text-color-text2 mt-[.15rem]'>Loading...</div>
            ) : myCodes.length === 0 ? (
              <div className='text-[.16rem] text-color-text2 mt-[.15rem]'>
                {walletNotConnected
                  ? 'Connect your wallet to see your referral codes.'
                  : 'No referral codes yet — create one on the left.'}
              </div>
            ) : (
              <div className='mt-[.15rem] flex flex-col gap-[.16rem]'>
                {myCodes.filter((c) => c.id != null).map((code) => (
                  <div
                    key={code.id.toString()}
                    className={classNames(
                      fieldCard,
                      created?.id === code.id && 'border border-[#FE8A3C]'
                    )}
                  >
                    <div className='flex items-center justify-between gap-[.15rem]'>
                      <div className='text-[.2rem] font-semibold text-color-text1'>
                        Referrence ID: {code.id.toString()}
                      </div>
                      <div className='text-[.15rem] text-color-text2'>
                        {(Number(code.feeBps) / 100).toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                        % fee · cap {(Number(code.maxFeePls) / 1e18).toLocaleString()} PLS
                      </div>
                    </div>
                    <div className='mt-[.06rem] break-all text-[.14rem] text-color-text2'>
                      Payout: {code.wallet}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className='mt-[.15rem] text-center'>
              <a
                href={REFERRAL_OVERVIEW_URL}
                target='_blank'
                rel='noreferrer'
                className='text-color-link text-[.16rem] underline'
              >
                How to use your codes — Referral guide
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
