import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import ContractModal from "../components/ContractModal";

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

const Browse = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null
  );
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const { data, error } = await supabase
          .from("contracts")
          .select("*")
          .neq("wallet_address", currentUser.address)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setContracts(data || []);
      } catch (err) {
        console.error("Erreur lors du chargement des contrats:", err);
        setError("Erreur lors du chargement des contrats");
      } finally {
        setIsLoading(false);
      }
    };

    fetchContracts();
  }, [currentUser.address]);

  if (isLoading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="browse-container">
      <h2>Available Bounties</h2>
      <div className="contracts-grid">
        {contracts.map((contract) => (
          <div key={contract.id} className="contract-card">
            <div className="contract-header">
              <h3>{contract.title}</h3>
              <span className="reward">{contract.amount} ETH</span>
            </div>
            <p className="description">{contract.description}</p>
            <div className="tags-container">
              {contract.tags?.map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                </span>
              ))}
            </div>
            <div className="contract-footer">
              <span className="contract-type">{contract.contract_type}</span>
              <span className="date">
                {new Date(contract.created_at).toLocaleDateString()}
              </span>
            </div>
            <a
              href={`https://sepolia.etherscan.io/tx/${contract.transaction_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="transaction-link"
            >
              View on Etherscan
            </a>
            <button
              className="view-details-button"
              onClick={() => setSelectedContract(contract)}
            >
              View Details & Submit Bug
            </button>
          </div>
        ))}
      </div>

      {selectedContract && (
        <ContractModal
          contract={selectedContract}
          onClose={() => setSelectedContract(null)}
        />
      )}
    </div>
  );
};

export default Browse;
