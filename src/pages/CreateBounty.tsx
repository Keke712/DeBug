import React, { useState } from "react";
import { ethers } from "ethers";
import { useNavigate } from "react-router-dom";
import BountyFactoryABI from "../contracts/BountyFactoryABI.json";
import { BOUNTY_FACTORY_ADDRESS } from "../constants/addresses";
import Toast from "../components/Toast";
import "../styles/CreateBounty.css";

const CreateBounty = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [website, setWebsite] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const navigate = useNavigate();

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

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
        tags.length > 0 ? tags : ["security", "ethereum"],
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
      // Stocker le message dans localStorage avant la redirection
      localStorage.setItem(
        "bountyCreatedMessage",
        `Bounty contract deployed at: ${newContractAddress}`
      );
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
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
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
              step="0.0001"
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
          <div className="form-group">
            <label htmlFor="tags">Tags</label>
            <div className="tags-container">
              {tags.map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="tag-remove"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="tag-input-container">
              <input
                id="tags"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tags (press Enter)"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="tag-add-button"
              >
                Add
              </button>
            </div>
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
