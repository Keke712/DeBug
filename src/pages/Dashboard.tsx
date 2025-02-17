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
import Toast from "../components/Toast";

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
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [userSubmissions, setUserSubmissions] = useState<any[]>([]);
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const navigate = useNavigate();

  // Ajoutez cette fonction pour charger les contrats
  useEffect(() => {
    loadUserContracts();
    loadUserSubmissions();
  }, [currentUser]);

  useEffect(() => {
    // Vérifier s'il y a un message de création de bounty
    const message = localStorage.getItem("bountyCreatedMessage");
    if (message) {
      setToastMessage(message);
      setShowToast(true);
      localStorage.removeItem("bountyCreatedMessage"); // Nettoyer le message
    }
  }, []);

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

        // Obtenir le nombre de rapports pour ce contrat
        const reportFactory = new ethers.Contract(
          REPORT_FACTORY_ADDRESS,
          ReportFactoryABI,
          provider
        );
        const reports = await reportFactory.getReportsByBounty(bountyAddress);

        // Utiliser getBountyMetadata au lieu des appels individuels
        const [metadata] = await Promise.all([
          bountyContract.getBountyMetadata(),
        ]);

        return {
          id: bountyAddress,
          title: metadata[0], // Le titre est le premier élément
          description: metadata[1], // La description est le deuxième élément
          amount: ethers.formatEther(amount),
          status: "Active", // Changé de "active" à "Active"
          transaction_hash: event.transactionHash,
          created_at: new Date().toISOString(),
          submissionCount: reports.length, // Ajout du nombre de soumissions
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

  // Ajouter ces fonctions pour calculer les statistiques
  const calculateStats = () => {
    const totalBounties = userContracts.length;
    const totalAmount = userContracts.reduce(
      (sum, contract) => sum + parseFloat(contract.amount),
      0
    );
    const activeBounties = userContracts.filter(
      (contract) => contract.status === "Active" // Changé de "active" à "Active"
    ).length;

    return {
      totalBounties,
      totalAmount: totalAmount.toFixed(3),
      activeBounties,
    };
  };

  // Ajouter cette nouvelle fonction pour charger les soumissions de l'utilisateur
  const loadUserSubmissions = async () => {
    try {
      if (!window.ethereum || !currentUser?.address) {
        throw new Error("MetaMask not connected!");
      }

      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const reportFactory = new ethers.Contract(
        REPORT_FACTORY_ADDRESS,
        ReportFactoryABI,
        provider
      );

      // Get all reports submitted by the current user
      const userReports = await reportFactory.getReportsByReporter(
        currentUser.address
      );

      const submissionPromises = userReports.map(
        async (reportAddress: string) => {
          const reportContract = new ethers.Contract(
            reportAddress,
            BugReportLogicABI,
            provider
          );

          const [description, status, bountyAddr] = await Promise.all([
            reportContract.getDescription(),
            reportContract.getStatus(),
            reportContract.bountyContract(), // Utiliser la propriété publique au lieu d'une fonction
          ]);

          // Get bounty details
          const bountyContract = new ethers.Contract(
            bountyAddr,
            BountyLogicABI,
            provider
          );
          const metadata = await bountyContract.getBountyMetadata();

          return {
            id: reportAddress,
            description,
            status: ["Pending", "Confirmed", "Rejected"][status],
            bountyTitle: metadata[0],
            bountyAddress: bountyAddr,
            created_at: new Date().toISOString(),
          };
        }
      );

      const resolvedSubmissions = await Promise.all(submissionPromises);
      setUserSubmissions(resolvedSubmissions);
    } catch (error: any) {
      console.error("Error loading user submissions:", error);
      setError(error.message);
    }
  };

  // Modifier le case "dashboard" dans renderContent
  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        const stats = calculateStats();
        return (
          <div className="dashboard-overview">
            <div className="dashboard-header">
              <div>
                <h2>Dashboard Overview</h2>
                <p className="user-info">
                  Connected Address: {currentUser?.address}
                </p>
              </div>
            </div>
            {error && <div className="error-message">{error}</div>}

            <div className="dashboard-stats">
              <div className="stat-card">
                <div className="stat-value">{stats.totalBounties}</div>
                <div className="stat-label">Total Bounties</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.totalAmount} ETH</div>
                <div className="stat-label">Total Amount Invested</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.activeBounties}</div>
                <div className="stat-label">Active Bounties</div>
              </div>
            </div>

            <div className="create-bounty-card">
              <div className="create-bounty-text">
                <h3>Create New Bug Bounty</h3>
                <p>Start securing your smart contracts today</p>
              </div>
              <button
                onClick={() => navigate("/create-bounty")}
                className="new-bounty-button"
              >
                Create a new contract
              </button>
            </div>
          </div>
        );

      case "bounties":
        return (
          <div className="user-ads">
            <div className="dashboard-header">
              <h3>My Bug Bounties</h3>
            </div>
            <table className="bounties-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Reward</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Contract</th>
                  <th>Reports</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {userContracts.map((contract) => (
                  <tr key={contract.id}>
                    <td>{contract.title}</td>
                    <td>{contract.amount} ETH</td>
                    <td>
                      <span
                        className={`status-badge ${contract.status.toLowerCase()}`}
                      >
                        {contract.status}
                      </span>
                    </td>
                    <td>
                      {new Date(contract.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      {contract.transaction_hash.slice(0, 8)}...
                      {contract.transaction_hash.slice(-6)}
                    </td>
                    <td>{contract.submissionCount}</td>
                    <td>
                      <button
                        onClick={() =>
                          navigate(`/bounty-reports/${contract.id}`)
                        }
                        className="view-reports-button"
                      >
                        View Reports
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {expandedContract && submissions.length > 0 && (
              <div className="submissions-dropdown">
                {submissions.map(renderSubmission)}
              </div>
            )}
            {expandedContract && submissions.length === 0 && (
              <div className="no-submissions">No submissions yet</div>
            )}
          </div>
        );
      case "submissions":
        return (
          <div className="user-submissions">
            <div className="dashboard-header">
              <h3>Active Submissions</h3>
            </div>
            <table className="bounties-table">
              <thead>
                <tr>
                  <th>Bounty Title</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Submitted On</th>
                  <th>Contract</th>
                </tr>
              </thead>
              <tbody>
                {userSubmissions.map((submission) => (
                  <tr key={submission.id}>
                    <td>{submission.bountyTitle}</td>
                    <td>{submission.description.slice(0, 50)}...</td>
                    <td>
                      <span
                        className={`status-badge ${submission.status.toLowerCase()}`}
                      >
                        {submission.status}
                      </span>
                    </td>
                    <td>
                      {new Date(submission.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      {submission.bountyAddress.slice(0, 8)}...
                      {submission.bountyAddress.slice(-6)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {userSubmissions.length === 0 && (
              <div className="no-submissions">No submissions found</div>
            )}
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
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
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
