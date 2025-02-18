import { JSX } from "react";
import "./App.css";
import "./styles/Header.css";
import Header from "./components/Header";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Browse from "./pages/Browse";
import SubmitBugReport from "./pages/SubmitBugReport";
import CreateBounty from "./pages/CreateBounty";
import BountyReports from "./pages/BountyReports";
import About from "./pages/About";

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  if (!currentUser?.address) {
    return <Navigate to="/login" />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/browse" element={<Browse />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/create-bounty"
              element={
                <PrivateRoute>
                  <CreateBounty />
                </PrivateRoute>
              }
            />
            <Route
              path="/submit-report/:contractId"
              element={<SubmitBugReport />}
            />
            <Route
              path="/bounty-reports/:bountyId"
              element={
                <PrivateRoute>
                  <BountyReports />
                </PrivateRoute>
              }
            />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
