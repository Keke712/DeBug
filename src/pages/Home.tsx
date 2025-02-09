import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

interface Ad {
  id: string;
  title: string;
  description: string;
  price: number;
  createdAt: Date;
}

const Home = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAds = async () => {
      const querySnapshot = await getDocs(collection(db, "ads"));
      const adsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Ad[];
      setAds(adsData);
    };

    fetchAds();
  }, []);

  return (
    <div className="home-container">
      <div className="welcome-title">
        <p className="welcome-label">Welcome to DeBug</p>
        <div className="welcome-buttons">
          <button className="home-button" onClick={() => navigate("/browse")}>
            Browse posts
          </button>
          <button className="home-button" onClick={() => navigate("/post-ad")}>
            Place a bug bounty
          </button>
        </div>
      </div>

      <div className="about-section">
        <h2>About Us</h2>
        <div className="specialties">
          <div className="specialty-card">
            <h3>Cybersecurity</h3>
            <p>Specialized in vulnerability detection and resolution</p>
          </div>
          <div className="specialty-card">
            <h3>Web 3</h3>
            <p>Securing blockchain transactions and smart contracts</p>
          </div>
        </div>
      </div>

      <div className="ads-grid">
        {ads.map((ad) => (
          <div key={ad.id} className="ad-card">
            <h3>{ad.title}</h3>
            <p className="description">{ad.description}</p>
            <p className="price">{ad.price}€</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
