import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

interface User {
  email: string;
  password: string;
}

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem("users") || "[]");

    if (isLogin) {
      // Login
      const user = users.find(
        (u: User) => u.email === email && u.password === password
      );
      if (user) {
        localStorage.setItem("currentUser", JSON.stringify(user));
        navigate("/");
      } else {
        alert("Invalid credentials");
      }
    } else {
      // Register
      if (users.some((u: User) => u.email === email)) {
        alert("Email already exists");
        return;
      }
      const newUser = { email, password };
      users.push(newUser);
      localStorage.setItem("users", JSON.stringify(users));
      localStorage.setItem("currentUser", JSON.stringify(newUser));
      navigate("/");
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>{isLogin ? "Login" : "Register"}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="modern-input"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="modern-input"
            required
          />
          <button type="submit" className="login-button">
            {isLogin ? "Login" : "Register"}
          </button>
        </form>
        <p className="toggle-form">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            className="toggle-button"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Register" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
