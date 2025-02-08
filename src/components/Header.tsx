import Button from "./Button";
import reactLogo from "../assets/react.svg";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="header">
      <img
        src={reactLogo}
        className="header-logo"
        alt="Logo"
        onClick={() => navigate("/")}
      />
      <div className="header-buttons">
        <Button onClick={() => navigate("/post-ad")} variant="primary">
          Poster une annonce
        </Button>
        <Button onClick={() => navigate("/login")} variant="primary">
          Login
        </Button>
      </div>
    </header>
  );
};

export default Header;
