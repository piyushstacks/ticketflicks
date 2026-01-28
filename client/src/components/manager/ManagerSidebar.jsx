import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Film, Tv, Bookmark, Clapperboard } from "lucide-react";

const ManagerSidebar = () => {
  const location = useLocation();

  const menuItems = [
    {
      name: "Dashboard",
      path: "/manager",
      icon: LayoutDashboard,
    },
    {
      name: "Manage Movies",
      path: "/manager/movies",
      icon: Clapperboard,
    },
    {
      name: "Manage Shows",
      path: "/manager/shows",
      icon: Film,
    },
    {
      name: "Manage Screens",
      path: "/manager/screens",
      icon: Tv,
    },
    {
      name: "Bookings",
      path: "/manager/bookings",
      icon: Bookmark,
    },
  ];

  return (
    <aside className="w-64 bg-gray-900/50 border-r border-gray-800 h-[calc(100vh-64px)] overflow-y-auto sticky top-16">
      <div className="p-6 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path === "/manager" && location.pathname === "/manager") ||
            (item.path !== "/manager" && location.pathname.startsWith(item.path));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? "bg-primary/20 text-primary border-l-2 border-primary"
                  : "text-gray-300 hover:bg-gray-800/50"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
};

export default ManagerSidebar;
