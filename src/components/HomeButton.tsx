
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export const HomeButton = () => {
  return (
    <Button asChild variant="outline" size="sm">
      <Link to="/" className="flex items-center gap-2">
        <Home className="w-4 h-4" />
        Home
      </Link>
    </Button>
  );
};
