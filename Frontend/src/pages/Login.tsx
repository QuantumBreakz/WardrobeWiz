import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (result.success) {
      toast({ title: "Access granted." });
      navigate("/dashboard");
      return;
    }
    setError(result.message ?? "Authentication failed.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <Link
        to="/"
        className="absolute top-8 left-8 font-mono text-sm tracking-widest uppercase hover:opacity-50 transition-opacity"
      >
        ← Return
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-xl space-y-16 relative z-10"
      >
        <div className="space-y-4">
          <p className="font-mono text-xs uppercase tracking-[0.4em] text-white/40">Authenticate</p>
          <h1 className="text-5xl md:text-7xl font-medium tracking-tight">Welcome back.</h1>
          <p className="text-xl font-light text-white/40">Enter your credentials to access wardrobewiz.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-8">
            <Input
              id="email"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-sm font-mono text-red-400 uppercase tracking-widest">{error}</p>
          )}

          <div className="pt-8 flex flex-col sm:flex-row items-center gap-8 justify-between border-t border-white/10">
            <Button type="submit" variant="default" size="lg" disabled={loading}>
              {loading ? "AUTHENTICATING..." : "EXECUTE"}
            </Button>
            <div className="text-sm font-mono tracking-widest uppercase text-white/40">
              No access?{" "}
              <Link to="/register" className="text-white hover:opacity-50 transition-opacity">
                Register
              </Link>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
