import { useNavigate } from "react-router-dom";
import Button from "./Button";
import logo from "../assets/logo.png";
import { useState, useEffect } from "react";

const Header = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Vérification initiale
    checkLoginStatus();

    // Écouter les changements de localStorage
    window.addEventListener("storage", checkLoginStatus);

    // Créer un intervalle de vérification
    const interval = setInterval(checkLoginStatus, 1000);

    return () => {
      window.removeEventListener("storage", checkLoginStatus);
      clearInterval(interval);
    };
  }, []);

  const checkLoginStatus = () => {
    const user = localStorage.getItem("currentUser");
    setIsLoggedIn(!!user);
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setIsLoggedIn(false);
    navigate("/");
  };

  return (
    <header className="header">
      <div className="header-logo-container" onClick={() => navigate("/")}>
        <img src={logo} className="header-logo" alt="DeBug Logo" />
        <span className="header-title">DeBug</span>
      </div>
      <div className="header-buttons">
        {isLoggedIn ? (
          <>
            <Button onClick={() => navigate("/dashboard")} variant="primary">
              Dashboard
            </Button>
            <Button onClick={handleLogout} variant="primary">
              Logout
            </Button>
          </>
        ) : (
          <Button onClick={() => navigate("/login")} variant="primary">
            Login
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
