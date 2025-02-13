import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { ethers } from "ethers";
import { supabase } from "../supabase";
import BountyFactoryABI from "../contracts/BountyFactoryABI.json";
import BountyLogicABI from "../contracts/BountyDepositLogic.json";
import { FACTORY_ADDRESS } from "../constants/addresses";

interface Ad {
  id: string;
  title: string;
  description: string;
  price: number;
  createdAt: Date;
}

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

interface Contract {
  id: number;
  wallet_address: string;
  transaction_hash: string;
  title: string;
  description: string;
  amount: number;
  status: string;
  created_at: string;
}

const Dashboard = () => {
  const [userAds, setUserAds] = useState<Ad[]>([]);
  const [activeView, setActiveView] = useState("dashboard");
  const [showNewBountyForm, setShowNewBountyForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userContracts, setUserContracts] = useState<any[]>([]); // Ajoutez cet état
  const [submissions, setSubmissions] = useState<Submit[]>([]);
  const [expandedContract, setExpandedContract] = useState<number | null>(null);

  // Ajoutez cette fonction pour charger les contrats
  useEffect(() => {
    loadUserContracts();
  }, [currentUser]);

  const loadUserContracts = async () => {
    try {
      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .eq("wallet_address", currentUser?.address)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUserContracts(data || []);
    } catch (error: any) {
      console.error("Error loading contracts:", error.message);
    }
  };

  const handleNewBounty = async (e: React.FormEvent) => {
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

      // Connect to the factory contract
      const factory = new ethers.Contract(
        FACTORY_ADDRESS,
        BountyFactoryABI,
        signer
      );

      // Create new bounty through factory
      const bountyAmount = ethers.parseEther(price);
      const tx = await factory.createBounty({ value: bountyAmount });
      const receipt = await tx.wait();

      // Get the created bounty address from events
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

      // Save to Supabase
      const { error: supabaseError } = await supabase.from("contracts").insert({
        wallet_address: currentUser.address,
        transaction_hash: receipt.hash,
        contract_address: newContractAddress,
        title: title,
        description: description,
        contract_type: "bug_bounty",
        amount: Number(price),
        status: "active",
      });

      if (supabaseError) throw supabaseError;

      await loadUserContracts();
      setShowNewBountyForm(false);
      alert(`Bounty contract deployed at: ${newContractAddress}`);
    } catch (error: any) {
      console.error("Error deploying contract:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour charger les soumissions d'un contrat
  const loadSubmissions = async (contractId: number) => {
    try {
      const { data, error } = await supabase
        .from("submits")
        .select(
          `
          *,
          contract:contracts!contract_id (
            id,
            title,
            description,
            amount,
            status,
            wallet_address,
            transaction_hash
          )
        `
        )
        .eq("contract_id", contractId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
      console.log("Submits loaded:", data); // Pour le débogage
    } catch (error: any) {
      console.error("Error loading submits:", error.message);
      setError(error.message);
    }
  };

  // Fonction pour gérer la validation d'une soumission
  const handleAcceptSubmission = async (submission: Submit) => {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not installed");
      }

      const { data: contractData } = await supabase
        .from("contracts")
        .select("contract_address")
        .eq("id", submission.contract_id)
        .single();

      if (!contractData?.contract_address)
        throw new Error("Contract address not found");

      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();

      // Connect to the cloned contract instance using BountyLogicABI
      const contract = new ethers.Contract(
        contractData.contract_address,
        BountyLogicABI,
        signer
      );

      // Get submitter address
      const { data: submitData } = await supabase
        .from("submits")
        .select("submitter_address")
        .eq("id", submission.id)
        .single();

      if (!submitData?.submitter_address)
        throw new Error("Submitter address not found");

      // Validate recipient and release bounty
      const validateTx = await contract.validateRecipient(
        submitData.submitter_address
      );
      await validateTx.wait();

      const releaseTx = await contract.releaseBounty();
      await releaseTx.wait();

      await supabase
        .from("submits")
        .update({ status: "accepted" })
        .eq("id", submission.id);

      await loadSubmissions(submission.contract_id);
      alert("Bug bounty accepted and reward released!");
    } catch (error: any) {
      console.error("Error accepting submission:", error);
      setError(error.message);
    }
  };

  // Fonction pour rejeter une soumission
  const handleRejectSubmission = async (submission: Submit) => {
    try {
      const { error } = await supabase
        .from("submits") // Changement de "submissions" à "submits"
        .delete()
        .eq("id", submission.id);

      if (error) throw error;

      // Recharger les soumissions après la suppression
      await loadSubmissions(submission.contract_id);

      // Notification optionnelle
      alert("Bug report rejected and removed");
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

  const renderBountyForm = () => (
    <form onSubmit={handleNewBounty} className="bounty-form">
           {" "}
      <div className="form-group">
                <label htmlFor="title">Bounty Title</label>       {" "}
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a descriptive title"
          required
        />
             {" "}
      </div>
           {" "}
      <div className="form-group">
                <label htmlFor="description">Description</label>       {" "}
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the bug or vulnerability in detail"
          required
        />
             {" "}
      </div>
           {" "}
      <div className="form-group">
                <label htmlFor="price">Reward Amount (ETH)</label>       {" "}
        <input
          id="price"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Enter the bounty reward"
          required
        />
             {" "}
      </div>
           {" "}
      <div className="form-buttons">
               {" "}
        <button
          type="button"
          onClick={() => setShowNewBountyForm(false)}
          className="cancel-button"
        >
                    Cancel        {" "}
        </button>
               {" "}
        <button type="submit" className="submit-button" disabled={isLoading}>
                    {isLoading ? "Creating Contract..." : "Create Contract"}   
             {" "}
        </button>
             {" "}
      </div>
         {" "}
    </form>
  );

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <>
                        <h2>Dashboard Overview</h2>           {" "}
            <div className="user-info">
                            <p>Connected Address: {currentUser?.address}</p>   
                     {" "}
            </div>
                        {error && <div className="error-message">{error}</div>} 
                   {" "}
          </>
        );
      case "bounties":
        return (
          <div className="user-ads">
                       {" "}
            <div className="bounties-header">
                            <h3>My Bug Bounties</h3>             {" "}
              <button
                onClick={() => setShowNewBountyForm(true)}
                className="new-bounty-button"
                disabled={isLoading}
              >
                               {" "}
                {isLoading ? "Creating Contract..." : "Create a new contract"} 
                           {" "}
              </button>
                         {" "}
            </div>
                        {showNewBountyForm && renderBountyForm()}           {" "}
            {error && <div className="error-message">{error}</div>}           {" "}
            <div className="ads-grid">
                           {" "}
              {userContracts.map((contract) => (
                <div key={contract.id} className="ad-card">
                                    <h4>{contract.title}</h4>                 {" "}
                  <p>{contract.description}</p>                 {" "}
                  <p className="price">{contract.amount} ETH</p>               
                   {" "}
                  <p className="date">
                    {new Date(contract.created_at).toLocaleDateString()}
                  </p>
                                   {" "}
                  <p className="status">Status: {contract.status}</p>
                  <p className="address">
                    Contract: {contract.transaction_hash}
                  </p>
                  <button
                    onClick={() => {
                      if (expandedContract === contract.id) {
                        setExpandedContract(null);
                      } else {
                        setExpandedContract(contract.id);
                        loadSubmissions(contract.id);
                      }
                    }}
                    className="view-submissions-button"
                  >
                    {expandedContract === contract.id
                      ? "Hide Submissions"
                      : "View Submissions"}
                  </button>
                  {expandedContract === contract.id &&
                    submissions.length > 0 && (
                      <div className="submissions-dropdown">
                        {submissions.map(renderSubmission)}
                      </div>
                    )}
                  {expandedContract === contract.id &&
                    submissions.length === 0 && (
                      <div className="no-submissions">No submissions yet</div>
                    )}
                </div>
              ))}
                         {" "}
            </div>
          </div>
        );
      case "submissions":
        return (
          <div>
                        <h3>Active Submissions</h3>           {" "}
            <p>No active submissions yet.</p>         {" "}
          </div>
        );
      case "settings":
        return (
          <div>
                        <h3>Settings</h3>           {" "}
            <p>Account settings will be available soon.</p>         {" "}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-layout">
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
