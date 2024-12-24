import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import SideBar from "./SideBar";

const Layout = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const handleSidebarToggle = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <SideBar isExpanded={isSidebarExpanded} onToggle={handleSidebarToggle} />

      <div className={`flex flex-1 flex-col transition-margin duration-300 ${isSidebarExpanded ? "ml-64" : "ml-16"}`}>
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-500 p-4 dark:bg-gray-800 md:p-6">
          <Outlet />
        </main>

        {/* Footer */}
        {/* <footer className="bg-gray-800 p-4 text-center text-white">
          <p>© 2024 Mi Aplicación</p>
        </footer> */}
      </div>
    </div>
  );
};

export default Layout;
