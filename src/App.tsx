import { useState } from "react";
import "./App.css";
import Header from "./components/Header";
import Post from "./components/Post";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PostAd from "./pages/PostAd";
import Login from "./pages/Login";
import Home from "./pages/Home";

function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/post-ad" element={<PostAd />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
