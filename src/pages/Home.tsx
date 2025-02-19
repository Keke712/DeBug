import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
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

      <div className="ads-grid"></div>
      <Footer />
    </div>
  );
};

export default Home;
