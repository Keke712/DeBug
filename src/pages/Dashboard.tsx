import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { ethers } from "ethers";
import { useNavigate } from "react-router-dom";
import BountyFactoryABI from "../contracts/BountyFactoryABI.json";
import BountyLogicABI from "../contracts/BountyDepositLogic.json";
import ReportFactoryABI from "../contracts/ReportFactory.json";
import BugReportLogicABI from "../contracts/BugReportLogic.json";
import { bytes32ToString } from "../utils/web3Utils";
import {
  BOUNTY_FACTORY_ADDRESS,
  REPORT_FACTORY_ADDRESS,
} from "../constants/addresses";

// Ajouter l'import du fichier CSS
import "../styles/Dashboard.css";
import Toast from "../components/Toast";
import LoadingSpinner from "../components/LoadingSpinner";

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
  const [deniedReports, setDeniedReports] = useState<any[]>([]);
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const navigate = useNavigate();

  // Supprimer le useEffect général qui charge tout
  useEffect(() => {
    // Vérifier s'il y a un message de création de bounty
    const message = localStorage.getItem("bountyCreatedMessage");
    if (message) {
      setToastMessage(message);
      setShowToast(true);
      localStorage.removeItem("bountyCreatedMessage");
    }
  }, []);

  // Ajouter un useEffect qui réagit aux changements d'onglets
  useEffect(() => {
    const loadTabData = async () => {
      switch (activeView) {
        case "dashboard":
          await loadUserContracts();
          break;
        case "bounties":
          await loadUserContracts();
          break;
        case "submissions":
          await loadUserSubmissions();
          break;
        case "public":
          await loadDeniedReports();
          break;
        // Les autres onglets n'ont pas besoin de chargement initial
      }
    };

    loadTabData();
  }, [activeView]);

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
          title: bytes32ToString(metadata[0]), // Convert bytes32 to string
          description: bytes32ToString(metadata[1]), // Convert bytes32 to string
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
            description: bytes32ToString(description), // Convert bytes32 to string
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
            description: bytes32ToString(description), // Convert bytes32 to string
            status: ["Pending", "Confirmed", "Rejected"][status],
            bountyTitle: bytes32ToString(metadata[0]), // Convert bytes32 to string
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

  // Dans le composant Dashboard, ajoutez cette fonction après calculateStats
  const calculateReportStats = () => {
    const totalSubmitted = userSubmissions.length;
    const acceptedSubmissions = userSubmissions.filter(
      (submission) => submission.status === "Confirmed"
    ).length;
    // Nous supposons que chaque bounty acceptée rapporte le montant spécifié
    const totalEarned = "N/A"; // Cette valeur devrait être calculée à partir des récompenses réelles

    return {
      totalSubmitted,
      acceptedSubmissions,
      totalEarned,
    };
  };

  // Ajouter cette nouvelle fonction pour charger les rapports refusés
  const loadDeniedReports = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const reportFactory = new ethers.Contract(
        REPORT_FACTORY_ADDRESS,
        ReportFactoryABI,
        provider
      );

      // Charger tous les événements de création de rapports
      const filter = reportFactory.filters.ReportCreated();
      const events = await reportFactory.queryFilter(filter);

      const reportPromises = events.map(async (event: any) => {
        const [reportAddress] = event.args;

        const reportContract = new ethers.Contract(
          reportAddress,
          BugReportLogicABI,
          provider
        );

        const [description, status, reporter, bountyAddr] = await Promise.all([
          reportContract.getDescription(),
          reportContract.getStatus(),
          reportContract.getReporter(),
          reportContract.bountyContract(),
        ]);

        // Ne retourner que si le statut est CANCELED (2)
        if (status !== 2) return null;

        // Obtenir les détails du bounty
        const bountyContract = new ethers.Contract(
          bountyAddr,
          BountyLogicABI,
          provider
        );
        const metadata = await bountyContract.getBountyMetadata();

        return {
          id: reportAddress,
          description: bytes32ToString(description), // Convert bytes32 to string
          reporter,
          bountyTitle: bytes32ToString(metadata[0]), // Convert bytes32 to string
          bountyAddress: bountyAddr,
          created_at: new Date(event.block.timestamp * 1000).toISOString(),
        };
      });

      const resolvedReports = (await Promise.all(reportPromises)).filter(
        (report): report is any => report !== null
      );
      setDeniedReports(resolvedReports);
    } catch (error: any) {
      console.error("Error loading denied reports:", error);
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
                <div className="stat-value">{stats.totalBounties || 0}</div>
                <div className="stat-label">Total Bounties</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.totalAmount || "0.000"} ETH</div>
                <div className="stat-label">Total Amount Invested</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.activeBounties || 0}</div>
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

            <div className="report-stats">
              <div className="report-stat-card">
                <div className="report-stat-value">
                  {calculateReportStats().totalSubmitted || 0}
                </div>
                <div className="report-stat-label">Total Reports Submitted</div>
              </div>
              <div className="report-stat-card">
                <div className="report-stat-value">
                  {calculateReportStats().acceptedSubmissions || 0}
                </div>
                <div className="report-stat-label">Reports Accepted</div>
              </div>
              <div className="report-stat-card">
                <div className="report-stat-value">
                  {calculateReportStats().totalEarned || "0.000 ETH"}
                </div>
                <div className="report-stat-label">Total ETH Earned</div>
              </div>
            </div>

            <div className="browse-bounties-card">
              <div className="create-bounty-text">
                <h3>Browse Active Bounties</h3>
                <p>Find and report vulnerabilities to earn rewards</p>
              </div>
              <button
                onClick={() => navigate("/browse")}
                className="browse-button"
              >
                Browse bounties
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
            {userContracts.length > 0 ? (
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
            ) : (
              <div className="no-bounties-message">
                <p>You haven't created any bug bounties yet.</p>
                <button
                  onClick={() => navigate("/create-bounty")}
                  className="new-bounty-button"
                >
                  Create your first bounty
                </button>
              </div>
            )}
          </div>
        );
      case "submissions":
        if (!userSubmissions.length) {
          return (
            <div className="user-submissions">
              <div className="dashboard-header">
                <h3>Active Submissions</h3>
              </div>
              <LoadingSpinner />
            </div>
          );
        }
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
      case "public":
        return (
          <div className="public-content">
            <div className="dashboard-header">
              <h3>Public Activity</h3>
            </div>
            <div className="public-stats">
              <div className="stat-card">
                <div className="stat-value">{userContracts.length}</div>
                <div className="stat-label">Open Bounties</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{deniedReports.length}</div>
                <div className="stat-label">Denied Reports</div>
              </div>
            </div>
            <div className="public-activity">
              <h4>Recently Denied Reports</h4>
              <table className="bounties-table">
                <thead>
                  <tr>
                    <th>Bounty Title</th>
                    <th>Description</th>
                    <th>Reporter</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {deniedReports.map((report) => (
                    <tr key={report.id}>
                      <td>{report.bountyTitle}</td>
                      <td>{report.description.slice(0, 50)}...</td>
                      <td>
                        {report.reporter.slice(0, 6)}...
                        {report.reporter.slice(-4)}
                      </td>
                      <td>
                        {new Date(report.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {deniedReports.length === 0 && (
                <p className="no-data">No denied reports found</p>
              )}
            </div>
          </div>
        );
      case "developers":
        return (
          <div className="developers-content">
            <div className="dashboard-header">
              <h3>Developers Resources</h3>
            </div>
            <div className="contracts-info">
              <div className="contract-card">
                <h4>Bounty Factory</h4>
                <p>Contract that manages the creation of new bug bounties</p>
                <a
                  href={`https://sepolia.etherscan.io/address/${BOUNTY_FACTORY_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="etherscan-link"
                >
                  View on Etherscan
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>
              <div className="contract-card">
                <h4>Report Factory</h4>
                <p>Contract that manages the creation of bug reports</p>
                <a
                  href={`https://sepolia.etherscan.io/address/${REPORT_FACTORY_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="etherscan-link"
                >
                  View on Etherscan
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>
            </div>
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
