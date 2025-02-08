import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import Header from "./components/Header";
import Post from "./components/Post";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PostAd from "./pages/PostAd";
import Login from "./pages/Login";

function App() {
  const posts = [
    {
      imageUrl: "https://placekitten.com/200/200",
      description: "Post 1 description",
    },
    {
      imageUrl: "https://placekitten.com/201/201",
      description: "Post 2 description",
    },
    {
      imageUrl: "https://placekitten.com/202/202",
      description: "Post 3 description",
    },
  ];

  const HomePage = () => (
    <main className="content">
      <div className="posts-grid">
        {posts.map((post, index) => (
          <Post key={index} {...post} />
        ))}
      </div>
    </main>
  );

  return (
    <Router>
      <div className="app">
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/post-ad" element={<PostAd />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
