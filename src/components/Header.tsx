import Button from "./Button";
import reactLogo from "../assets/react.svg";

const Header = () => {
  const handleLogin = () => {
    // Add login logic here
    console.log("Login clicked");
  };

  return (
    <header className="header">
      <img src={reactLogo} className="header-logo" alt="Logo" />
      <Button onClick={handleLogin} variant="primary">
        Login
      </Button>
    </header>
  );
};

export default Header;
