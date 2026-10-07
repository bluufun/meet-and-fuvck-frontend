"use client";

import { useState } from "react";
import { useWallet, WalletBalance } from "@/hooks/useWallet";
import { friendlyApiError } from "@/lib/apiMessages";

const COIN_RATE = 100;
const MIN_WITHDRAW = 5;

interface WithdrawModalProps {
  earnBalance: number;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function WithdrawModal({
  earnBalance,
  onClose,
  onSubmitted,
}: WithdrawModalProps) {
  const { submitWithdrawal } = useWallet();

  const [coins, setCoins] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const parsedCoins = parseInt(coins, 10);
  const validCoins =
    !isNaN(parsedCoins) &&
    parsedCoins >= MIN_WITHDRAW &&
    parsedCoins <= earnBalance;
  const canSubmit =
    validCoins && bankName.trim() && accountNumber.trim() && accountName.trim();

  async function handleSubmit() {
    if (!canSubmit) return;
    setError("");
    setSubmitting(true);
    try {
      await submitWithdrawal({
        coins: parsedCoins,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
      });
      setDone(true);
      setTimeout(() => onSubmitted(), 1400);
    } catch (err: any) {
      setError(friendlyApiError(err, "We couldn't submit your withdrawal right now."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className='fixed inset-0 z-[70] flex items-center justify-center px-4'
      style={{ background: "rgba(15,23,42,0.6)" }}>
      <div className='bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl max-h-[90vh] flex flex-col'>
        {done ? (
          <div className='p-8 text-center'>
            <div className='w-16 h-16 mx-auto bg-emerald-100 rounded-2xl flex items-center justify-center text-3xl mb-4'>
              ✅
            </div>
            <p className='font-bold text-[#0F172A] text-lg mb-1'>
              Withdrawal requested
            </p>
            <p className='text-sm text-[#64748B]'>
              We&apos;ll process your payout shortly. Track it under
              Transactions.
            </p>
          </div>
        ) : (
          <>
            <div className='bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#3B82F6] px-6 py-6 text-white relative shrink-0'>
              <button
                onClick={onClose}
                className='absolute top-4 right-4 text-white/80 hover:text-white text-xl'>
                ✕
              </button>
              <p className='text-xs uppercase tracking-widest text-white/70 font-semibold mb-1'>
                Withdraw
              </p>
              <p className='text-2xl font-black'>
                {earnBalance.toLocaleString()} coins available
              </p>
              <p className='text-sm text-white/70 mt-1'>
                From your earn balance only
              </p>
            </div>

            <div className='p-5 overflow-y-auto space-y-4'>
              <div>
                <label className='block text-xs font-semibold text-[#0F172A] mb-1.5'>
                  Coins to withdraw
                </label>
                <input
                  type='number'
                  inputMode='numeric'
                  value={coins}
                  onChange={(e) => setCoins(e.target.value)}
                  placeholder={`Min. ${MIN_WITHDRAW} coins`}
                  className='w-full border border-[#E2E8F0] rounded-xl placeholder:text-sm px-3.5 py-3 text-lg font-bold text-[#0F172A] focus:outline-none focus:border-[#3B82F6]'
                />
                {coins && !isNaN(parsedCoins) && (
                  <p className='text-xs text-[#94A3B8] mt-1'>
                    ≈ ₦{(parsedCoins * COIN_RATE).toLocaleString()}
                    {parsedCoins > earnBalance && (
                      <span className='text-red-500 ml-1.5'>
                        · exceeds available balance
                      </span>
                    )}
                  </p>
                )}
              </div>

              <div>
                <label className='block text-xs font-semibold text-[#0F172A] mb-1.5'>
                  Bank name
                </label>
                <input
                  type='text'
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder='e.g. Moniepoint MFB'
                  className='w-full border border-[#E2E8F0] rounded-xl px-3.5 py-3 text-base focus:outline-none focus:border-[#3B82F6]'
                />
              </div>

              <div>
                <label className='block text-xs font-semibold text-[#0F172A] mb-1.5'>
                  Account number
                </label>
                <input
                  type='text'
                  inputMode='numeric'
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder='0123456789'
                  className='w-full border border-[#E2E8F0] rounded-xl px-3.5 py-3 text-base focus:outline-none focus:border-[#3B82F6]'
                />
              </div>

              <div>
                <label className='block text-xs font-semibold text-[#0F172A] mb-1.5'>
                  Account name
                </label>
                <input
                  type='text'
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder='As it appears on your bank account'
                  className='w-full border border-[#E2E8F0] rounded-xl px-3.5 py-3 text-base focus:outline-none focus:border-[#3B82F6]'
                />
              </div>

              {error && (
                <p className='text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2'>
                  {error}
                </p>
              )}

              <p className='text-[10px] text-[#94A3B8] leading-relaxed'>
                Coins are held immediately. Once we send your payout, this
                withdrawal will be marked completed in your transaction history.
              </p>

              <button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className='w-full bg-[#1E3A8A] text-white font-semibold py-3.5 rounded-xl text-sm disabled:opacity-40 flex items-center justify-center gap-2'>
                {submitting ? (
                  <>
                    <span className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                    Submitting…
                  </>
                ) : (
                  "Submit withdrawal request"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
