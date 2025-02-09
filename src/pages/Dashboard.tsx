// Dashboard.tsx
import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { ethers } from "ethers";
import BugBountyPlatformABI from "../components/BugBountyABI.json";
// Importer le Bytecode de votre contrat (assurez-vous de l'avoir compilé)
// Vous devrez peut-être importer un fichier JSON contenant le bytecode
// ou directement inclure la chaîne bytecode ici.
// Pour cet exemple, je vais utiliser un placeholder, **REMPLACEZ-LE PAR VOTRE BYTECODE REEL**
import BugBountyPlatformBytecode from "../components/BugBountyBytecode.json";


interface Ad {
  id: string;
  title: string;
  description: string;
  price: number;
  createdAt: Date;
}

const Dashboard = () => {
  const [userAds, setUserAds] = useState<Ad[]>([]);
  const [activeView, setActiveView] = useState("dashboard");
  const [showNewBountyForm, setShowNewBountyForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNewBounty = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (typeof window.ethereum === "undefined") {
        throw new Error("MetaMask n'est pas installé !");
      }
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

     const factory = new ethers.ContractFactory(
        BugBountyPlatformABI, // ABI de votre contrat
        BugBountyPlatformBytecode.object, // Bytecode de votre contrat (CORRECTION : utiliser .object)
        signer
      );

      const bountyAmount = ethers.parseEther(price); // Convertir le prix en ethers (BigNumber)
      const contract = await factory.deploy({value: bountyAmount}); // Déployer le contrat en envoyant de l'ether comme bounty

      console.log("Transaction de déploiement en cours...", contract.deploymentTransaction()?.hash);
      const deploymentReceipt = await contract.deploymentTransaction()?.wait();
      if (!deploymentReceipt) {
        throw new Error("Erreur lors de la confirmation du déploiement du contrat.");
      }
      const newContractAddress = deploymentReceipt.contractAddress as string;
      console.log("Nouveau contrat Bug Bounty déployé à l'adresse:", newContractAddress);
      alert(`Contrat Bug Bounty déployé avec succès à l'adresse: ${newContractAddress}`);

      // ** IMPORTANT :  Ici, vous devriez enregistrer `newContractAddress` quelque part **
      // ** pour pouvoir interagir avec ce contrat spécifique plus tard.  **
      // ** Par exemple, vous pourriez l'enregistrer dans un état local, une base de données, etc. **
      // ** Pour cet exemple simple, nous allons juste le logger et alert. **


      setTitle("");
      setDescription("");
      setPrice("");
      setShowNewBountyForm(false);
      setError(null);

    } catch (deploymentError: any) {
      console.error("Erreur lors du déploiement du smart contract:", deploymentError);
      setError(
        deploymentError.message || "Erreur lors de la création et du déploiement du contrat."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderBountyForm = () => (
    <form onSubmit={handleNewBounty} className="bounty-form">
      <div className="form-group">
        <label htmlFor="title">Bounty Title</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a descriptive title"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the bug or vulnerability in detail"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="price">Reward Amount (ETH)</label>
        <input
          id="price"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Enter the bounty reward"
          required
        />
      </div>
      <div className="form-buttons">
        <button
          type="button"
          onClick={() => setShowNewBountyForm(false)}
          className="cancel-button"
        >
          Cancel
        </button>
        <button type="submit" className="submit-button" disabled={isLoading}>
          {isLoading ? "Creating Contract..." : "Create Contract"}
        </button>
      </div>
    </form>
  );

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <>
            <h2>Dashboard Overview</h2>
            <div className="user-info">
              <p>Connected Address: {currentUser?.address}</p>
            </div>
            {error && <div className="error-message">{error}</div>}
          </>
        );
      case "bounties":
        return (
          <div className="user-ads">
            <div className="bounties-header">
              <h3>My Bug Bounties</h3>
              <button
                onClick={() => setShowNewBountyForm(true)}
                className="new-bounty-button"
                disabled={isLoading}
              >
                {isLoading ? "Creating Contract..." : "Create a new contract"}
              </button>
            </div>
            {showNewBountyForm && renderBountyForm()}
            {error && <div className="error-message">{error}</div>}
            <div className="ads-grid">
              {userAds.map((ad) => (
                <div key={ad.id} className="ad-card">
                  <h4>{ad.title}</h4>
                  <p>{ad.description}</p>
                  <p className="price">{ad.price}€</p>
                  <p className="date">{ad.createdAt?.toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case "submissions":
        return (
          <div>
            <h3>Active Submissions</h3>
            <p>No active submissions yet.</p>
          </div>
        );
      case "settings":
        return (
          <div>
            <h3>Settings</h3>
            <p>Account settings will be available soon.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar onViewChange={setActiveView} activeView={activeView} />
      <div className="dashboard-content">
        <div className="dashboard-container">{renderContent()}</div>
      </div>
    </div>
  );
};

export default Dashboard;