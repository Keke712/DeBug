import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import BountyCard from "../components/BountyCard";
import LoadingSpinner from "../components/LoadingSpinner";
import BountyFactoryABI from "../contracts/BountyFactoryABI.json";
import BountyLogicABI from "../contracts/BountyDepositLogic.json";
import { BOUNTY_FACTORY_ADDRESS } from "../constants/addresses";
import "../styles/Browse.css";

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
  contract_address: string;
  website: string;
}

const Browse = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null
  );
  const [isGridView, setIsGridView] = useState(true);
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        if (!window.ethereum) {
          throw new Error("MetaMask not installed!");
        }

        const provider = new ethers.BrowserProvider(window.ethereum as any);
        const factory = new ethers.Contract(
          BOUNTY_FACTORY_ADDRESS,
          BountyFactoryABI,
          provider
        );

        const filter = factory.filters.BountyCreated();
        const events = await factory.queryFilter(filter);

        const contractPromises = events.map(async (event) => {
          const [bountyAddress, company, amount] = (event as ethers.EventLog)
            .args as unknown as [string, string, bigint];

          if (company.toLowerCase() === currentUser.address.toLowerCase()) {
            return null;
          }

          const bountyContract = new ethers.Contract(
            bountyAddress,
            BountyLogicABI,
            provider
          );

          // Utilisation de getBountyMetadata au lieu de getTitle et getDescription
          const [title, description, tags, website] =
            await bountyContract.getBountyMetadata();

          return {
            id: bountyAddress,
            title,
            description,
            amount: ethers.formatEther(amount),
            created_at: new Date().toISOString(),
            transaction_hash: event.transactionHash,
            contract_type: "bug_bounty",
            tags, // Utilisation des tags du contrat
            wallet_address: company,
            contract_address: bountyAddress,
            website, // Ajout du website aux données du contrat
          };
        });

        const resolvedContracts = (await Promise.all(contractPromises)).filter(
          (contract): contract is Contract => contract !== null
        );
        setContracts(resolvedContracts);
      } catch (err: any) {
        console.error("Erreur lors du chargement des contrats:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContracts();
  }, [currentUser.address]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="browse-container">
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setIsGridView(!isGridView)}
          className="view-switch-button"
          title={isGridView ? "Switch to List View" : "Switch to Grid View"}
        >
          <div className="view-switch-icons">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={isGridView ? "active" : ""}
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <div className="view-switch-separator"></div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={!isGridView ? "active" : ""}
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </div>
        </button>
      </div>

      {isGridView ? (
        <div className="browse-grid">
          {contracts.map((contract) => (
            <div key={contract.id} className="w-full">
              <BountyCard contract={contract} isListView={false} />
            </div>
          ))}
        </div>
      ) : (
        <div className="browse-list">
          {contracts.map((contract) => (
            <BountyCard
              key={contract.id}
              contract={contract}
              isListView={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Browse;
