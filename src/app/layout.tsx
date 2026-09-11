import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KALA'S | Produits d'Hygiène - Pointe-Noire, Congo-Brazzaville",
  description:
    "KALA'S - Fabricant de produits d'hygiène de qualité industrielle à Pointe-Noire, Congo-Brazzaville. Savon liquide, détergent et eau de Javel.",
  keywords: [
    "KALA'S",
    "savon liquide",
    "détergent",
    "eau de Javel",
    "Pointe-Noire",
    "Congo-Brazzaville",
    "produits d'hygiène",
    "nettoyage",
  ],
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "KALA'S | Produits d'Hygiène",
    description:
      "Savon liquide, détergent et eau de Javel de qualité industrielle. Fabriqué avec fierté à Pointe-Noire.",
    siteName: "KALA'S",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          <div className="min-h-screen flex flex-col">{children}</div>
        </Providers>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
