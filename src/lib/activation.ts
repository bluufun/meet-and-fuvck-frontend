"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function activateAccount(token?: string | null) {
  const res = await fetch(`${API}/api/activation/pay`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token || localStorage.getItem("bf_token")}`,
    },
  });

  const data = await res.json().catch(() => ({}));
  return { res, data };
}
