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
      // Ajouter le submit dans Supabase
      const { error: submitError } = await supabase.from("submits").insert([
        {
          contract_id: contract.id, // Lier le submit au contrat
          description: bugDescription,
          wallet_address: currentUser.address,
          status: "pending",
        },
      ]);

      if (submitError) throw submitError;

      alert("Bug report submitted successfully!");
      onClose();
    } catch (err: any) {
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
