// components/dashboard/SignupBonusModal.tsx
"use client";
import { Coins, Sparkles } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Props {
  onClose: () => void;
}

export default function SignupBonusModal({ onClose }: Props) {
  async function dismiss() {
    try {
      await fetch(`${API}/api/users/me/signup-bonus-seen`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("bf_token")}`,
        },
      });
    } catch {}
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-[#0F172A] mb-1">Welcome bonus! 🎉</h2>
        <p className="text-sm text-[#64748B] mb-4">
          You've been credited <span className="font-semibold text-[#1E3A8A]">50 free coins</span> —
          enough to activate your account right away after your account have been verified.
        </p>
        <div className="bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#3B82F6] rounded-2xl px-6 py-4 mb-5 text-white">
          <p className="text-3xl font-black flex items-center justify-center gap-1.5">
            <Coins className="w-6 h-6" /> +50
          </p>
        </div>
        <button
          onClick={dismiss}
          className="w-full bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] text-white font-semibold text-sm py-3.5 rounded-2xl active:scale-95 transition-transform"
        >
          Got it, thanks!
        </button>
      </div>
    </div>
  );
}
