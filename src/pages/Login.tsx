import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import metamaskLogo from "../assets/metamask.png";
import { supabase } from "../supabase";

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const connectMetaMask = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        setIsLoading(true);
        // Connexion à MetaMask
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        const account = accounts[0];

        // Vérifier si l'utilisateur existe déjà dans Supabase
        const { data: existingUser } = await supabase
          .from("users")
          .select()
          .eq("wallet_address", account)
          .single();

        if (!existingUser) {
          // Créer un nouvel utilisateur dans Supabase
          const { error } = await supabase.from("users").insert([
            {
              wallet_address: account,
              created_at: new Date().toISOString(),
              last_login: new Date().toISOString(),
            },
          ]);

          if (error) throw error;
        } else {
          // Mettre à jour la dernière connexion
          await supabase
            .from("users")
            .update({ last_login: new Date().toISOString() })
            .eq("wallet_address", account);
        }

        // Sauvegarder les informations dans le localStorage
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
        console.error("Erreur de connexion:", error);
        alert("Erreur lors de la connexion");
      } finally {
        setIsLoading(false);
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
        <button
          className="metamask-button"
          onClick={connectMetaMask}
          disabled={isLoading}
        >
          <img src={metamaskLogo} alt="MetaMask" className="metamask-icon" />
          {isLoading ? "Connexion en cours..." : "Connect with MetaMask"}
        </button>
      </div>
    </div>
  );
};

export default Login;
