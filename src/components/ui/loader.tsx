import React from "react";
import { Loader2 } from "lucide-react";

interface LoaderProps {
  text?: string;
  className?: string;
  size?: number;
}

const Loader: React.FC<LoaderProps> = ({ text = "Chargement...", className = "", size = 20 }) => {
  return (
    <div className={`flex items-center justify-center gap-2 text-muted-foreground ${className}`}>
      <Loader2 className="animate-spin" style={{ width: size, height: size }} />
      {text && <span className="text-sm">{text}</span>}
    </div>
  );
};

export default Loader;
