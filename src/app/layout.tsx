import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { MyNavBar } from "@/components/navbar";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Phy Bench",
  description: "phybench official website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased relative  bg-gradient-to-br from-white to-slate-200 dark:from-slate-800 dark:to-black min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <MyNavBar />
          <div className="fixed top-0 right-0 translate-x-[600px] translate-y-[-500px] bg-linear-to-br from-indigo-300/15 to-pink-400/10 dark:from-indigo-700/25 dark:to-pink-700/30 blur-3xl w-[1200px] h-[1200px] z-[-50] rounded-full"></div>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
