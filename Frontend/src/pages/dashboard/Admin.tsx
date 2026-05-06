import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Users, Package, Cpu, Activity, Trash2, RefreshCw, Crown, ChevronDown, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import {
  getAdminMetrics,
  getAdminUsers,
  patchAdminUser,
  deleteAdminUser,
  reloadMlModel,
  AdminMetrics,
  AdminUser,
} from "@/lib/api/admin";

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [mlReloading, setMlReloading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [m, u] = await Promise.all([getAdminMetrics(), getAdminUsers()]);
      setMetrics(m);
      setUsers(u);
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? "Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.is_admin) {
      navigate("/dashboard");
      return;
    }
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [user, navigate, fetchData]);

  const handleReloadModel = async () => {
    setMlReloading(true);
    try {
      await reloadMlModel();
      await fetchData();
    } finally {
      setMlReloading(false);
    }
  };

  const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    await patchAdminUser(userId, { is_admin: !currentIsAdmin });
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_admin: !currentIsAdmin } : u));
  };

  const handleDeleteUser = async (userId: string) => {
    setDeletingId(userId);
    try {
      await deleteAdminUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      if (metrics) {
        setMetrics({ ...metrics, total_users: metrics.total_users - 1 });
      }
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const formatDate = (ts: number) => {
    return new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-6 w-6 text-black" />
          <h1 className="text-3xl font-semibold text-black">Admin Panel</h1>
        </div>
        <p className="text-black/50 text-sm">
          System metrics, user management, and ML operations — restricted to admins only.
        </p>
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> {error}
          </div>
        )}
      </motion.div>

      {/* Metrics Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {[
          { label: "Total Users", value: metrics?.total_users ?? 0, icon: Users, color: "text-blue-600" },
          { label: "Items Digitized", value: metrics?.total_items ?? 0, icon: Package, color: "text-green-600" },
          { label: "Outfits Generated", value: metrics?.total_outfits ?? 0, icon: Activity, color: "text-purple-600" },
          { label: "Server Uptime", value: formatUptime(metrics?.server_uptime_seconds ?? 0), icon: Cpu, color: "text-orange-600" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
            <Card className="border-black/10 rounded-none bg-black/5 backdrop-blur-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-black/50">{stat.label}</CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-black">{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* ML Pipeline Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border-black/10 rounded-none bg-black/5 backdrop-blur-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-black">ML Pipeline</CardTitle>
                <CardDescription className="text-black/50 mt-1">CLIP embedding model status and hot-swap controls.</CardDescription>
              </div>
              <Button
                onClick={handleReloadModel}
                disabled={mlReloading}
                variant="outline"
                className="border-black/20 text-black hover:bg-black hover:text-white transition-all rounded-none gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${mlReloading ? "animate-spin" : ""}`} />
                {mlReloading ? "Reloading..." : "Hot-Reload Model"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-4 gap-4">
            {[
              { label: "Status", value: metrics?.ml_pipeline.loaded ? "Loaded" : "Fallback" },
              { label: "Model", value: metrics?.ml_pipeline.model_name ?? "—" },
              { label: "Device", value: metrics?.ml_pipeline.device ?? "—" },
              { label: "PyTorch", value: metrics?.ml_pipeline.has_torch ? "Available" : "Not installed" },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <p className="text-xs font-mono uppercase tracking-widest text-black/40">{item.label}</p>
                <p className="text-sm font-medium text-black">{item.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* User Management Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="border-black/10 rounded-none bg-black/5 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-black">User Management</CardTitle>
            <CardDescription className="text-black/50">
              {users.length} registered users · Click crown to toggle admin · Delete cascades all user data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-black/40 font-mono text-xs uppercase tracking-widest">
                    <th className="text-left pb-3 pr-4">User</th>
                    <th className="text-left pb-3 pr-4">Joined</th>
                    <th className="text-center pb-3 pr-4">Items</th>
                    <th className="text-center pb-3 pr-4">Outfits</th>
                    <th className="text-center pb-3 pr-4">Admin</th>
                    <th className="text-right pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {users.map((u) => (
                      <motion.tr
                        key={u.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-b border-black/5 hover:bg-black/5 transition-colors"
                      >
                        <td className="py-3 pr-4">
                          <div>
                            <p className="font-medium text-black">{u.name}</p>
                            <p className="text-black/40 text-xs">{u.email}</p>
                            {u.oauth_provider && (
                              <Badge variant="outline" className="text-[10px] mt-1 border-black/20 rounded-none">
                                {u.oauth_provider}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-black/50">{formatDate(u.created_at)}</td>
                        <td className="py-3 pr-4 text-center text-black">{u.item_count}</td>
                        <td className="py-3 pr-4 text-center text-black">{u.outfit_count}</td>
                        <td className="py-3 pr-4 text-center">
                          <button
                            onClick={() => handleToggleAdmin(u.id, u.is_admin)}
                            disabled={u.id === user?.user_id}
                            className={`p-1 rounded transition-colors ${u.is_admin ? "text-yellow-500 hover:text-yellow-700" : "text-black/20 hover:text-black/50"} disabled:opacity-30 disabled:cursor-not-allowed`}
                            title={u.is_admin ? "Remove admin" : "Grant admin"}
                          >
                            <Crown className="h-4 w-4" />
                          </button>
                        </td>
                        <td className="py-3 text-right">
                          {confirmDelete === u.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-xs text-red-500">Confirm?</span>
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                disabled={deletingId === u.id}
                                className="text-xs text-red-600 hover:text-red-800 font-medium"
                              >
                                {deletingId === u.id ? "Deleting..." : "Yes"}
                              </button>
                              <button onClick={() => setConfirmDelete(null)} className="text-xs text-black/40 hover:text-black">
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDelete(u.id)}
                              disabled={u.id === user?.user_id}
                              className="p-1 text-black/20 hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Delete user and all data"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Admin;
