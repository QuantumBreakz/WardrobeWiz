import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { GoogleLogin } from "@react-oauth/google";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register, loginWithGoogle } = useAuth();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (credentialResponse.credential) {
      setLoading(true);
      const result = await loginWithGoogle(credentialResponse.credential);
      setLoading(false);
      if (result.success) {
        toast({ title: "Access granted via Google." });
        navigate("/dashboard");
      } else {
        setError(result.message ?? "Google registration failed.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const result = await register(name.trim(), email.trim(), password);
    setLoading(false);

    if (result.success) {
      toast({ title: "Profile created. Welcome to wardrobewiz." });
      navigate("/dashboard");
      return;
    }
    setError(result.message ?? "Registration failed.");
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
          <p className="font-mono text-xs uppercase tracking-[0.4em] text-foreground/40">New Profile</p>
          <h1 className="text-5xl md:text-7xl font-medium tracking-tight">Onboard.</h1>
          <p className="text-xl font-light text-foreground/40">Initialize your digital wardrobe profile.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-8">
            <Input
              id="name"
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              id="email"
              type="email"
              placeholder="Email Address"
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
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-sm font-mono text-red-400 uppercase tracking-widest">{error}</p>
          )}

          <div className="pt-8 flex flex-col gap-6 border-t border-foreground/10">
            <div className="flex justify-center w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google registration failed")}
                theme="outline"
                size="large"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-8 justify-between">
              <Button type="submit" variant="default" size="lg" disabled={loading} className="text-black">
                {loading ? "INITIALIZING..." : "INITIALIZE"}
              </Button>
              <div className="text-sm font-mono tracking-widest uppercase text-foreground/40">
                Already initialized?{" "}
                <Link to="/login" className="text-foreground hover:opacity-50 transition-opacity">
                  Authenticate
                </Link>
              </div>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Register;
