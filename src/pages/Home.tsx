import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

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
        <p className="welcome-label">
          <div className="container">
            <span className="prefix">De</span>
            <span className="suffix">Bug</span>
          </div>
        </p>
        <div className="welcome-buttons">
          <button className="home-button" onClick={() => navigate("/browse")}>
            Browse posts
          </button>
        </div>
      </div>

      <div className="about-section">
        <div className="about-header">
          <h2>About Us</h2>
          <div className="header-line"></div>
        </div>
        <div className="specialties">
          <div className="specialty-card">
            <h3>Cybersecurity</h3>
            <p>
              Advanced vulnerability detection and resolution for enterprise
              systems
            </p>
          </div>
          <div className="specialty-card">
            <h3>Web 3</h3>
            <p>Blockchain security and smart contract protection solutions</p>
          </div>
        </div>
      </div>

      <div className="ads-grid"></div>
    </div>
  );
};

export default Home;
