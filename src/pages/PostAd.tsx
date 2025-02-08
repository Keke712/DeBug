import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

function PostAd() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            const docRef = await addDoc(collection(db, "ads"), {
                title,
                description,
                price: Number(price),
                createdAt: new Date(),
            });
            
            console.log("Document written with ID: ", docRef.id);
            navigate('/'); // Redirect to home after successful post
        } catch (error) {
            console.error("Error adding document: ", error);
        }
    };

    return (
        <div className="post-ad-container">
            <h2>Post New Ad</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Title:</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Description:</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Price:</label>
                    <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="post-button">
                    Post
                </button>
            </form>
        </div>
    );
}

export default PostAd;
