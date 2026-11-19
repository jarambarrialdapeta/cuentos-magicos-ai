import type { Metadata } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "IpuinMagikoak | Sortu Zure Ipuin Ilustratu Pertsonalizatuak",
  description:
    "Bihurtu argazki bat ipuin ilustratu bateko protagonista. Pertsonaia koherenteak orrialdez orrialde, zuzeneko edizioa, audio-narrazioa eta PDF esportazioa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="eu" className={`${fraunces.variable} ${instrumentSans.variable}`}>
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
