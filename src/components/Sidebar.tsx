import React from "react";
import {
  FaBug,
  FaClipboardList,
  FaCode,
  FaChartLine,
  FaGlobe,
} from "react-icons/fa";

interface MenuItem {
  id: number;
  title: string;
  icon: React.ReactNode;
  view: string;
}

interface SidebarProps {
  onViewChange: (view: string) => void;
  activeView: string;
  hasBounties: boolean;
  hasSubmissions: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  onViewChange,
  activeView,
  hasBounties,
  hasSubmissions,
}) => {
  const menuItems: MenuItem[] = [
    {
      id: 1,
      title: "Dashboard",
      icon: <FaChartLine className="menu-icon" />,
      view: "dashboard",
    },
    hasBounties && {
      id: 2,
      title: "My Bounties",
      icon: <FaBug className="menu-icon" />,
      view: "bounties",
    },
    hasSubmissions && {
      id: 3,
      title: "Active Submissions",
      icon: <FaClipboardList className="menu-icon" />,
      view: "submissions",
    },
    {
      id: 4,
      title: "Public",
      icon: <FaGlobe className="menu-icon" />,
      view: "public",
    },
    {
      id: 5,
      title: "Developers",
      icon: <FaCode className="menu-icon" />,
      view: "developers",
    },
  ].filter(Boolean) as MenuItem[];

  return (
    <div className="sidebar">
      <nav className="sidebar-nav">
        <ul className="sidebar-menu">
          {menuItems.map((item) => (
            <li
              key={item.id}
              className={`sidebar-item ${
                activeView === item.view ? "active" : ""
              }`}
              onClick={() => onViewChange(item.view)}
            >
              {item.icon}
              <span className="item-title">{item.title}</span>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
