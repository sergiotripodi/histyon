// Piani Resend con prezzi ufficiali (maggio 2026)
// Overage: $0.90 per 1.000 email oltre quota su piani pagati

export const RESEND_PLANS = {
  free:        { label: 'Free',          price: 0,    quota: 3_000,     dailyLimit: 100  },
  pro_50k:     { label: 'Pro · 50K',     price: 20,   quota: 50_000,    dailyLimit: null },
  pro_100k:    { label: 'Pro · 100K',    price: 35,   quota: 100_000,   dailyLimit: null },
  scale_100k:  { label: 'Scale · 100K',  price: 90,   quota: 100_000,   dailyLimit: null },
  scale_250k:  { label: 'Scale · 250K',  price: 200,  quota: 250_000,   dailyLimit: null },
  scale_500k:  { label: 'Scale · 500K',  price: 350,  quota: 500_000,   dailyLimit: null },
  scale_1m:    { label: 'Scale · 1M',    price: 600,  quota: 1_000_000, dailyLimit: null },
  scale_2m:    { label: 'Scale · 2M',    price: 900,  quota: 2_000_000, dailyLimit: null },
  scale_2_5m:  { label: 'Scale · 2.5M',  price: 1150, quota: 2_500_000, dailyLimit: null },
} as const

export type ResendPlanKey = keyof typeof RESEND_PLANS

export const RESEND_OVERAGE_RATE = 0.90 // $ per 1.000 email
