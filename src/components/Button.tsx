import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  className?: string;  // Ajout de la prop className
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  variant = "primary",
  className = ""  // Valeur par défaut vide
}) => {
  return (
    <button
      className={`button ${variant} ${className}`.trim()}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;
