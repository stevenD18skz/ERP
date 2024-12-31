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

      <div
        className={`transition-margin flex flex-1 flex-col duration-300 ${isSidebarExpanded ? "ml-64" : "ml-16"}`}
      >
        {/* Main Content */}
        <main className="h-full flex-1 overflow-y-auto bg-gray-500 dark:bg-gray-800">
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
