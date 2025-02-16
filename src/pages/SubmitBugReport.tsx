import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { REPORT_FACTORY_ADDRESS } from "../constants/addresses";
import ReportFactoryABI from "../contracts/ReportFactory.json";
import BountyLogicABI from "../contracts/BountyDepositLogic.json";
import "../styles/SubmitBugReport.css";

interface Contract {
  id: string;
  title: string;
  description: string;
  amount: string;
  wallet_address: string;
}

const SubmitBugReport = () => {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

  useEffect(() => {
    const fetchContractDetails = async () => {
      try {
        if (!window.ethereum || !contractId) return;

        // Validation de l'adresse du contrat
        if (!ethers.isAddress(contractId.trim())) {
          throw new Error("Invalid contract address format");
        }

        const cleanContractId = contractId.trim();

        const provider = new ethers.BrowserProvider(window.ethereum as any);
        const bountyContract = new ethers.Contract(
          cleanContractId,
          BountyLogicABI,
          provider
        );

        // Utiliser getBountyMetadata au lieu des appels individuels
        const [metadata, contractBalance] = await Promise.all([
          bountyContract.getBountyMetadata(),
          bountyContract.getContractBalance(),
        ]);

        setContract({
          id: cleanContractId,
          title: metadata[0], // Le titre est le premier élément retourné
          description: metadata[1], // La description est le deuxième élément
          amount: ethers.formatEther(contractBalance),
          wallet_address: await bountyContract.companyAddress(), // Utiliser la variable publique companyAddress
        });
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchContractDetails();
  }, [contractId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not installed!");
      }

      // Nettoyer et valider l'ID du contrat
      if (!contractId || !ethers.isAddress(contractId.trim())) {
        throw new Error("Invalid contract address");
      }

      const cleanContractId = contractId.trim();

      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();

      const reportFactory = new ethers.Contract(
        REPORT_FACTORY_ADDRESS,
        ReportFactoryABI,
        signer
      );

      const tx = await reportFactory.createReport(cleanContractId, description);
      await tx.wait();

      navigate(-1);
    } catch (err: any) {
      console.error("Submit error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="submit-report-container">
      {contract && (
        <div className="contract-info">
          <h2>Submit Bug Report</h2>
          <div className="contract-details">
            <p>
              <strong>Contract ID:</strong>
              <span>{contract.id}</span>
            </p>
            <p>
              <strong>Title:</strong>
              <span>{contract.title}</span>
            </p>
            <p>
              <strong>Reward:</strong>
              <span>{contract.amount} ETH</span>
            </p>
            <p>
              <strong>Owner:</strong>
              <span>{contract.wallet_address}</span>
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="submit-form">
        <div className="form-group">
          <label htmlFor="description">Bug Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the bug you found..."
            required
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        <button type="submit" disabled={isLoading} className="submit-button">
          {isLoading ? "Submitting..." : "Submit Report"}
        </button>
      </form>
    </div>
  );
};

export default SubmitBugReport;
