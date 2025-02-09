import { useNavigate } from "react-router-dom";
import Button from "./Button";
import logo from "../assets/logo.png";
import { useState, useEffect, useRef } from "react";

const Header = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userAddress, setUserAddress] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkLoginStatus();
    window.addEventListener("storage", checkLoginStatus);
    window.addEventListener("auth-change", checkLoginStatus);
    const interval = setInterval(checkLoginStatus, 1000);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("storage", checkLoginStatus);
      window.removeEventListener("auth-change", checkLoginStatus);
      document.removeEventListener("mousedown", handleClickOutside);
      clearInterval(interval);
    };
  }, []);

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsDropdownOpen(false);
    }
  };

  const checkLoginStatus = () => {
    const user = localStorage.getItem("currentUser");
    if (user) {
      const userData = JSON.parse(user);
      setIsLoggedIn(true);
      setUserAddress(userData.address);
    } else {
      setIsLoggedIn(false);
      setUserAddress("");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setIsLoggedIn(false);
    setIsDropdownOpen(false);
    navigate("/");
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(userAddress);
      // Optionnel : Ajouter un retour visuel
      alert("Adresse copiée !");
    } catch (err) {
      console.error("Erreur lors de la copie:", err);
    }
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
            <div className="dropdown" ref={dropdownRef}>
              <Button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                variant="primary"
                className="dropdown-toggle"
              >
                {shortenAddress(userAddress)} ▼
              </Button>
              {isDropdownOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-item address">
                    <div className="address-container">
                      <span className="address-text">{userAddress}</span>
                      <button 
                        className="copy-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard();
                        }}
                        title="Copy address"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                  <div className="dropdown-item" onClick={handleLogout}>
                    Logout
                  </div>
                </div>
              )}
            </div>
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
