import HeaderAuth from "@/components/header-auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import { BarChart2, BookOpen, Home, Inbox, Plus, Settings } from "lucide-react";
import { Chatbot } from "@/components/chat/chatbot";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Nexus | Support Portal",
  description: "AI-powered customer support and ticketing system",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex h-screen w-full bg-black">
            {/* Sidebar Navigation */}
            <aside className="w-16 bg-zinc-900 border-r border-zinc-800 h-full flex flex-col items-center py-6">
              <nav className="flex flex-col gap-6">
                <Link
                  href="/"
                  className="p-2 rounded-lg transition-colors duration-200 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  <Home className="w-5 h-5" />
                </Link>
                <Link
                  href="/tickets"
                  className="p-2 rounded-lg transition-colors duration-200 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  <Inbox className="w-5 h-5" />
                </Link>
                <Link
                  href="/tickets/new"
                  className="p-2 rounded-lg transition-colors duration-200 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  <Plus className="w-5 h-5" />
                </Link>
                <Link
                  href="/knowledge-base"
                  className="p-2 rounded-lg transition-colors duration-200 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  <BookOpen className="w-5 h-5" />
                </Link>
                <Link
                  href="/analytics"
                  className="p-2 rounded-lg transition-colors duration-200 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  <BarChart2 className="w-5 h-5" />
                </Link>
                <Link
                  href="/settings"
                  className="p-2 rounded-lg transition-colors duration-200 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  <Settings className="w-5 h-5" />
                </Link>
              </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
              {/* Top Navigation */}
              <nav className="w-full flex justify-end border-b border-zinc-800 h-16">
                <div className="flex items-center gap-4 px-6">
                  {!hasEnvVars ? null : <HeaderAuth />}
                  <ThemeSwitcher />
                </div>
              </nav>

              {/* Page Content */}
              <main className="flex-1 overflow-auto">
                {children}
              </main>
            </div>

            {/* Chatbot */}
            <Chatbot />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
