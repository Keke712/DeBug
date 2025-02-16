import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import ReportFactoryABI from "../contracts/ReportFactory.json";
import BugReportLogicABI from "../contracts/BugReportLogic.json";
import { REPORT_FACTORY_ADDRESS } from "../constants/addresses";
import "../styles/BountyReports.css";

const BountyReports: React.FC = () => {
  const { bountyId } = useParams<{ bountyId: string }>();
  const navigate = useNavigate();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bountyId) {
      navigate("/dashboard");
      return;
    }
    loadReports();
  }, [bountyId]);

  const loadReports = async () => {
    try {
      if (!window.ethereum || !bountyId) {
        throw new Error("MetaMask not installed or invalid bounty ID");
      }

      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const reportFactory = new ethers.Contract(
        REPORT_FACTORY_ADDRESS,
        ReportFactoryABI,
        provider
      );

      const reports = await reportFactory.getReportsByBounty(bountyId);

      const reportsDetails = await Promise.all(
        reports.map(async (reportAddress: string) => {
          try {
            const reportContract = new ethers.Contract(
              reportAddress,
              BugReportLogicABI,
              provider
            );

            const [description, status, reporter] = await Promise.all([
              reportContract.getDescription(),
              reportContract.getStatus(),
              reportContract.getReporter(),
            ]);

            return {
              id: reportAddress,
              description,
              status: ["PENDING", "CONFIRMED", "CANCELED"][status],
              reporter,
              created_at: new Date().toISOString(),
            };
          } catch (err) {
            console.error(`Error loading report ${reportAddress}:`, err);
            return null;
          }
        })
      );

      // Filter out any null reports from failed loads
      setReports(reportsDetails.filter((report) => report !== null));
    } catch (error: any) {
      console.error("Error in loadReports:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (reportId: string) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const reportContract = new ethers.Contract(
        reportId,
        BugReportLogicABI,
        signer
      );

      const tx = await reportContract.confirmReport();
      await tx.wait();
      await loadReports();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleReject = async (reportId: string) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const reportContract = new ethers.Contract(
        reportId,
        BugReportLogicABI,
        signer
      );

      const tx = await reportContract.cancelReport();
      await tx.wait();
      await loadReports();
    } catch (error: any) {
      setError(error.message);
    }
  };

  if (loading) return <div className="reports-loading">Loading reports...</div>;
  if (error) return <div className="reports-error">{error}</div>;

  return (
    <div className="reports-page">
      <div className="reports-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back to Dashboard
        </button>
        <h1>Bug Reports</h1>
        <p className="contract-id">Contract: {bountyId}</p>
      </div>

      <div className="reports-list">
        {reports.length === 0 ? (
          <div className="no-reports">No reports submitted yet</div>
        ) : (
          reports.map((report) => (
            <div key={report.id} className="report-card">
              <div className="report-header">
                <div className="report-meta">
                  <span
                    className={`status-badge ${report.status.toLowerCase()}`}
                  >
                    {report.status}
                  </span>
                  <span className="reporter">by {report.reporter}</span>
                </div>
                {report.status === "PENDING" && (
                  <div className="report-actions">
                    <button
                      className="accept-button"
                      onClick={() => handleAccept(report.id)}
                    >
                      Accept
                    </button>
                    <button
                      className="reject-button"
                      onClick={() => handleReject(report.id)}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
              <div className="report-content">
                <p>{report.description}</p>
              </div>
              <div className="report-footer">
                <span className="report-date">
                  Submitted on:{" "}
                  {new Date(report.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BountyReports;
