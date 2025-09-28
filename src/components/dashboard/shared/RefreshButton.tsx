import React from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RefreshButtonProps {
  onRefresh: () => void;
  isLoading?: boolean;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showText?: boolean;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({
  onRefresh,
  isLoading = false,
  variant = "outline",
  size = "sm",
  className,
  showText = true,
}) => {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onRefresh}
      disabled={isLoading}
      className={cn(
        "transition-all duration-200",
        isLoading && "cursor-wait",
        className
      )}
    >
      <RefreshCw
        className={cn(
          "h-4 w-4",
          isLoading && "animate-spin",
          showText && "mr-2"
        )}
      />
      {showText && (isLoading ? "Actualisation..." : "Actualiser")}
    </Button>
  );
};