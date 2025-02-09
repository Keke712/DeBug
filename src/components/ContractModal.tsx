import React, { useState } from "react";
import { supabase } from "../supabase";

interface ContractModalProps {
  contract: {
    id: string;
    title: string;
    description: string;
    amount: string;
    contract_type: string;
    tags: string[];
    wallet_address: string;
    transaction_hash: string;
    created_at: string;
  };
  onClose: () => void;
}

interface Submit {
  contract_id: string;
  description: string;
  status: "pending" | "accepted" | "rejected";
  submitter_address: string; // Ajout du champ submitter_address
}

const ContractModal: React.FC<ContractModalProps> = ({ contract, onClose }) => {
  const [bugDescription, setBugDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

  const handleSubmitBug = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed!");
      }

      // Récupérer l'adresse MetaMask
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const submitterAddress = accounts[0];

      const { error: submitError } = await supabase.from("submits").insert([
        {
          contract_id: contract.id,
          description: bugDescription,
          status: "pending",
          submitter_address: submitterAddress,
        },
      ]);

      if (submitError) throw submitError;

      alert("Bug report submitted successfully!");
      onClose();
    } catch (err: any) {
      console.error("Submit error:", err);
      setError(err.message || "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>

        <div className="modal-header">
          <h2>{contract.title}</h2>
          <span className="bounty-amount">{contract.amount} ETH</span>
        </div>

        <div className="modal-body">
          <div className="contract-info">
            <h3>Description</h3>
            <p>{contract.description}</p>

            <div className="contract-meta">
              <div className="tags">
                {contract.tags?.map((tag, index) => (
                  <span key={index} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
              <span className="contract-type">{contract.contract_type}</span>
            </div>
          </div>

          <form onSubmit={handleSubmitBug} className="bug-submit-form">
            <h3>Submit a Bug</h3>
            <div className="form-group">
              <label htmlFor="bugDescription">Bug Description</label>
              <textarea
                id="bugDescription"
                value={bugDescription}
                onChange={(e) => setBugDescription(e.target.value)}
                placeholder="Describe the bug you found in detail..."
                required
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Bug Report"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContractModal;
