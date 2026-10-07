"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { Coins, Copy, Landmark, Loader2, RefreshCw } from "lucide-react";
import { useWallet, WalletTransaction } from "@/hooks/useWallet";
import WithdrawModal from "./WithdrawModal";
import { friendlyApiError, friendlyApiMessage } from "@/lib/apiMessages";

const COIN_RATE = 100;
const MIN_COINS = 5;

type TopupStep = "input" | "payment" | null;

interface WalletModalProps {
  open: boolean;
  onClose: () => void;
  openTopup?: boolean;
  initialTopupCoins?: number;
}

export default function WalletModal({
  open,
  onClose,
  openTopup = false,
  initialTopupCoins,
}: WalletModalProps) {
  const {
    balance,
    transactions,
    txPages,
    loading,
    txLoading,
    reservedAccount,
    reservedAccountState,
    fetchWallet,
    fetchReservedAccount,
    fetchTransactions,
    initiateTopup,
    generateReservedAccount,
    walletSignal,
  } = useWallet();

  const [topupStep, setTopupStep] = useState<TopupStep>(null);
  const [coinInput, setCoinInput] = useState("");
  const [topupData, setTopupData] = useState<{
    reference: string;
    coins: number;
    nairaAmount: number;
    expiresAt: string;
  } | null>(null);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [topupError, setTopupError] = useState("");
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [checkCreditLoading, setCheckCreditLoading] = useState(false);
  const [checkCreditMessage, setCheckCreditMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [txPage, setTxPage] = useState(1);
  const [lastBalance, setLastBalance] = useState(0);

  const resetTopup = useCallback(() => {
    setTopupStep(null);
    setCoinInput("");
    setTopupData(null);
    setTopupError("");
    setGenerateError("");
    setCheckCreditMessage("");
  }, []);

  useEffect(() => {
    if (!open) {
      const resetTimer = window.setTimeout(resetTopup, 0);
      return () => window.clearTimeout(resetTimer);
    }
    let topupTimer: number | undefined;
    if (openTopup) {
      topupTimer = window.setTimeout(() => {
        setTopupStep("input");
        if (initialTopupCoins != null) setCoinInput(String(initialTopupCoins));
      }, 0);
    }
    if (openTopup) {
      // Initialization is deferred above so this effect does not synchronously
      // update component state while it is running.
    }
    fetchWallet().then((data) => {
      if (data?.wallet?.totalBalance != null) {
        setLastBalance(data.wallet.totalBalance);
      }
    });
    fetchReservedAccount();
    fetchTransactions(1);
    return () => {
      if (topupTimer !== undefined) window.clearTimeout(topupTimer);
    };
  }, [
    open,
    openTopup,
    initialTopupCoins,
    resetTopup,
    fetchWallet,
    fetchReservedAccount,
    fetchTransactions,
  ]);

  useEffect(() => {
    if (!open) return;
    fetchTransactions(txPage);
  }, [txPage, open, fetchTransactions]);

  useEffect(() => {
    if (!open) return;
    if (walletSignal?.type === "wallet_credited") {
      const signalTimer = window.setTimeout(() => {
        if (walletSignal.wallet?.totalBalance != null) {
          setLastBalance(walletSignal.wallet.totalBalance);
        }
        setCheckCreditMessage(walletSignal.message);
        setTxPage(1);
      }, 0);
      fetchWallet();
      fetchTransactions(1);
      fetchReservedAccount();

      return () => window.clearTimeout(signalTimer);
    }
  }, [
    open,
    walletSignal,
    fetchWallet,
    fetchTransactions,
    fetchReservedAccount,
  ]);

  async function handleInitiateTopup() {
    setTopupError("");
    const coins = parseInt(coinInput, 10);

    if (!coins || Number.isNaN(coins) || coins < MIN_COINS) {
      setTopupError(
        `Minimum is ${MIN_COINS} coins (₦${MIN_COINS * COIN_RATE})`,
      );
      return;
    }

    try {
      const data = await initiateTopup(coins);
      setTopupData(data);
      setTopupStep("payment");
      await fetchReservedAccount();
    } catch (error: unknown) {
      setTopupError(
        friendlyApiError(error, "We couldn't start the top-up right now."),
      );
    }
  }

  async function handleGenerateAccount() {
    setGenerateLoading(true);
    setGenerateError("");
    try {
      await generateReservedAccount();
      await fetchReservedAccount();
    } catch (error: unknown) {
      setGenerateError(
        friendlyApiError(error, "We couldn't generate that account right now."),
      );
    } finally {
      setGenerateLoading(false);
    }
  }

  async function handleCheckCredit() {
    setCheckCreditLoading(true);
    setCheckCreditMessage("");
    try {
      const previousBalance = lastBalance;
      const data = await fetchWallet();
      await fetchTransactions(1);
      await fetchReservedAccount();

      const nextBalance = data?.wallet?.totalBalance ?? 0;
      if (nextBalance > previousBalance) {
        setCheckCreditMessage(
          `Credit updated. New wallet balance is ${nextBalance.toLocaleString()} coins.`,
        );
      } else {
        setCheckCreditMessage("No new credit detected yet. Try again shortly.");
      }
      setLastBalance(nextBalance);
    } catch (error: unknown) {
      setCheckCreditMessage(
        friendlyApiError(error, "We couldn't check your credit right now."),
      );
    } finally {
      setCheckCreditLoading(false);
    }
  }

  async function handleCopy(value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function handleWithdrawSubmitted() {
    setWithdrawOpen(false);
    fetchWallet();
    fetchTransactions(1);
    setTxPage(1);
  }

  if (!open) return null;

  const activeAccount =
    reservedAccountState?.status === "active"
      ? reservedAccountState.reservedAccount
      : null;
  const canProvisionReservedAccount =
    reservedAccountState?.canGenerate ?? false;
  const accountStateLabel =
    reservedAccountState?.status === "active"
      ? "Account ready"
      : reservedAccountState?.status === "locked"
        ? "Account locked"
        : reservedAccountState?.status === "failed"
          ? "Account generation failed"
          : reservedAccountState?.status === "pending"
            ? "Account pending"
            : "Account not created";
  const reservedAccountError =
    reservedAccountState?.reason || reservedAccount?.lastError
      ? friendlyApiMessage(
          reservedAccountState?.reason || reservedAccount?.lastError || "",
          "We couldn't generate your dedicated account right now.",
        )
      : "";
  const coins = parseInt(coinInput, 10);
  const nairaEquivalent =
    !Number.isNaN(coins) && coins >= 1 ? coins * COIN_RATE : 0;

  const content = (
    <div className='fixed inset-0 z-50 flex flex-col bg-[#0F172A]/80 backdrop-blur-sm'>
      <div
        className='flex-1 overflow-y-auto'
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            resetTopup();
            onClose();
          }
        }}>
        <div className='min-h-full flex items-end justify-center'>
          <div className='w-full max-w-lg bg-[#F8FAFF] rounded-t-3xl shadow-2xl pb-10'>
            <div className='sticky top-0 z-10 bg-[#F8FAFF] rounded-t-3xl px-5 pt-4 pb-3 border-b border-[#E2E8F0]'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  {topupStep && (
                    <button
                      onClick={resetTopup}
                      className='text-[#64748B] hover:text-[#0F172A] transition p-1 -ml-1'>
                      <svg
                        className='w-5 h-5'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                        strokeWidth={2}>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          d='M15 19l-7-7 7-7'
                        />
                      </svg>
                    </button>
                  )}
                  <h2 className='text-base font-bold text-[#0F172A]'>
                    {!topupStep && "Coin Wallet"}
                    {topupStep === "input" && "Top Up Coins"}
                    {topupStep === "payment" && "Make Payment"}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    resetTopup();
                    onClose();
                  }}
                  className='w-8 h-8 flex items-center justify-center rounded-xl bg-[#F1F5F9] text-[#64748B]'>
                  ×
                </button>
              </div>
            </div>

            <div className='px-5 pt-4 pb-2'>
              {!topupStep && (
                <>
                  <div className='relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#3B82F6] p-5 mb-4 shadow-xl shadow-[#1E3A8A]/20'>
                    <div className='absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5' />
                    <div className='absolute right-8 bottom-0 w-20 h-20 rounded-full bg-white/5' />
                    <div className='relative'>
                      <p className='text-white/60 text-xs font-medium mb-1'>
                        Total Coins
                      </p>
                      {loading ? (
                        <div className='h-9 w-24 bg-white/10 rounded-xl animate-pulse mb-3' />
                      ) : (
                        <p className='text-white text-4xl font-black mb-1'>
                          <span className='flex items-center gap-1'>
                            <Coins className='w-5.5 h-5.5' />
                            {(balance?.totalBalance ?? 0).toLocaleString()}
                          </span>
                        </p>
                      )}
                      <div className='flex items-center gap-1.5'>
                        <p className='text-white/60 text-sm'>
                          ≈ ₦
                          {(
                            (balance?.totalBalance ?? 0) * COIN_RATE
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='flex mb-5 gap-1'>
                    <button
                      onClick={() => setTopupStep("input")}
                      className='flex-1 bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] text-white font-semibold text-sm py-3 rounded-xl shadow-md shadow-[#1E3A8A]/20 active:scale-95 transition-transform flex items-center justify-center gap-1.5'>
                      <span className='text-base'>+</span> Top Up
                    </button>

                    <button
                      onClick={() => setWithdrawOpen(true)}
                      className='flex-1  bg-white/5 border text-[#1E3A8A] font-semibold text-sm py-3 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1.5'>
                      <span className='text-base'>↓</span> Withdraw
                    </button>
                  </div>

                  <div className='grid grid-cols-3 gap-2 mb-4'>
                    <div className='rounded-2xl bg-white p-3 ring-1 ring-slate-200'>
                      <p className='text-[11px] uppercase tracking-[0.18em] text-slate-400'>
                        Paid
                      </p>
                      <p className='mt-1 text-lg font-bold text-slate-900'>
                        {(balance?.topupBalance ?? 0).toLocaleString()}
                      </p>
                    </div>
                    <div className='rounded-2xl bg-white p-3 ring-1 ring-slate-200'>
                      <p className='text-[11px] uppercase tracking-[0.18em] text-slate-400'>
                        Earned
                      </p>
                      <p className='mt-1 text-lg font-bold text-slate-900'>
                        {(balance?.earnBalance ?? 0).toLocaleString()}
                      </p>
                    </div>
                    <div className='rounded-2xl bg-white p-3 ring-1 ring-slate-200'>
                      <p className='text-[11px] uppercase tracking-[0.18em] text-slate-400'>
                        Bonus
                      </p>
                      <p className='mt-1 text-lg font-bold text-slate-900'>
                        {(balance?.bonusBalance ?? 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className='mb-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs leading-6 text-sky-800'>
                    Paid and earned coins can be used for boosts and contact
                    unlocks. Bonus coins are reserved for activation only.
                  </div>

                  <p className='text-sm font-bold text-[#0F172A] mb-3'>
                    Transactions
                  </p>

                  {txLoading ? (
                    <div className='space-y-3'>
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className='h-14 bg-white rounded-2xl animate-pulse'
                        />
                      ))}
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className='text-center py-10'>
                      <p className='text-3xl mb-2'>🪙</p>
                      <p className='text-sm text-[#94A3B8]'>
                        No transactions yet
                      </p>
                    </div>
                  ) : (
                    <div className='space-y-2'>
                      {transactions.map((tx) => (
                        <TxRow key={tx._id} tx={tx} />
                      ))}
                    </div>
                  )}

                  {txPages > 1 && (
                    <div className='flex items-center justify-between mt-4 pt-3 border-t border-[#E2E8F0]'>
                      <button
                        disabled={txPage <= 1}
                        onClick={() => setTxPage((p) => p - 1)}
                        className='text-xs text-[#1E3A8A] font-medium disabled:opacity-30 px-3 py-1.5 rounded-xl bg-white shadow-sm'>
                        Prev
                      </button>
                      <span className='text-xs text-[#94A3B8]'>
                        Page {txPage} of {txPages}
                      </span>
                      <button
                        disabled={txPage >= txPages}
                        onClick={() => setTxPage((p) => p + 1)}
                        className='text-xs text-[#1E3A8A] font-medium disabled:opacity-30 px-3 py-1.5 rounded-xl bg-white shadow-sm'>
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}

              {topupStep === "input" && (
                <div>
                  <div className='bg-white rounded-2xl shadow-xs border border-gray-100 p-4 mb-4'>
                    <p className='text-xs text-[#94A3B8] mb-1'>Rate</p>
                    <p className='text-sm font-semibold text-[#0F172A]'>
                      <span className='flex items-center gap-1'>
                        <Coins className='w-3.5 h-3.5' /> 1 coin = ₦100
                      </span>
                    </p>
                  </div>

                  <div className='mb-4'>
                    <label className='block text-sm font-semibold text-[#0F172A] mb-2'>
                      How many coins?
                    </label>
                    <input
                      type='number'
                      inputMode='numeric'
                      min={MIN_COINS}
                      value={coinInput}
                      onChange={(e) => {
                        setCoinInput(e.target.value);
                        setTopupError("");
                      }}
                      placeholder={`how many coins?`}
                      className='w-full border border-[#E2E8F0] placeholder:text-sm rounded-2xl px-4 py-3.5 text-2xl font-black placeholder:font-medium text-[#0F172A] focus:outline-none focus:border-[#3B82F6] bg-white'
                    />
                  </div>

                  {coins >= 1 && !Number.isNaN(coins) && (
                    <div className='bg-gradient-to-br from-[#EFF6FF] to-[#F0FDF4] rounded-2xl shadow-sm p-4 mb-4 space-y-2'>
                      <div className='flex justify-between text-sm'>
                        <span className='text-[#64748B]'>Coins</span>
                        <span className='font-semibold flex items-center gap-1'>
                          <Coins className='w-3.5 h-3.5' />{" "}
                          {coins.toLocaleString()}
                        </span>
                      </div>
                      <div className='flex justify-between text-sm'>
                        <span className='text-[#64748B]'>Rate</span>
                        <span>₦100 / coin</span>
                      </div>
                      <div className='border-t border-[#BFDBFE] pt-2 flex justify-between'>
                        <span className='text-sm font-bold text-[#0F172A]'>
                          Total to pay
                        </span>
                        <span className='text-lg font-bold text-[#1E3A8A]'>
                          ₦{nairaEquivalent.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {topupError && (
                    <p className='text-xs text-red-500 mb-3 bg-red-50 rounded-xl px-3 py-2'>
                      {topupError}
                    </p>
                  )}

                  <button
                    onClick={handleInitiateTopup}
                    disabled={!coins || coins < MIN_COINS}
                    className='w-full bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] text-white font-semibold text-sm py-3.5 rounded-2xl disabled:opacity-40 active:scale-95 transition-transform'>
                    Proceed to Pay →
                  </button>
                </div>
              )}

              {topupStep === "payment" && topupData && (
                <div>
                  <div className='bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#3B82F6] rounded-2xl p-4 mb-4 text-white'>
                    <p className='text-white/60 text-xs mb-1'>Topping up</p>
                    <p className='text-2xl font-black'>
                      <span className='flex items-center gap-1'>
                        <Coins className='w-3.5 h-3.5' />{" "}
                        {topupData.coins.toLocaleString()} coins
                      </span>
                    </p>
                    <p className='text-white/70 text-sm'>
                      ₦{topupData.nairaAmount.toLocaleString()}
                    </p>
                  </div>

                  <div className='bg-amber-50 rounded-2xl shadow-sm p-3 mb-4 flex gap-2'>
                    <span className='text-amber-500 shrink-0'>⚠</span>
                    <div>
                      <p className='text-xs font-bold text-amber-800'>
                        Your transfer details
                      </p>
                      <p className='text-xs text-amber-700 mt-0.5 leading-relaxed'>
                        After generating the account, transfer the amount above
                        to your dedicated bank details below.
                      </p>
                    </div>
                  </div>

                  <div className='bg-white rounded-2xl shadow-sm p-4 mb-2'>
                    <div className='flex items-center gap-2 mb-3'>
                      <div className='w-8 h-8 bg-[#1E3A8A] rounded-xl flex items-center justify-center'>
                        <Landmark className='w-4 h-4 text-white' />
                      </div>
                      <div>
                        <p className='text-sm font-bold text-[#0F172A]'>
                          Dedicated Account
                        </p>
                        <p className='text-[10px] text-[#94A3B8]'>
                          Your dedicated transfer account
                        </p>
                      </div>
                    </div>

                    {!activeAccount ? (
                      <div className='rounded-2xl bg-[#F8FAFF] p-4'>
                        <p className='text-sm font-semibold text-[#0F172A] mb-1'>
                          {accountStateLabel}
                        </p>
                        <p className='text-xs text-[#64748B] leading-relaxed'>
                          {reservedAccountState?.status === "failed"
                            ? reservedAccountError ||
                              "We could not create your account yet. Try again."
                            : reservedAccountState?.status === "locked"
                              ? reservedAccountState.reason ||
                                "Your Billstack account will be created automatically after verification is approved."
                              : canProvisionReservedAccount
                                ? "Tap Generate Account to create your dedicated Billstack bank details."
                                : "Your Billstack account will be created automatically after verification is approved."}
                        </p>
                        {generateError && (
                          <p className='text-xs text-red-500 mt-3 bg-red-50 rounded-xl px-3 py-2'>
                            {generateError}
                          </p>
                        )}
                        {canProvisionReservedAccount ? (
                          <button
                            onClick={handleGenerateAccount}
                            disabled={generateLoading}
                            className='mt-4 w-full bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] text-white font-semibold text-sm py-3.5 rounded-2xl disabled:opacity-40 active:scale-95 transition-transform flex items-center justify-center gap-2'>
                            {generateLoading ? (
                              <Loader2 className='w-4 h-4 animate-spin' />
                            ) : null}
                            {generateLoading
                              ? "Generating..."
                              : "Generate Account"}
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <div className='space-y-2.5'>
                        <AccountRow
                          label='Account Name'
                          value={activeAccount.accountName}
                          onAction={() => handleCopy(activeAccount.accountName)}
                        />
                        <AccountRow
                          label='Account Number'
                          value={activeAccount.accountNumber}
                          actionLabel={copied ? "Copied" : "Copy"}
                          onAction={() =>
                            handleCopy(activeAccount.accountNumber)
                          }
                        />
                        <AccountRow
                          label='Bank'
                          value={activeAccount.bankName}
                          onAction={() => handleCopy(activeAccount.bankName)}
                        />

                        <div className='mt-3 flex items-center gap-1.5 bg-emerald-50 rounded-xl px-3 py-2'>
                          <span className='text-emerald-500 text-sm'>⚡</span>
                          <p className='text-xs font-medium text-emerald-700'>
                            Your credit will be added to your wallet
                            automatically.
                          </p>
                        </div>

                        <button
                          onClick={handleCheckCredit}
                          disabled={checkCreditLoading}
                          className='mt-3 w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 text-sm font-semibold text-[#1E3A8A] disabled:opacity-50'>
                          {checkCreditLoading ? (
                            <Loader2 className='w-4 h-4 animate-spin' />
                          ) : (
                            <RefreshCw className='w-4 h-4' />
                          )}
                          Check Credit
                        </button>
                        {checkCreditMessage && (
                          <p className='mt-2 text-xs text-[#64748B]'>
                            {checkCreditMessage}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {withdrawOpen && (
        <WithdrawModal
          earnBalance={balance?.earnBalance ?? 0}
          onClose={() => setWithdrawOpen(false)}
          onSubmitted={handleWithdrawSubmitted}
        />
      )}
    </div>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}

function AccountRow({
  label,
  value,
  onAction,
  actionLabel,
}: {
  label: string;
  value: string;
  onAction?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className='flex justify-between items-start gap-2'>
      <span className='text-xs text-[#94A3B8] shrink-0'>{label}</span>
      <div className='flex items-center gap-2 min-w-0'>
        <span className='text-xs font-semibold text-right text-[#0F172A] break-all'>
          {value}
        </span>
        {onAction && actionLabel && (
          <button
            onClick={onAction}
            className='shrink-0 inline-flex items-center gap-1 text-[10px] bg-[#EFF6FF] text-[#1E3A8A] font-semibold px-2.5 py-1 rounded-xl'>
            <Copy className='w-3 h-3' />
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

const TX_META: Record<
  string,
  { label: string; icon: string; credit: boolean; showStatus?: boolean }
> = {
  topup: { label: "Top Up", icon: "⬆", credit: true },
  bonus: { label: "Bonus", icon: "🎁", credit: true },
  earn: { label: "Earned", icon: "🎁", credit: true },
  spend: { label: "Contact Unlock", icon: "🔓", credit: false },
  withdrawal: {
    label: "Withdrawal",
    icon: "🏦",
    credit: false,
    showStatus: true,
  },
  activation: { label: "Activation", icon: "⚡", credit: false },
  boost: { label: "Boost", icon: "🚀", credit: false },
  refund: { label: "Refund", icon: "↩", credit: true },
  admin_credit: { label: "Admin Credit", icon: "🏅", credit: true },
};

function TxRow({ tx }: { tx: WalletTransaction }) {
  const meta = TX_META[tx.type] ?? { label: tx.type, icon: "•", credit: true };
  const date = new Date(tx.createdAt);

  return (
    <div className='bg-white rounded-2xl shadow-sm px-4 py-3 flex items-center gap-3'>
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 ${meta.credit ? "bg-emerald-50" : "bg-[#FFF7ED]"}`}>
        {meta.icon}
      </div>
      <div className='flex-1 min-w-0'>
        <div className='flex items-center justify-between gap-2'>
          <p className='text-sm font-semibold text-[#0F172A] truncate'>
            {meta.label}
          </p>
          <p
            className={`text-sm font-bold shrink-0 ${meta.credit ? "text-emerald-600" : "text-red-500"}`}>
            <span className='flex items-center gap-1'>
              {meta.credit ? "+" : "-"} <Coins className='w-3.5 h-3.5' />{" "}
              {tx.coins.toLocaleString()}
            </span>
          </p>
        </div>
        <div className='flex items-center justify-between gap-2 mt-0.5'>
          <p className='text-[10px] text-[#94A3B8] truncate'>
            {tx.description || (tx.reference ? `Ref: ${tx.reference}` : "")}
          </p>
          <div className='flex items-center gap-1.5 shrink-0'>
            {meta.showStatus && (
              <span
                className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                  tx.status === "completed"
                    ? "bg-emerald-100 text-emerald-700"
                    : tx.status === "pending"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-600"
                }`}>
                {tx.status}
              </span>
            )}
            <span className='text-[10px] text-[#CBD5E1]'>
              {date.toLocaleDateString("en-NG", {
                day: "numeric",
                month: "short",
              })}{" "}
              {date.toLocaleTimeString("en-NG", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
