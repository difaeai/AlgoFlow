import { NextResponse } from "next/server";
import { BinanceAPIError, verifyBinanceAccount } from "@/lib/binance";

interface VerifyRequestBody {
  apiKey?: string;
  apiSecret?: string;
}

export async function POST(request: Request) {
  let body: VerifyRequestBody;

  try {
    body = (await request.json()) as VerifyRequestBody;
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const apiKey = body?.apiKey?.trim();
  const apiSecret = body?.apiSecret?.trim();

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Binance API key and secret are both required for verification." },
      { status: 400 },
    );
  }

  try {
    const account = await verifyBinanceAccount(apiKey, apiSecret);
    return NextResponse.json({
      account: {
        accountType: account.accountType,
        canTrade: account.canTrade,
        canWithdraw: account.canWithdraw,
        canDeposit: account.canDeposit,
        updateTime: account.updateTime,
      },
    });
  } catch (error) {
    const message =
      error instanceof BinanceAPIError
        ? error.message
        : "Unable to verify Binance credentials right now.";
    const status = error instanceof BinanceAPIError && error.status ? error.status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
