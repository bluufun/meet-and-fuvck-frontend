export type PricingConfig = {
  activationCoins: number;
  activationFeeEnabled: boolean;
  unlockCoins: number;
  referralActivationPercent: number;
  referralBoostPercent: number;
  coinRateNgn: number;
  boostPlans: {
    fresher: number;
    elite: number;
    elite_plus: number;
  };
};

export const DEFAULT_PRICING: PricingConfig = {
  activationCoins: 50,
  activationFeeEnabled: true,
  unlockCoins: 5,
  referralActivationPercent: 0.5,
  referralBoostPercent: 0.2,
  coinRateNgn: 100,
  boostPlans: {
    fresher: 50,
    elite: 100,
    elite_plus: 200,
  },
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function fetchPricingConfig(): Promise<PricingConfig> {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("bf_token") : null;
    const [activationRes, boostRes] = await Promise.all([
      fetch(`${API}/api/activation/info`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: "no-store",
      }),
      fetch(`${API}/api/boost/info`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: "no-store",
      }),
    ]);

    if (!activationRes.ok) return DEFAULT_PRICING;

    const activationData = await activationRes.json();
    const activationCoins = Number(activationData?.coins);
    const activationFeeEnabled = Boolean(activationData?.activationFeeEnabled ?? true);
    const coinRateNgn = Number(activationData?.coinRateNgn);
    const boostData = boostRes.ok ? await boostRes.json() : null;
    const plans = boostData?.plans || [];
    const fresher = plans.find((p: any) => p.tier === "fresher")?.coins;
    const elite = plans.find((p: any) => p.tier === "elite")?.coins;
    const elitePlus = plans.find((p: any) => p.tier === "elite_plus")?.coins;

    return {
      activationCoins: Number.isFinite(activationCoins) ? activationCoins : DEFAULT_PRICING.activationCoins,
      activationFeeEnabled,
      unlockCoins: DEFAULT_PRICING.unlockCoins,
      referralActivationPercent: DEFAULT_PRICING.referralActivationPercent,
      referralBoostPercent: DEFAULT_PRICING.referralBoostPercent,
      coinRateNgn: Number.isFinite(coinRateNgn) ? coinRateNgn : DEFAULT_PRICING.coinRateNgn,
      boostPlans: {
        fresher: Number.isFinite(fresher) ? Number(fresher) : DEFAULT_PRICING.boostPlans.fresher,
        elite: Number.isFinite(elite) ? Number(elite) : DEFAULT_PRICING.boostPlans.elite,
        elite_plus: Number.isFinite(elitePlus) ? Number(elitePlus) : DEFAULT_PRICING.boostPlans.elite_plus,
      },
    };
  } catch {
    return DEFAULT_PRICING;
  }
}
