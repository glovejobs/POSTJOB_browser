import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import localFont from "next/font/local";
import { BRAND_CONFIG, getCSSVariables } from "@/../../shared/constants";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RouteTransition } from "@/components/ui/PageTransition";
import { TopLoadingBar } from "@/components/ui/TopLoadingBar";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "@/contexts/auth-context";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: `${BRAND_CONFIG.name} - ${BRAND_CONFIG.tagline}`,
  description: "Post your job opening to 5 university job boards with one click",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cssVariables = getCSSVariables();

  return (
    <html lang="en" className={outfit.variable}>
      <body
        className={`${outfit.className} ${geistMono.variable} antialiased`}
        style={{
          ...cssVariables,
          fontFamily: BRAND_CONFIG.typography.fontFamily.primary,
        } as React.CSSProperties}
      >
        <ErrorBoundary>
          <AuthProvider>
            <ToastProvider>
              <TopLoadingBar />
              <RouteTransition>
                {children}
              </RouteTransition>
            </ToastProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
