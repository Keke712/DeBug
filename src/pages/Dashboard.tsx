// Dashboard.tsx
import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import Sidebar from "../components/Sidebar";

interface Ad {
  id: string;
  title: string;
  description: string;
  price: number;
  createdAt: Date;
}

const Dashboard = () => {
  const [userAds, setUserAds] = useState<Ad[]>([]);
  const [activeView, setActiveView] = useState("dashboard");
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

  useEffect(() => {
    const fetchUserAds = async () => {
      if (currentUser?.address) {
        const q = query(
          collection(db, "ads"),
          where("userAddress", "==", currentUser.address)
        );
        const querySnapshot = await getDocs(q);
        const ads = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
        })) as Ad[];
        setUserAds(ads);
      }
    };

    fetchUserAds();
  }, [currentUser]);

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <>
            <h2>Dashboard Overview</h2>
            <div className="user-info">
              <p>Connected Address: {currentUser?.address}</p>
            </div>
          </>
        );
      case "bounties":
        return (
          <div className="user-ads">
            <h3>My Bug Bounties</h3>
            <div className="ads-grid">
              {userAds.map((ad) => (
                <div key={ad.id} className="ad-card">
                  <h4>{ad.title}</h4>
                  <p>{ad.description}</p>
                  <p className="price">{ad.price}€</p>
                  <p className="date">{ad.createdAt?.toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case "submissions":
        return (
          <div>
            <h3>Active Submissions</h3>
            <p>No active submissions yet.</p>
          </div>
        );
      case "settings":
        return (
          <div>
            <h3>Settings</h3>
            <p>Account settings will be available soon.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar onViewChange={setActiveView} activeView={activeView} />
      <div className="dashboard-content">
        <div className="dashboard-container">{renderContent()}</div>
      </div>
    </div>
  );
};

export default Dashboard;
