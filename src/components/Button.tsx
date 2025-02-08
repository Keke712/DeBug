import React from "react";

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary"; // Add more variants as needed
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  children,
  variant = "primary",
}) => {
  // Add styling based on the variant
  return <button onClick={onClick}>{children}</button>;
};

export default Button;
