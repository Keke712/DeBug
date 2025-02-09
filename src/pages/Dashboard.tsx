// Dashboard.tsx
import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { ethers } from "ethers";
import { supabase } from "../supabase";
import BugBountyPlatformABI from "../components/BugBountyABI.json";

const contractAddress = "0xf8e81D47203A594245E36C48e151709F0C19fBe8";

interface Ad {
  id: string;
  title: string;
  description: string;
  price: number;
  createdAt: Date;
}

interface ContractFormData {
  title: string;
  description: string;
  price: string;
  contractType: string;
  tags: string[];
}

interface Contract {
  id: string;
  title: string;
  description: string;
  amount: string;
  created_at: string;
  transaction_hash: string;
  contract_type: string;
  tags: string[];
  wallet_address: string;
}

interface Submit {
  hash: string;
  description: string;
  created_at: string;
  submitter_address: string;
}

const Dashboard = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [userAds, setUserAds] = useState<Ad[]>([]);
  const [activeView, setActiveView] = useState("dashboard");
  const [showNewBountyForm, setShowNewBountyForm] = useState(false);
  const [formData, setFormData] = useState<ContractFormData>({
    title: "",
    description: "",
    price: "",
    contractType: "bug_bounty",
    tags: [],
  });
  const [tagInput, setTagInput] = useState("");
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submits, setSubmits] = useState<{ [key: string]: Submit[] }>({});
  const [selectedContract, setSelectedContract] = useState<string | null>(null);
  const [userSubmits, setUserSubmits] = useState<Submit[]>([]);

  useEffect(() => {
    const fetchUserContracts = async () => {
      if (currentUser?.address) {
        try {
          const { data, error } = await supabase
            .from("contracts")
            .select("*")
            .eq("wallet_address", currentUser.address)
            .order("created_at", { ascending: false });

          if (error) {
            throw error;
          }

          setContracts(data || []);
        } catch (error) {
          console.error("Erreur lors du chargement des contrats:", error);
          setError("Erreur lors du chargement des contrats");
        }
      }
    };

    fetchUserContracts();
  }, [currentUser?.address]);

  useEffect(() => {
    const fetchSubmits = async () => {
      if (contracts.length > 0) {
        const hashes = contracts.map((c) => c.transaction_hash);
        const { data, error } = await supabase
          .from("submits")
          .select("*")
          .in("hash", hashes);

        if (error) {
          console.error("Error fetching submits:", error);
          return;
        }

        // Grouper les submits par hash de contrat
        const submitsByHash = (data || []).reduce(
          (acc: { [key: string]: Submit[] }, submit: Submit) => {
            if (!acc[submit.hash]) {
              acc[submit.hash] = [];
            }
            acc[submit.hash].push(submit);
            return acc;
          },
          {}
        );

        setSubmits(submitsByHash);
      }
    };

    fetchSubmits();
  }, [contracts]);

  useEffect(() => {
    const fetchUserSubmits = async () => {
      if (currentUser?.address) {
        try {
          const { data, error } = await supabase
            .from("submits")
            .select("*")
            .eq("submitter_address", currentUser.address)
            .order("created_at", { ascending: false });

          if (error) {
            console.error("Error fetching user submits:", error);
            setError("Error fetching user submits");
            return;
          }

          setUserSubmits(data || []);
        } catch (error) {
          console.error("Error fetching user submits:", error);
          setError("Error fetching user submits");
        }
      }
    };

    fetchUserSubmits();
  }, [currentUser?.address]);

  const handleAddTag = () => {
    if (tagInput && !formData.tags.includes(tagInput)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

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
      const contract = new ethers.Contract(
        contractAddress,
        BugBountyPlatformABI,
        signer
      );

      const bountyAmount = ethers.parseUnits(formData.price, 18);

      // Utiliser depositFunds au lieu de createQuest
      const transaction = await contract.depositFunds({
        value: bountyAmount,
      });

      await transaction.wait();

      // 2. Enregistrement dans Supabase
      const { error: supabaseError } = await supabase.from("contracts").insert([
        {
          wallet_address: currentUser.address,
          transaction_hash: transaction.hash,
          title: formData.title,
          description: formData.description,
          contract_type: formData.contractType,
          tags: formData.tags,
          amount: formData.price,
        },
      ]);

      if (supabaseError) throw supabaseError;

      // Réinitialisation du formulaire
      setFormData({
        title: "",
        description: "",
        price: "",
        contractType: "bug_bounty",
        tags: [],
      });
      setShowNewBountyForm(false);
      alert("Contrat créé avec succès !");
    } catch (error: any) {
      console.error("Erreur:", error);
      setError(error.message || "Erreur lors de la création du contrat");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveSubmit = async (submit: Submit, contractHash: string) => {
    setIsLoading(true);
    setError(null);
    try {
      if (typeof window.ethereum === "undefined") {
        throw new Error("MetaMask n'est pas installé !");
      }

      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        contractAddress,
        BugBountyPlatformABI,
        signer
      );

      // Approuver le claim sur le smart contract
      const transaction = await contract.approveClaim();
      await transaction.wait();

      // TODO: Update Supabase to reflect approval

      alert("Claim approved successfully!");
    } catch (error: any) {
      console.error("Erreur:", error);
      setError(error.message || "Erreur lors de l'approbation du claim");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectSubmit = async (submit: Submit, contractHash: string) => {
    setIsLoading(true);
    setError(null);
    try {
      if (typeof window.ethereum === "undefined") {
        throw new Error("MetaMask n'est pas installé !");
      }

      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        contractAddress,
        BugBountyPlatformABI,
        signer
      );

      // Rejeter le claim sur le smart contract
      const transaction = await contract.rejectClaim();
      await transaction.wait();

      // TODO: Update Supabase to reflect rejection

      alert("Claim rejected successfully!");
    } catch (error: any) {
      console.error("Erreur:", error);
      setError(error.message || "Erreur lors du rejet du claim");
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
          value={formData.title}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
          placeholder="Enter a descriptive title"
          maxLength={255}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="Describe the bug or vulnerability in detail"
        />
      </div>
      <div className="form-group">
        <label htmlFor="price">Reward Amount (ETH)</label>
        <input
          id="price"
          type="number"
          value={formData.price}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, price: e.target.value }))
          }
          placeholder="Enter the bounty reward"
          required
          step="0.000001"
        />
      </div>
      <div className="form-group">
        <label htmlFor="contractType">Contract Type</label>
        <select
          id="contractType"
          value={formData.contractType}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, contractType: e.target.value }))
          }
        >
          <option value="bug_bounty">Bug Bounty</option>
          <option value="security_audit">Security Audit</option>
          <option value="code_review">Code Review</option>
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="tags">Tags</label>
        <div className="tags-input-container">
          <input
            id="tags"
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Add tags"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="add-tag-button"
          >
            Add Tag
          </button>
        </div>
        <div className="tags-container">
          {formData.tags.map((tag, index) => (
            <span key={index} className="tag">
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="remove-tag"
              >
                ×
              </button>
            </span>
          ))}
        </div>
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

  const renderSubmits = (contractHash: string) => {
    const contractSubmits = submits[contractHash] || [];
    return (
      <div className="submits-container">
        <h4>Submissions ({contractSubmits.length})</h4>
        {contractSubmits.map((submit, index) => (
          <div key={index} className="submit-item">
            <p className="submit-description">{submit.description}</p>
            <div className="submit-meta">
              <span className="submitter">{submit.submitter_address}</span>
              <span className="submit-date">
                {new Date(submit.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="submit-actions">
              <button
                className="approve-button"
                onClick={() => handleApproveSubmit(submit, contractHash)}
                disabled={isLoading}
              >
                {isLoading ? "Approving..." : "Approve"}
              </button>
              <button
                className="reject-button"
                onClick={() => handleRejectSubmit(submit, contractHash)}
                disabled={isLoading}
              >
                {isLoading ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderBountiesList = () => (
    <div className="ads-grid">
      {contracts.map((contract) => (
        <div key={contract.id} className="ad-card">
          <h4>{contract.title}</h4>
          <p>{contract.description}</p>
          <p className="price">{contract.amount} ETH</p>
          <div className="contract-tags">
            {contract.tags?.map((tag, index) => (
              <span key={index} className="tag">
                {tag}
              </span>
            ))}
          </div>
          <div className="contract-details">
            <p className="contract-type">{contract.contract_type}</p>
            <p className="date">
              {new Date(contract.created_at).toLocaleDateString()}
            </p>
          </div>
          <a
            href={`https://sepolia.etherscan.io/tx/${contract.transaction_hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="transaction-link"
          >
            View Transaction
          </a>
          <button
            className="view-submits-button"
            onClick={() =>
              setSelectedContract(
                selectedContract === contract.transaction_hash
                  ? null
                  : contract.transaction_hash
              )
            }
          >
            {selectedContract === contract.transaction_hash
              ? "Hide Submissions"
              : "View Submissions"}
          </button>
          {selectedContract === contract.transaction_hash &&
            renderSubmits(contract.transaction_hash)}
        </div>
      ))}
    </div>
  );

  const renderActiveSubmissions = () => (
    <div className="active-submissions-container">
      <h4>My Active Submissions ({userSubmits.length})</h4>
      {userSubmits.length > 0 ? (
        userSubmits.map((submit, index) => (
          <div key={index} className="submit-item">
            <p className="submit-description">{submit.description}</p>
            <div className="submit-meta">
              <span className="submit-date">
                {new Date(submit.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))
      ) : (
        <p>No active submissions yet.</p>
      )}
    </div>
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
            {renderBountiesList()}
          </div>
        );
      case "submissions":
        return (
          <div className="user-submissions">
            <h3>Active Submissions</h3>
            {renderActiveSubmissions()}
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
