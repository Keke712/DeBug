import { useNavigate } from "react-router-dom";
import Button from "./Button";
import logo from "../assets/logo.png";
import { useState, useEffect, useRef } from "react";
import Toast from "./Toast";

const Header = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userAddress, setUserAddress] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
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
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
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
      setShowToast(true);
    } catch (err) {
      console.error("Erreur lors de la copie:", err);
    }
  };

  return (
    <>
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
                    <div
                      className="dropdown-item address"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard();
                      }}
                      title="Click to copy address"
                    >
                      <div className="address-container">
                        <span className="address-text">{userAddress}</span>
                        <span className="copy-icon">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" />
                          </svg>
                        </span>
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
      <Toast
        message="Adresse copiée !"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </>
  );
};

export default Header;
