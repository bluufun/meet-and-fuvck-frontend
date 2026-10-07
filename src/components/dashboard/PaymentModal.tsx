"use client";

import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface PaymentModalProps {
  onClose: () => void;
  onSubmitted: () => void;
}

const COINS = 20;
const RATE = 100;
const AMOUNT = COINS * RATE; // 2000

export default function PaymentModal({ onClose, onSubmitted }: PaymentModalProps) {
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const accountNumber = "1234567899";

  function copyAccount() {
    navigator.clipboard.writeText(accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handlePaid() {
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/activation/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("bf_token")}`,
        },
      });
      if (!res.ok) throw new Error("Failed");
      setDone(true);
      setTimeout(() => {
        onSubmitted();
      }, 1400);
    } catch {
      alert("Could not submit payment confirmation. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" style={{ background: "rgba(15,23,42,0.55)" }}>
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
        {done ? (
          <div className="p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-bold text-[#0F172A] text-lg mb-1">Thanks!</h3>
            <p className="text-sm text-[#64748B]">We've received your confirmation — your activation is now pending review.</p>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] px-6 py-7 text-white relative">
              <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white text-xl leading-none">✕</button>
              <p className="text-xs uppercase tracking-widest text-white/70 font-semibold mb-1">Account Activation</p>
              <p className="text-3xl font-bold">₦{AMOUNT.toLocaleString()}</p>
              <p className="text-sm text-white/80 mt-1">{COINS} coins · ₦{RATE} per coin</p>
            </div>

            <div className="p-6">
              <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide mb-3">Transfer to</p>
              <div className="bg-[#F8FAFF] border border-[#E2E8F0] rounded-2xl p-4 mb-5 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#94A3B8]">Bank</span>
                  <span className="text-sm font-semibold text-[#0F172A]">OPay</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#94A3B8]">Account Number</span>
                  <button onClick={copyAccount} className="flex items-center gap-1.5 text-sm font-semibold text-[#1E3A8A]">
                    {accountNumber}
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#94A3B8]">Account Name</span>
                  <span className="text-sm font-semibold text-[#0F172A]">Bluufun Limited</span>
                </div>
                {copied && <p className="text-[10px] text-emerald-600 font-medium text-right">Copied!</p>}
              </div>

              <p className="text-xs text-[#94A3B8] mb-5 leading-relaxed">
                Make a bank transfer of <strong className="text-[#334155]">₦{AMOUNT.toLocaleString()}</strong> to the account above, then tap "I have paid" — our team will confirm and activate your account shortly.
              </p>

              <button
                onClick={handlePaid}
                disabled={submitting}
                className="w-full bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-semibold py-3.5 rounded-xl text-sm disabled:opacity-50 transition"
              >
                {submitting ? "Submitting…" : "I have paid"}
              </button>
              <button onClick={onClose} className="w-full text-center text-xs text-[#94A3B8] mt-3">
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}