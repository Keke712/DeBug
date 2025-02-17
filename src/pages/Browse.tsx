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
  const [amountFilter, setAmountFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [hasWebsiteFilter, setHasWebsiteFilter] = useState(false);
  const [reputationFilter, setReputationFilter] = useState("all");
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

  const getAllUniqueTags = () => {
    const tags = new Set<string>();
    contracts.forEach((contract) => {
      contract.tags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags);
  };

  const filteredContracts = contracts.filter((contract) => {
    let passesFilters = true;

    if (amountFilter !== "all") {
      const amount = parseFloat(contract.amount);
      switch (amountFilter) {
        case "0-1":
          passesFilters = amount <= 1;
          break;
        case "1-5":
          passesFilters = amount > 1 && amount <= 5;
          break;
        case "5+":
          passesFilters = amount > 5;
          break;
      }
    }

    if (dateFilter !== "all") {
      const createdDate = new Date(contract.created_at);
      const now = new Date();
      const daysDiff =
        (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);

      switch (dateFilter) {
        case "today":
          passesFilters = passesFilters && daysDiff <= 1;
          break;
        case "week":
          passesFilters = passesFilters && daysDiff <= 7;
          break;
        case "month":
          passesFilters = passesFilters && daysDiff <= 30;
          break;
      }
    }

    if (tagFilter !== "all") {
      passesFilters = passesFilters && contract.tags.includes(tagFilter);
    }

    if (hasWebsiteFilter) {
      passesFilters = passesFilters && Boolean(contract.website);
    }

    if (reputationFilter !== "all") {
      // Cette logique sera implémentée quand la feature de réputation sera disponible
      // Pour l'instant, on laisse passer tous les contrats
    }

    return passesFilters;
  });

  const renderStars = (count: number) => {
    return "★".repeat(count) + "☆".repeat(5 - count);
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="browse-container">
      <div className="browse-header">
        <div className="filters-container">
          <select
            className="filter-select"
            value={amountFilter}
            onChange={(e) => setAmountFilter(e.target.value)}
          >
            <option value="all">All Amounts</option>
            <option value="0-1">0-1 ETH</option>
            <option value="1-5">1-5 ETH</option>
            <option value="5+">5+ ETH</option>
          </select>

          <select
            className="filter-select"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          <select
            className="filter-select"
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
          >
            <option value="all">All Tags</option>
            {getAllUniqueTags().map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={reputationFilter}
            onChange={(e) => setReputationFilter(e.target.value)}
          >
            <option value="all">All Ratings</option>
            <option value="5">
              <span className="rating-option">
                <span className="rating-star">{renderStars(5)}</span>
                <span className="rating-text">Only</span>
              </span>
            </option>
            <option value="4">
              <span className="rating-option">
                <span className="rating-star">{renderStars(4)}</span>
                <span className="rating-text">& up</span>
              </span>
            </option>
            <option value="3">
              <span className="rating-option">
                <span className="rating-star">{renderStars(3)}</span>
                <span className="rating-text">& up</span>
              </span>
            </option>
          </select>

          <label className="website-filter">
            <input
              type="checkbox"
              checked={hasWebsiteFilter}
              onChange={(e) => setHasWebsiteFilter(e.target.checked)}
            />
            <div className="toggle-switch"></div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </label>
        </div>

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
          {filteredContracts.map((contract) => (
            <div key={contract.id} className="w-full">
              <BountyCard contract={contract} isListView={false} />
            </div>
          ))}
        </div>
      ) : (
        <div className="browse-list">
          {filteredContracts.map((contract) => (
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
