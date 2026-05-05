import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BackButtonProps = {
  fallback?: string;
  className?: string;
  label?: string;
};

export const BackButton = ({ fallback = "/", className, label = "Back" }: BackButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleClick} className={cn("gap-2 text-sm", className)}>
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
};

