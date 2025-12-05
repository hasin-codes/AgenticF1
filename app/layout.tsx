import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ChatProvider } from "@/lib/chat-context";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false, // Only load when needed
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: "F1 Telemetry Analysis",
  description: "AI-powered Formula 1 telemetry analysis and insights",
  icons: {
    icon: "/Logo/favicon.ico",
    shortcut: "/Logo/favicon.ico",
    apple: "/Logo/Logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <ChatProvider>
          {children}
        </ChatProvider>
      </body>
    </html>
  );
}
