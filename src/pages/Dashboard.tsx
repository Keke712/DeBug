// Dashboard.tsx
import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
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
  const [showNewBountyForm, setShowNewBountyForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
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

  const handleNewBounty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(collection(db, "ads"), {
        title,
        description,
        price: Number(price),
        createdAt: new Date(),
        userAddress: currentUser.address,
      });

      // Rafraîchir la liste des bounties
      const updatedAds = [
        ...userAds,
        {
          id: docRef.id,
          title,
          description,
          price: Number(price),
          createdAt: new Date(),
        },
      ];
      setUserAds(updatedAds);

      // Réinitialiser le formulaire
      setTitle("");
      setDescription("");
      setPrice("");
      setShowNewBountyForm(false);
    } catch (error) {
      console.error("Error adding bounty: ", error);
    }
  };

  const renderBountyForm = () => (
    <form onSubmit={handleNewBounty} className="bounty-form">
      <div className="form-group">
        <label htmlFor="title">Bounty Title</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a descriptive title"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the bug or vulnerability in detail"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="price">Reward Amount (€)</label>
        <input
          id="price"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Enter the bounty reward"
          required
        />
      </div>
      <div className="form-buttons">
        <button
          type="button"
          onClick={() => setShowNewBountyForm(false)}
          className="cancel-button"
        >
          Cancel
        </button>
        <button type="submit" className="submit-button">
          Create Contract
        </button>
      </div>
    </form>
  );

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
            <div className="bounties-header">
              <h3>My Bug Bounties</h3>
              <button
                onClick={() => setShowNewBountyForm(true)}
                className="new-bounty-button"
              >
                Create a new contract
              </button>
            </div>
            {showNewBountyForm && renderBountyForm()}
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
