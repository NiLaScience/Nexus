import React from "react";
import { Link, useLocation } from "react-router-dom";
import { BarChart2, BookOpen, Home, Inbox, Plus, Settings } from "lucide-react";
import { Chatbot } from "./Chatbot";
export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <div className="flex h-screen w-full bg-black">
      <aside className="w-16 bg-zinc-900 border-r border-zinc-800 h-full flex flex-col items-center py-6">
        <nav className="flex flex-col gap-6">
          <Link
            to="/"
            className={`p-2 rounded-lg transition-colors duration-200 hover:bg-zinc-800 ${location.pathname === "/" ? "bg-zinc-800 text-white" : "text-zinc-400"}`}
          >
            <Home className="w-5 h-5" />
          </Link>
          <Link
            to="/tickets"
            className={`p-2 rounded-lg transition-colors duration-200 hover:bg-zinc-800 ${location.pathname === "/tickets" ? "bg-zinc-800 text-white" : "text-zinc-400"}`}
          >
            <Inbox className="w-5 h-5" />
          </Link>
          <Link
            to="/new"
            className={`p-2 rounded-lg transition-colors duration-200 hover:bg-zinc-800 ${location.pathname === "/new" ? "bg-zinc-800 text-white" : "text-zinc-400"}`}
          >
            <Plus className="w-5 h-5" />
          </Link>
          <Link
            to="/kb"
            className={`p-2 rounded-lg transition-colors duration-200 hover:bg-zinc-800 ${location.pathname === "/kb" ? "bg-zinc-800 text-white" : "text-zinc-400"}`}
          >
            <BookOpen className="w-5 h-5" />
          </Link>
          <Link
            to="/analytics"
            className={`p-2 rounded-lg transition-colors duration-200 hover:bg-zinc-800 ${location.pathname === "/analytics" ? "bg-zinc-800 text-white" : "text-zinc-400"}`}
          >
            <BarChart2 className="w-5 h-5" />
          </Link>
          <Link
            to="/settings"
            className={`p-2 rounded-lg transition-colors duration-200 hover:bg-zinc-800 ${location.pathname === "/settings" ? "bg-zinc-800 text-white" : "text-zinc-400"}`}
          >
            <Settings className="w-5 h-5" />
          </Link>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto bg-zinc-950">{children}</main>
      <Chatbot />
    </div>
  );
}
