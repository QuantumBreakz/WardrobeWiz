import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

const navLinks = [
  { label: "Overview", href: "/#features" },
  { label: "Architecture", href: "/architecture" },
  { label: "Demo", href: "/demo" },
  { label: "Docs", href: "/documentation" },
  { label: "Research", href: "/research" },
];

export const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent py-4">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between h-16 gap-6">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-white hover:opacity-80 transition-opacity">
            <span>wardrobewhiz.</span>
          </Link>

          <div className="hidden md:flex items-center gap-12 text-sm font-medium tracking-wide text-white/80">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="transition-opacity hover:opacity-100 opacity-60"
                aria-label={`Navigate to ${link.label}`}
              >
                {link.label}.
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-6 text-sm font-medium tracking-wide">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="transition-opacity hover:opacity-100 opacity-60">
                  dashboard
                </Link>
                <button onClick={handleLogout} className="transition-opacity hover:opacity-100 opacity-60">
                  log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="transition-opacity hover:opacity-100 opacity-60">
                  log in
                </Link>
                <Link to="/register" className="transition-opacity hover:opacity-100 opacity-100 font-bold border-b border-foreground pb-1">
                  start now
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
