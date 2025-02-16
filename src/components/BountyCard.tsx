import React from "react";
import "../styles/BountyCard.css";

interface BountyCardProps {
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
    website: string;
  };
  isListView?: boolean;
}

const BountyCard: React.FC<BountyCardProps> = ({
  contract,
  isListView = false,
}) => {
  return (
    <div className={`bounty-card ${isListView ? "list-view" : ""}`}>
      {!isListView && (
        <div className="reward-badge">
          <span>{contract.amount} ETH</span>
        </div>
      )}

      <div className="bounty-header">
        <div className="title-burst">
          <h2>{contract.title}</h2>
        </div>
        {isListView && (
          <div className="reward-badge">
            <span>{contract.amount} ETH</span>
          </div>
        )}
      </div>

      <div className="bounty-content">
        <div className="description-box">
          <p>{contract.description}</p>
        </div>

        <div className="tags-wrapper">
          {contract.tags?.map((tag, index) => (
            <span key={index} className="comic-tag">
              {tag}
            </span>
          ))}
        </div>

        <div className="bounty-footer">
          <a
            href={`https://sepolia.etherscan.io/tx/${contract.transaction_hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="action-button etherscan"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 6H6C4.89543 6 4 6.89543 4 8V18C4 19.1046 4.89543 20 6 20H16C17.1046 20 18 19.1046 18 18V14M14 4H20M20 4V10M20 4L10 14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Etherscan
          </a>
          {contract.website && (
            <a
              href={contract.website}
              target="_blank"
              rel="noopener noreferrer"
              className="action-button website"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3.6001 9H20.4001"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3.6001 15H20.4001"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 3C14.0683 5.35567 15.2075 8.29339 15.2001 11.33C15.2075 14.3666 14.0683 17.3043 12 19.66"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 3C9.93172 5.35567 8.79253 8.29339 8.7999 11.33C8.79253 14.3666 9.93172 17.3043 12 19.66"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Website
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default BountyCard;
