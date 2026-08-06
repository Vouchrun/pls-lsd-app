import classNames from 'classnames';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { decodeEventLog, isAddress, keccak256, parseEther, toHex } from 'viem';
import { waitForTransactionReceipt } from 'viem/actions';
import type { Address, Hex } from 'viem';
import { getReferralDepositContract, getReferralDepositContractAbi } from 'config/contract';
import { CustomButton } from 'components/common/CustomButton';
import { CustomNumberInput } from 'components/common/CustomNumberInput';

const REFERRAL_DEPOSIT_DEPLOYED_BLOCK = 27320028n;
const BPS_DENOMINATOR = 10_000n;
const WAD = 10n ** 18n;

const REFERRER_REGISTERED_TOPIC = keccak256(
  toHex('ReferrerRegistered(uint256,address,address,uint256,uint256)'),
);

interface OwnedCode {
  id: bigint;
  wallet: Address;
  feeBps: bigint;
  maxFeePls: bigint;
}

function referralUrl(id: bigint): string {
  return `https://app.vouch.run/PLS/?ref=${id.toString()}`;
}

export default function Referral() {
  const { address: account, isConnected, chainId } = useAccount();
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
  const [copied, setCopied] = useState(false);

  const contractAddress = getReferralDepositContract();
  const referralAbi = getReferralDepositContractAbi();

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
      const ownerTopic = `0x${account.toLowerCase().replace(/^0x/, '').padStart(64, '0')}` as Hex;
      const logs = await publicClient.getLogs({
        address: contractAddress as Address,
        fromBlock: REFERRAL_DEPOSIT_DEPLOYED_BLOCK,
        toBlock: 'latest',
        topics: [REFERRER_REGISTERED_TOPIC, null, ownerTopic] as [Hex, ...unknown[]],
      } as never);
      const codes = logs.map((log) => {
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
        return { id: args.id, wallet: args.wallet, feeBps: args.feeBps, maxFeePls: args.maxFeePls };
      });
      setMyCodes(codes);
    } catch {
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
    return trimmed.toLowerCase() === (account ?? '').toLowerCase() ? (account as Address) : (trimmed as Address);
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
    const bps = feeBpsBig > (globalMaxFeeBps ?? 500n) ? (globalMaxFeeBps ?? 500n) : feeBpsBig;
    const amount = 100_000n * WAD;
    const estVpls = (amount * WAD) / rate;
    const rawFee = (estVpls * bps) / BPS_DENOMINATOR;
    const cap = maxFeePlsBig > 0n ? (maxFeePlsBig * WAD) / rate : rawFee;
    const fee = rawFee > cap ? cap : rawFee;
    return (fee * rate) / WAD;
  }, [rate, feeBpsBig, maxFeePlsBig, globalMaxFeeBps]);

  const formValid = useMemo(() => {
    return (
      !!resolvedPayoutWallet &&
      feeBpsBig !== null &&
      feeBpsBig <= (globalMaxFeeBps ?? 500n) &&
      maxFeePlsBig >= 0n
    );
  }, [resolvedPayoutWallet, feeBpsBig, maxFeePlsBig, globalMaxFeeBps]);

  const handleCreate = useCallback(async () => {
    if (!publicClient || !resolvedPayoutWallet || feeBpsBig === null || creating) return;
    if (!contractAvailable) {
      setTxError('ReferralDeposit is not available on this network.');
      return;
    }
    setTxError(null);
    setCopied(false);
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
        setCreated(code);
        setMyCodes((prev) => [code, ...prev.filter((c) => c.id !== code.id)]);
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
    contractAvailable,
    contractAddress,
    referralAbi,
    writeContractAsync,
  ]);

  const handleCopy = useCallback(async (id: bigint) => {
    try {
      await navigator.clipboard.writeText(referralUrl(id));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, []);

  const onWrongNetwork = !!chainId && chainId !== 369;

  return (
    <div className='mt-[37px] px-[30px] max-md:px-[15px] pt-[40px]'>
      <div className='max-w-[1360px] m-auto'>
        <div className='bg-color-bg2 border-color-border1 border rounded-[30px] p-[40px] max-sm:p-[25px]'>
          <h1 className='text-[.32rem] font-semibold text-color-text1'>Referral Link</h1>
          <p className='mt-[10px] text-[.18rem] text-color-text1/80 dark:text-color-text1Dark/80'>
            Create a referral code to earn vPLS referral fees when your links deposit PLS into Vouch
            liquid staking. The fee is taken from the vPLS minted — nothing extra for the depositor.
          </p>

          {!isConnected && (
            <div className='mt-[20px] text-[.18rem] text-color-text1/70'>
              Connect your wallet to create a referral link.
            </div>
          )}

          {onWrongNetwork && (
            <div className='mt-[20px] p-[15px] rounded-[15px] bg-[#ff8a3b]/15 border border-[#ff8a3b] text-[.18rem] text-color-text1'>
              Switch to PulseChain to use referral links.
            </div>
          )}

          {!contractAvailable && (
            <div className='mt-[20px] p-[15px] rounded-[15px] bg-[#ff8a3b]/15 border border-[#ff8a3b] text-[.18rem] text-color-text1'>
              ReferralDeposit is not deployed on this network.
            </div>
          )}

          <div className='mt-[30px] grid grid-cols-1 lg:grid-cols-2 gap-[30px]'>
            <div>
              <div className='text-[.2rem] mb-[10px] text-color-text1'>Payout wallet</div>
              <input
                className='w-full bg-color-bg2 border-none outline-none py-[10px] px-[20px] rounded-[35px] h-[.42rem] text-color-text1 placeholder:text-text2/50 dark:placeholder:text-text2Dark/50'
                style={{ fontSize: '.2rem' }}
                value={payoutWallet}
                placeholder={account ?? '0x...'}
                onChange={(e) => setPayoutWallet(e.target.value)}
              />
              {payoutWallet.trim() !== '' && !resolvedPayoutWallet && (
                <div className='mt-[8px] text-[.15rem] text-[#c0392b]'>Invalid wallet address.</div>
              )}

              <div className='text-[.2rem] mt-[25px] mb-[10px] text-color-text1'>Fee rate (bps)</div>
              <CustomNumberInput value={feeBps} handleValueChange={setFeeBps} fontSize='.2rem' />
              <div className='mt-[8px] text-[.15rem] text-color-text1/60 dark:text-color-text1Dark/60'>
                1% = 100 bps. Global maximum is {globalMaxFeeBps !== null ? Number(globalMaxFeeBps) : 300} bps.
              </div>
              {feeBpsBig !== null && feeBpsBig > (globalMaxFeeBps ?? 500n) && (
                <div className='mt-[8px] text-[.15rem] text-[#c0392b]'>
                  Fee rate exceeds the global maximum.
                </div>
              )}

              <div className='text-[.2rem] mt-[25px] mb-[10px] text-color-text1'>Max fee per deposit (PLS)</div>
              <CustomNumberInput value={maxFeePls} handleValueChange={setMaxFeePls} fontSize='.2rem' />
              <div className='mt-[8px] text-[.15rem] text-color-text1/60 dark:text-color-text1Dark/60'>
                Absolute cap in PLS value. 0 disables the fee entirely (promo links).
              </div>

              {feePreviewPls !== null && (
                <div className='mt-[15px] text-[.17rem] text-color-text1/80 dark:text-color-text1Dark/80'>
                  On a 100,000 PLS deposit you would earn ~{' '}
                  {(Number(feePreviewPls) / 1e18).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}{' '}
                  PLS worth of vPLS.
                </div>
              )}

              <CustomButton
                type='primary'
                mt='.3rem'
                disabled={!formValid || creating || !contractAvailable || onWrongNetwork}
                loading={creating}
                onClick={handleCreate}
              >
                {creating ? 'Creating...' : 'Create Referral Link'}
              </CustomButton>

              {txError && (
                <div className='mt-[15px] text-[.16rem] text-[#c0392b]'>{txError}</div>
              )}

              {created && (
                <div className='mt-[25px] p-[20px] rounded-[20px] bg-color-bg1 dark:bg-color-bg1Dark border border-[#FE8A3C]'>
                  <div className='text-[.2rem] font-semibold text-color-text1'>
                    Your referral code: {created.id.toString()}
                  </div>
                  <div className='mt-[8px] text-[.16rem] break-all text-color-text1/80 dark:text-color-text1Dark/80'>
                    {referralUrl(created.id)}
                  </div>
                  <CustomButton
                    type='secondary'
                    mt='.15rem'
                    onClick={() => handleCopy(created.id)}
                  >
                    {copied ? 'Copied!' : 'Copy Link'}
                  </CustomButton>
                </div>
              )}
            </div>

            <div>
              <div className='text-[.2rem] mb-[10px] text-color-text1'>Your codes</div>
              {loadingCodes ? (
                <div className='text-[.16rem] text-color-text1/60'>Loading...</div>
              ) : myCodes.length === 0 ? (
                <div className='text-[.16rem] text-color-text1/60'>
                  {isConnected
                    ? 'No referral codes yet — create one to get started.'
                    : 'Connect your wallet to see your referral codes.'}
                </div>
              ) : (
                <div className='flex flex-col gap-[15px]'>
                  {myCodes.map((code) => (
                    <div
                      key={code.id.toString()}
                      className={classNames(
                        'p-[20px] rounded-[20px] bg-color-bg1 dark:bg-color-bg1Dark border',
                        created?.id === code.id ? 'border-[#FE8A3C]' : 'border-color-border1'
                      )}
                    >
                      <div className='flex items-center justify-between gap-[15px]'>
                        <div className='text-[.2rem] font-semibold text-color-text1'>
                          Code #{code.id.toString()}
                        </div>
                        <div className='text-[.16rem] text-color-text1/70'>
                          {(Number(code.feeBps) / 100).toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                          % fee · cap {(Number(code.maxFeePls) / 1e18).toLocaleString()} PLS
                        </div>
                      </div>
                      <div className='mt-[8px] text-[.15rem] break-all text-color-text1/60 dark:text-color-text1Dark/60'>
                        Payout: {code.wallet}
                      </div>
                      <CustomButton type='small' mt='.15rem' onClick={() => handleCopy(code.id)}>
                        Copy Link
                      </CustomButton>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
