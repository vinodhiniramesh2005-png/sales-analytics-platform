"use client";

import { useState, ReactNode } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import MobileSidebar from "./MobileSidebar";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function DashboardShell({ title, children }: { title: string; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-bg dark:bg-bg-dark">
        <Sidebar />
        <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="flex-1 min-w-0">
          <Navbar title={title} onMenuClick={() => setMobileOpen(true)} />
          <main className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
