import { useNavigate } from "react-router-dom";

interface Ad {
  id: string;
  title: string;
  description: string;
  price: number;
  createdAt: Date;
}

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="welcome-title">
        <p className="welcome-label">Welcome to DeBug</p>
        <div className="welcome-buttons">
          <button className="home-button" onClick={() => navigate("/browse")}>
            Browse posts
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

      <div className="ads-grid"></div>
    </div>
  );
};

export default Home;
