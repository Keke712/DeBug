import Button from "./Button";
import logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const Header = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkLoginStatus = () => {
      const user = localStorage.getItem("currentUser");
      setIsLoggedIn(!!user);
    };

    checkLoginStatus();
    window.addEventListener("storage", checkLoginStatus);
    return () => window.removeEventListener("storage", checkLoginStatus);
  }, []);

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
