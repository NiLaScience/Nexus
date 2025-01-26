import HeaderAuth from "@/components/header-auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import { BarChart2, BookOpen, Home, Inbox, Plus, Settings } from "lucide-react";
import { Chatbot } from "@/components/chat/chatbot";
import { Toaster } from "@/components/ui/toaster";
import { NotificationsDropdown } from "@/components/ui/notifications-dropdown";
import "./globals.css";
import { AuthService } from "@/services/auth";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await AuthService.getCurrentUser();
  const isCustomer = session.user?.profile?.role === 'customer';

  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex h-screen w-full bg-background">
            {/* Sidebar Navigation */}
            <aside className="w-16 bg-muted border-r border-border h-full flex flex-col items-center py-6">
              <nav className="flex flex-col gap-6">
                {!isCustomer && (
                  <Link
                    href="/dashboard"
                    className="p-2 rounded-lg transition-colors duration-200 hover:bg-accent text-muted-foreground hover:text-foreground"
                  >
                    <Home className="w-5 h-5" />
                  </Link>
                )}
                <Link
                  href="/tickets"
                  className="p-2 rounded-lg transition-colors duration-200 hover:bg-accent text-muted-foreground hover:text-foreground"
                >
                  <Inbox className="w-5 h-5" />
                </Link>
                <Link
                  href="/tickets/new"
                  className="p-2 rounded-lg transition-colors duration-200 hover:bg-accent text-muted-foreground hover:text-foreground"
                >
                  <Plus className="w-5 h-5" />
                </Link>
                <Link
                  href="/knowledge-base"
                  className="p-2 rounded-lg transition-colors duration-200 hover:bg-accent text-muted-foreground hover:text-foreground"
                >
                  <BookOpen className="w-5 h-5" />
                </Link>
                {!isCustomer && (
                  <Link
                    href="/analytics"
                    className="p-2 rounded-lg transition-colors duration-200 hover:bg-accent text-muted-foreground hover:text-foreground"
                  >
                    <BarChart2 className="w-5 h-5" />
                  </Link>
                )}
                <Link
                  href="/settings"
                  className="p-2 rounded-lg transition-colors duration-200 hover:bg-accent text-muted-foreground hover:text-foreground"
                >
                  <Settings className="w-5 h-5" />
                </Link>
              </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden bg-background">
              {/* Top Navigation */}
              <nav className="w-full flex justify-end border-b border-border h-16">
                <div className="flex items-center gap-4 px-6">
                  {!hasEnvVars ? null : <HeaderAuth />}
                  <NotificationsDropdown />
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
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
