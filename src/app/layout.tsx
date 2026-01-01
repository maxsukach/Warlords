// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import SwRegister from "./SwRegister";
import { validateCardRegistry } from "@/domain/cards";

export const metadata: Metadata = {
  title: "Warlords",
  description: "Turn-based card strategy game",
};

if (process.env.NODE_ENV !== "production") {
  validateCardRegistry();
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#0b0b0f" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
        <meta name="screen-orientation" content="portrait" />
        <meta name="orientation" content="portrait" />
      </head>
      <body className="min-h-screen bg-black text-white overscroll-none">
        {children}
        <SwRegister />
      </body>
    </html>
  );
}
