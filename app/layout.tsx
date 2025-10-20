import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Provider from "./provider";
import MotionWrapper from "./_components/MotionWrapper";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/context/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI HealthMate",
  description:
    "AI HealthMate is a voice-powered medical assistant that connects you with AI doctors for instant, personalized health consultations — anytime, anywhere",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased transition-colors duration-500 bg-white text-gray-900 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 dark:text-white min-h-screen`}
      >
        <ThemeProvider>
          <Provider>
            <MotionWrapper>{children}</MotionWrapper>
            <Toaster />
          </Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
