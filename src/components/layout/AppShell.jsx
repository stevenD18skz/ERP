"use client";

import { useState } from "react";
import SideBar from "./SideBar";
import Footer from "./Footer";
import TopBar from "./TopBar";

const AppShell = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen">
      <SideBar
        isExpanded={sidebarOpen}
        onToggle={() => setSidebarOpen((s) => !s)}
      />
      <div
        className={`flex-1 transition-all duration-300 ${sidebarOpen ? "pl-64" : "pl-16"} space-y-2`}
      >
        <TopBar />
        <main className="">{children}</main>
        <Footer />
      </div>
    </div>
  );
};

export default AppShell;
