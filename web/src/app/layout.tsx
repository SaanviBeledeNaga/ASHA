import type { Metadata } from "next";
import { Inter, Poppins, Noto_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const poppins = Poppins({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const notoSans = Noto_Sans({
  variable: "--font-noto",
  subsets: ["latin", "devanagari"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Advanced System for Human Assistance (ASHA) Copilot",
  description: "Futuristic Multilingual AI Copilot for Indian Government & Community Health Services",
};

export default function RootLayout({
  children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable} ${notoSans.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#0F172A] text-slate-100 selection:bg-cyan-500 selection:text-slate-900">
        {children}
      </body>
    </html>
  );
}
