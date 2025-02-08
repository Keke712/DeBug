import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import Header from "./components/Header";
import Post from "./components/Post";

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

  return (
    <div className="app">
      <Header />
      <main className="content">
        <div className="posts-grid">
          {posts.map((post, index) => (
            <Post key={index} {...post} />
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
