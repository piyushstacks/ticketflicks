import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Film, Tv, Bookmark, Clapperboard } from "lucide-react";

const ManagerSidebar = () => {
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard",      path: "/manager",          icon: LayoutDashboard },
    { name: "Manage Movies",  path: "/manager/movies",   icon: Clapperboard    },
    { name: "Manage Shows",   path: "/manager/shows",    icon: Film            },
    { name: "Manage Screens", path: "/manager/screens",  icon: Tv              },
    { name: "Bookings",       path: "/manager/bookings", icon: Bookmark        },
  ];

  return (
    <aside
      className="w-64 h-[calc(100vh-64px)] overflow-y-auto sticky top-16"
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderRight: "1px solid var(--border)",
      }}
    >
      <div className="p-6 space-y-1">
        {menuItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path === "/manager" && location.pathname === "/manager") ||
            (item.path !== "/manager" && location.pathname.startsWith(item.path));

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
              style={{
                backgroundColor: isActive ? "var(--color-accent-soft)" : "transparent",
                color: isActive ? "var(--color-accent)" : "var(--text-secondary)",
                borderLeft: isActive ? "2px solid var(--color-accent)" : "2px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
};

export default ManagerSidebar;
