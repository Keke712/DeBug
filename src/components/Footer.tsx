// Footer.tsx
import { Link } from "react-router-dom";
import "../styles/Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <Link to="/about">About Us</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2024 DeBug. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
