import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { ethers } from "ethers";
import { useNavigate } from "react-router-dom";
import BountyFactoryABI from "../contracts/BountyFactoryABI.json";
import BountyLogicABI from "../contracts/BountyDepositLogic.json";
import ReportFactoryABI from "../contracts/ReportFactory.json";
import BugReportLogicABI from "../contracts/BugReportLogic.json";
import {
  BOUNTY_FACTORY_ADDRESS,
  REPORT_FACTORY_ADDRESS,
} from "../constants/addresses";

// Ajouter l'import du fichier CSS
import "../styles/Dashboard.css";

interface Submit {
  id: number;
  contract_id: number;
  description: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  wallet_address: string;
  contract?: {
    id: number;
    title: string;
    description: string;
    amount: number;
    status: string;
  };
}

const Dashboard = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const [error, setError] = useState<string | null>(null);
  const [userContracts, setUserContracts] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<Submit[]>([]);
  const [expandedContract, setExpandedContract] = useState<number | null>(null);
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const navigate = useNavigate();

  // Ajoutez cette fonction pour charger les contrats
  useEffect(() => {
    loadUserContracts();
  }, [currentUser]);

  const loadUserContracts = async () => {
    try {
      if (!window.ethereum) throw new Error("MetaMask not installed!");

      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const factory = new ethers.Contract(
        BOUNTY_FACTORY_ADDRESS,
        BountyFactoryABI,
        provider
      );

      const filter = factory.filters.BountyCreated(null, currentUser?.address);
      const events = await factory.queryFilter(filter);

      const contractPromises = events.map(async (event) => {
        const [bountyAddress, creator, amount] = (event as ethers.EventLog)
          .args;
        const bountyContract = new ethers.Contract(
          bountyAddress,
          BountyLogicABI,
          provider
        );

        // Utiliser getBountyMetadata au lieu des appels individuels
        const [metadata] = await Promise.all([
          bountyContract.getBountyMetadata(),
        ]);

        return {
          id: bountyAddress,
          title: metadata[0], // Le titre est le premier élément
          description: metadata[1], // La description est le deuxième élément
          amount: ethers.formatEther(amount),
          status: "active",
          transaction_hash: event.transactionHash,
          created_at: new Date().toISOString(),
        };
      });

      const resolvedContracts = await Promise.all(contractPromises);
      setUserContracts(resolvedContracts);
    } catch (error: any) {
      console.error("Error loading contracts:", error.message);
      setError(error.message);
    }
  };

  // Fonction pour charger les soumissions d'un contrat
  const loadSubmissions = async (contractId: string) => {
    try {
      // Nettoyer l'ID du contrat pour s'assurer qu'il est au bon format
      const cleanContractId = contractId.trim();
      if (!ethers.isAddress(cleanContractId)) {
        throw new Error("Invalid contract address");
      }

      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const reportFactory = new ethers.Contract(
        REPORT_FACTORY_ADDRESS,
        ReportFactoryABI,
        provider
      );

      // Utiliser l'ID nettoyé
      const reports = await reportFactory.getReportsByBounty(cleanContractId);

      // Récupération des détails de chaque rapport
      const reportsDetails = await Promise.all(
        reports.map(async (reportAddress: string) => {
          const reportContract = new ethers.Contract(
            reportAddress,
            BugReportLogicABI,
            provider
          );

          const [description, status, reporter] = await Promise.all([
            reportContract.getDescription(),
            reportContract.getStatus(),
            reportContract.getReporter(),
          ]);

          return {
            id: reportAddress,
            description,
            status: ["PENDING", "CONFIRMED", "CANCELED"][status],
            reporter,
            contract_id: contractId,
          };
        })
      );

      setSubmissions(reportsDetails);
    } catch (error: any) {
      console.error("Error loading reports:", error);
      setError(error.message);
    }
  };

  // Fonction pour gérer la validation d'une soumission
  const handleAcceptSubmission = async (submission: any) => {
    try {
      if (!window.ethereum) throw new Error("MetaMask not installed!");

      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();

      const reportContract = new ethers.Contract(
        submission.id,
        BugReportLogicABI,
        signer
      );

      const tx = await reportContract.confirmReport({
        value: ethers.parseEther(submission.bountyAmount),
      });
      await tx.wait();

      await loadSubmissions(submission.contract_id);
      alert("Bug bounty accepted and reward released!");
    } catch (error: any) {
      console.error("Error accepting submission:", error);
      setError(error.message);
    }
  };

  // Fonction pour rejeter une soumission
  const handleRejectSubmission = async (submission: any) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();

      const reportContract = new ethers.Contract(
        submission.id,
        BugReportLogicABI,
        signer
      );

      const tx = await reportContract.cancelReport();
      await tx.wait();

      await loadSubmissions(submission.contract_id);
      alert("Bug report rejected");
    } catch (error: any) {
      console.error("Error rejecting submission:", error);
      setError(error.message);
    }
  };

  const renderSubmission = (submit: Submit) => (
    <div key={submit.id} className="submission-item">
      <div className="submission-header">
        <span className="submission-status">{submit.status}</span>
      </div>
      <div className="submission-content">
        <p>{submit.description}</p>
        <p className="submission-date">
          Submitted on: {new Date(submit.created_at).toLocaleDateString()}
        </p>
      </div>
      {submit.status === "pending" && (
        <div className="submission-actions">
          <button
            onClick={() => handleAcceptSubmission(submit)}
            className="accept-button"
          >
            Accept
          </button>
          <button
            onClick={() => handleRejectSubmission(submit)}
            className="reject-button"
          >
            Deny
          </button>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <>
                        <h2>Dashboard Overview</h2>           {" "}
            <div className="user-info">
                            <p>Connected Address: {currentUser?.address}</p>   
                     {" "}
            </div>
                        {error && <div className="error-message">{error}</div>} 
                   {" "}
          </>
        );
      case "bounties":
        return (
          <div className="user-ads">
            <div className="bounties-header">
              <h3>My Bug Bounties</h3>
              <button
                onClick={() => navigate("/create-bounty")}
                className="new-bounty-button"
              >
                Create a new contract
              </button>
            </div>
            <div className="ads-list">
              {userContracts.map((contract) => (
                <div key={contract.id} className="ad-item">
                  <div className="ad-header">
                    <h4 className="ad-title">{contract.title}</h4>
                    <span className="ad-amount">{contract.amount} ETH</span>
                  </div>
                  <p className="ad-description">{contract.description}</p>
                  <div className="ad-details">
                    <span>
                      Created:{" "}
                      {new Date(contract.created_at).toLocaleDateString()}
                    </span>
                    <span
                      className={`ad-status ${contract.status.toLowerCase()}`}
                    >
                      {contract.status}
                    </span>
                  </div>
                  <div className="ad-contract">
                    Contract: {contract.transaction_hash.slice(0, 8)}...
                    {contract.transaction_hash.slice(-6)}
                  </div>
                  <button
                    onClick={() => {
                      if (expandedContract === contract.id) {
                        setExpandedContract(null);
                      } else {
                        setExpandedContract(contract.id);
                        if (
                          typeof contract.id === "string" &&
                          ethers.isAddress(contract.id)
                        ) {
                          loadSubmissions(contract.id);
                        } else {
                          setError("Invalid contract address format");
                        }
                      }
                    }}
                    className="view-submissions-button"
                  >
                    {expandedContract === contract.id
                      ? "Hide Submissions"
                      : "View Submissions"}
                  </button>
                  {expandedContract === contract.id &&
                    submissions.length > 0 && (
                      <div className="submissions-dropdown">
                        {submissions.map(renderSubmission)}
                      </div>
                    )}
                  {expandedContract === contract.id &&
                    submissions.length === 0 && (
                      <div className="no-submissions">No submissions yet</div>
                    )}
                </div>
              ))}
            </div>
          </div>
        );
      case "submissions":
        return (
          <div>
                        <h3>Active Submissions</h3>           {" "}
            <p>No active submissions yet.</p>         {" "}
          </div>
        );
      case "settings":
        return (
          <div>
                        <h3>Settings</h3>           {" "}
            <p>Account settings will be available soon.</p>         {" "}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-layout">
            <Sidebar onViewChange={setActiveView} activeView={activeView} />   
       {" "}
      <div className="dashboard-content">
                <div className="dashboard-container">{renderContent()}</div>   
         {" "}
      </div>
         {" "}
    </div>
  );
};

export default Dashboard;
