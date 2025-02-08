import React from "react";
import { useNavigate } from "react-router-dom";
import metamaskLogo from "../assets/metamask.png";

const Login = () => {
  const navigate = useNavigate();

  const connectMetaMask = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        const account = accounts[0];
        localStorage.setItem(
          "currentUser",
          JSON.stringify({
            type: "metamask",
            address: account,
          })
        );
        window.dispatchEvent(new Event("auth-change"));
        navigate("/");
      } catch (error) {
        console.error("Erreur de connexion à MetaMask:", error);
        alert("Erreur de connexion à MetaMask");
      }
    } else {
      alert("MetaMask n'est pas installé");
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>Connexion avec MetaMask</h2>
        <p className="metamask-description">
          Connectez-vous en toute sécurité avec votre wallet MetaMask pour
          accéder à la plateforme.
        </p>
        <button className="metamask-button" onClick={connectMetaMask}>
          <img src={metamaskLogo} alt="MetaMask" className="metamask-icon" />
          Connect with MetaMask
        </button>
      </div>
    </div>
  );
};

export default Login;
