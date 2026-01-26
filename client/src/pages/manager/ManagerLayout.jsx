import React from "react";
import { Outlet } from "react-router-dom";
import ManagerNavbar from "../../components/manager/ManagerNavbar";
import ManagerSidebar from "../../components/manager/ManagerSidebar";
import ErrorBoundary from "../../components/ErrorBoundary";

const ManagerLayout = () => {
  return (
    <>
      <ManagerNavbar />
      <div className="flex">
        <ManagerSidebar />
        <div className="flex-1 px-4 py-10 md:px-10 h-[calc(100vh-64px)] overflow-y-auto">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </div>
    </>
  );
};

export default ManagerLayout;
