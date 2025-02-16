import React, { useState } from "react";
import { ethers } from "ethers";
import { useNavigate } from "react-router-dom";
import BountyFactoryABI from "../contracts/BountyFactoryABI.json";
import { BOUNTY_FACTORY_ADDRESS } from "../constants/addresses";
import "../styles/CreateBounty.css";

const CreateBounty = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [website, setWebsite] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not installed!");
      }

      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();

      const factory = new ethers.Contract(
        BOUNTY_FACTORY_ADDRESS,
        BountyFactoryABI,
        signer
      );

      const bountyAmount = ethers.parseEther(price);
      const tx = await factory.createBounty(
        title,
        description,
        ["security", "ethereum"],
        website,
        { value: bountyAmount }
      );
      const receipt = await tx.wait();

      const bountyCreatedEvent = receipt.logs
        .map((log: any) => {
          try {
            return factory.interface.parseLog({
              topics: [...log.topics],
              data: log.data,
            });
          } catch (e) {
            return null;
          }
        })
        .find((event: any) => event && event.name === "BountyCreated");

      if (!bountyCreatedEvent) {
        throw new Error("Could not find BountyCreated event");
      }

      const newContractAddress = bountyCreatedEvent.args[0];
      alert(`Bounty contract deployed at: ${newContractAddress}`);
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error deploying contract:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-bounty-page">
      <div className="create-bounty-container">
        <h2>Create Bug Bounty Program</h2>
        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="bounty-form">
          <div className="form-group">
            <label htmlFor="title">Program Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Smart Contract Security Audit"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Program Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the scope, rules, and specific areas of focus for your bug bounty program"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="price">Reward Pool (ETH)</label>
            <input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Enter the total reward amount in ETH"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="website">Project Website</label>
            <input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          <div className="form-buttons">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="cancel-button"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? "Creating Program..." : "Launch Program"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBounty;
