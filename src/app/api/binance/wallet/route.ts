import { NextResponse } from "next/server";

import { BinanceAPIError, fetchWalletBalanceUSD } from "@/lib/binance";

export async function POST(request: Request) {
  try {
    const { apiKey, apiSecret } = (await request.json()) as {
      apiKey?: string;
      apiSecret?: string;
    };

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Binance API key and secret are required." },
        { status: 400 }
      );
    }

    const totalBalanceUSD = await fetchWalletBalanceUSD(apiKey.trim(), apiSecret.trim());

    return NextResponse.json({ totalBalanceUSD });
  } catch (error) {
    console.error("Failed to fetch Binance wallet balance:", error);
    if (error instanceof BinanceAPIError) {
      return NextResponse.json({ error: error.message }, { status: error.status ?? 502 });
    }
    return NextResponse.json(
      { error: "Unexpected error contacting Binance. Please try again." },
      { status: 502 }
    );
  }
}
