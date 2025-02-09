import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

function PostAd() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

    try {
      const docRef = await addDoc(collection(db, "ads"), {
        title,
        description,
        price: Number(price),
        createdAt: new Date(),
        userAddress: currentUser.address,
      });

      console.log("Document written with ID: ", docRef.id);
      navigate("/dashboard"); // Redirect to dashboard after successful post
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  return (
    <div className="post-ad-container">
      <h2>Post a bounty</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Title"
            className="modern-input"
          />
        </div>
        <div className="form-group">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="Description"
            className="modern-input"
          />
        </div>
        <div className="bottom-container">
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            placeholder="Price"
            className="modern-input price-input"
          />
          <button type="submit" className="post-button">
            Post
          </button>
        </div>
      </form>
    </div>
  );
}

export default PostAd;
