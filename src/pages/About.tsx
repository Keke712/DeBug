import React from "react";
import "../styles/About.css";

const About = () => {
  return (
    <div className="about-container">
      <div className="about-content">
        <section className="about-section">
          <h2>What is DeBug?</h2>
          <p>
            DeBug is a decentralized bug bounty platform that connects security researchers 
            with blockchain projects. Our platform leverages smart contracts to ensure 
            transparent and trustless bug reporting and reward distribution.
          </p>
        </section>
        <section className="about-section">
          <h2>How it Works</h2>
          <div className="steps">
            <div className="step">
              <h3>1. Create Bounty</h3>
              <p>Projects create bug bounty programs by:</p>
              <ul className="step-details">
                <li>Defining program scope and rules</li>
                <li>Setting reward amounts in ETH</li>
                <li>Depositing funds into smart contract</li>
                <li>Adding project details and tags</li>
              </ul>
            </div>
            <div className="step">
              <h3>2. Submit Reports</h3>
              <p>Security researchers participate by:</p>
              <ul className="step-details">
                <li>Reviewing program requirements</li>
                <li>Identifying vulnerabilities</li>
                <li>Documenting findings</li>
                <li>Submitting detailed reports</li>
              </ul>
            </div>
            <div className="step">
              <h3>3. Verify & Reward</h3>
              <p>The verification process includes:</p>
              <ul className="step-details">
                <li>Project review of submissions</li>
                <li>Vulnerability confirmation</li>
                <li>Automated reward distribution</li>
                <li>Report status tracking</li>
              </ul>
            </div>
            <div className="step">
              <h3>4. Track Progress</h3>
              <p>Platform features include:</p>
              <ul className="step-details">
                <li>Real-time status updates</li>
                <li>Program analytics</li>
                <li>Historical report tracking</li>
                <li>Researcher reputation system</li>
              </ul>
            </div>
            <div className="step">
              <h3>5. Smart Contracts</h3>
              <p>Blockchain integration ensures:</p>
              <ul className="step-details">
                <li>Transparent transactions</li>
                <li>Secure fund management</li>
                <li>Immutable record keeping</li>
                <li>Automated payments</li>
              </ul>
            </div>
            <div className="step">
              <h3>6. Community</h3>
              <p>Platform community offers:</p>
              <ul className="step-details">
                <li>Collaborative environment</li>
                <li>Knowledge sharing</li>
                <li>Best practices</li>
                <li>Security expertise</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
