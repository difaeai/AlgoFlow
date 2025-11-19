import crypto from "crypto";

const BINANCE_API_BASE_URL = process.env.BINANCE_API_URL ?? "https://api.binance.com";

export class BinanceAPIError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "BinanceAPIError";
    this.status = status;
  }
}

interface SignedRequestOptions {
  method?: "GET" | "POST" | "DELETE";
  params?: Record<string, string>;
}

async function signedRequest<T>(
  apiKey: string,
  apiSecret: string,
  path: string,
  { method = "GET", params = {} }: SignedRequestOptions = {}
): Promise<T> {
  const url = new URL(`${BINANCE_API_BASE_URL}${path}`);
  const searchParams = new URLSearchParams({
    recvWindow: "5000",
    timestamp: Date.now().toString(),
    ...params,
  });

  const signature = crypto.createHmac("sha256", apiSecret).update(searchParams.toString()).digest("hex");
  searchParams.append("signature", signature);

  const requestInit: RequestInit = {
    method,
    headers: {
      "X-MBX-APIKEY": apiKey,
    },
    cache: "no-store",
  };

  if (method === "GET") {
    url.search = searchParams.toString();
  } else {
    requestInit.body = searchParams.toString();
    requestInit.headers = {
      ...requestInit.headers,
      "Content-Type": "application/x-www-form-urlencoded",
    };
  }

  let response: Response;
  try {
    response = await fetch(url, requestInit);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to reach Binance at the moment";
    throw new BinanceAPIError(message);
  }

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as T & { code?: number; msg?: string }) : null;

  if (!response.ok) {
    const message = payload && typeof payload === "object" && "msg" in payload && payload.msg
      ? payload.msg
      : `Binance API error (${response.status})`;
    throw new BinanceAPIError(message as string, response.status);
  }

  if (payload === null) {
    throw new BinanceAPIError("Received empty response from Binance", response.status);
  }

  return payload as T;
}

interface UserAsset {
  asset: string;
  free: string;
  locked: string;
  btcValuation?: string;
}

interface BtcTickerPrice {
  price: string;
}

export interface BinanceAccountInformation {
  accountType: string;
  canTrade: boolean;
  canWithdraw: boolean;
  canDeposit: boolean;
  updateTime: number;
}

export async function verifyBinanceAccount(
  apiKey: string,
  apiSecret: string,
): Promise<BinanceAccountInformation> {
  const account = await signedRequest<BinanceAccountInformation>(apiKey, apiSecret, "/api/v3/account");
  return account;
}

export async function fetchWalletBalanceUSD(apiKey: string, apiSecret: string): Promise<number> {
  const assets = await signedRequest<UserAsset[]>(apiKey, apiSecret, "/sapi/v3/asset/getUserAsset", {
    method: "POST",
    params: { needBtcValuation: "true" },
  });

  if (!Array.isArray(assets)) {
    throw new BinanceAPIError("Unexpected response when retrieving Binance assets");
  }

  const totalBtc = assets.reduce((total, asset) => {
    const valuation = Number(asset.btcValuation ?? 0);
    return total + (Number.isNaN(valuation) ? 0 : valuation);
  }, 0);

  if (totalBtc <= 0) {
    return 0;
  }

  let priceResponse: Response;
  try {
    priceResponse = await fetch(
      `${BINANCE_API_BASE_URL}/api/v3/ticker/price?symbol=BTCUSDT`,
      { cache: "no-store" }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to reach Binance pricing endpoint";
    throw new BinanceAPIError(message);
  }

  if (!priceResponse.ok) {
    throw new BinanceAPIError("Unable to retrieve BTC price for valuation", priceResponse.status);
  }

  const { price } = (await priceResponse.json()) as BtcTickerPrice;
  const btcPrice = Number(price);

  if (Number.isNaN(btcPrice) || btcPrice <= 0) {
    throw new BinanceAPIError("Received invalid BTC price from Binance");
  }

  return totalBtc * btcPrice;
}
