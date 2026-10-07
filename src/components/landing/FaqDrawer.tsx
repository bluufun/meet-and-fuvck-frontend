"use client";

import { useState } from "react";
import Drawer from "@/components/ui/Drawer";

const FAQS = [
  {
    q: "What is Bluufun?",
    a: "Bluufun helps you find people nearby to hang out, chat, or share an activity with - no pressure, just good company.",
  },
  {
    q: "Is it free to use?",
    a: "Yes, browsing and matching is free. Some boosted profile features are paid depending on the plan you choose.",
  },
  {
    q: "How do I get verified?",
    a: "Open your dashboard, start FaceVerify, and complete the selfie check. We'll confirm it from the backend and notify you when it is done.",
  },
  {
    q: "Why do some features stay locked until verification is approved?",
    a: "Verification helps keep profiles trustworthy. Until approval is complete, some dashboard actions and profile features stay restricted.",
  },
  {
    q: "Can I change my profile later?",
    a: "Yes. You can update your profile details, bio, and media from the dashboard whenever you need to.",
  },
  {
    q: "How many photos and videos can I upload?",
    a: "That depends on your boost tier. Each tier has a photo and video quota, and the app shows your current allowance before you upload.",
  },
  {
    q: "What are the upload limits for file size?",
    a: "Images can be up to 5MB each and videos can be up to 20MB each.",
  },
  {
    q: "What is the wallet for?",
    a: "The wallet is where you manage coin balance, top-ups, and withdrawals from one place.",
  },
  {
    q: "How do I get help if something breaks?",
    a: "Use the contact page or reach out through the support routes in the app. For verification or upload issues, include the steps you took so we can diagnose it faster.",
  },
];

export default function FaqDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <Drawer open={open} onClose={onClose} title="Frequently asked questions">
      <div className="space-y-2">
        {FAQS.map((item, i) => {
          const isOpen = openIdx === i;
          return (
            <div
              key={item.q}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : i)}
                className="flex w-full items-center justify-between px-4 py-3 text-left">
                <span className="text-sm font-semibold text-slate-900">
                  {item.q}
                </span>
                <span
                  className={`text-slate-400 transition-transform ${isOpen ? "rotate-45" : ""}`}>
                  +
                </span>
              </button>
              {isOpen && (
                <p className="px-4 pb-4 text-sm leading-relaxed text-slate-600">
                  {item.a}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Drawer>
  );
}
