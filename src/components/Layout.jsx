"use client";

import { useState } from "react";
import PropTypes from "prop-types";
import SideBar from "./SideBar";
import Footer from "./Footer";
import TopBar from "./TopBar";

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen">
      <SideBar
        isExpanded={sidebarOpen}
        onToggle={() => setSidebarOpen((s) => !s)}
      />
      <div
        className={`flex-1 transition-all duration-300 ${sidebarOpen ? "pl-64" : "pl-16"}`}
      >
        <TopBar
          onToggleSidebar={() => setSidebarOpen((s) => !s)}
          isSidebarExpanded={sidebarOpen}
        />
        <main className="p-4 md:p-8">{children}</main>
        <Footer />
      </div>
    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.node,
};

export default Layout;
