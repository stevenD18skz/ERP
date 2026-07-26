"use client";

import { useState } from "react";
import SideBar from "./SideBar";
import Footer from "./Footer";
import TopBar from "./TopBar";

const AppShell = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen">
      <TopBar
        sidebarExpanded={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((s) => !s)}
      />

      <div className="flex">
        <SideBar isExpanded={sidebarOpen} />
        <div
          className={`flex min-h-[calc(100vh-4rem)] flex-1 flex-col transition-all duration-300 ${
            sidebarOpen ? "pl-48" : "pl-16"
          }`}
        >
          <main className="flex-1 bg-slate-50 px-4 py-6 md:px-8">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default AppShell;
