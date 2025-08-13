import { useState } from "react";
import { Outlet } from "react-router-dom";
import SideBar from "./SideBar";
import Footer from "./Footer";
import TopBar from "./TopBar";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}

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
        <main className="p-4 md:p-8">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
