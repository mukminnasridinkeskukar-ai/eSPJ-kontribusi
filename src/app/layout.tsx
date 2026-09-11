import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "eSPJ-Kontribusi — Dinas Kesehatan Kab. Kutai Kartanegara",
  description:
    "Platform pengelolaan SPJ Kontribusi Pelatihan: formulir Data Pelatihan terintegrasi dengan dokumen resmi (BAP, BAST, BA Bayar, BA Bermaterai, Bukti Pengeluaran Bend.20, Disposisi, Cover, Daftar Pembayaran, Pernyataan PA) dalam format F4 siap cetak.",
  keywords: ["SPJ", "eSPJ", "Kontribusi", "Pelatihan", "Dinas Kesehatan", "Kutai Kartanegara", "F4"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
