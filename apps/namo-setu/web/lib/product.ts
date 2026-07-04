export const product = {
  name: "Namo Setu",
  tagline: "Pilgrimage tourism and devotee assistance",
  description:
    "A trusted spiritual travel platform for temple discovery, yatra planning, darshan, puja, and route support.",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1",
  brand: "namo",
} as const;
