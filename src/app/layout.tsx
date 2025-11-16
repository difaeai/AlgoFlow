import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { BotProvider } from "@/context/bot-provider";
import FirebaseClientProvider from "@/firebase/client-provider";

export const metadata: Metadata = {
  title: "AlgoFlow",
  description:
    "Automated Trading, Non-Custodial. Connect your Binance or Exness account and let our bots trade for you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Code+Pro:wght@400;500;600&family=Space+Grotesk:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <BotProvider>{children}</BotProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
