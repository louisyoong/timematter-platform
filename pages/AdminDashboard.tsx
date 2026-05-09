import React, { useEffect, useState, useCallback } from "react";
import { useApp } from "../store/AppContext";
import { UserRole } from "../types";
import { supabase, BACKEND_URL } from "../services/supabase";
import {
  ShieldAlert,
  UserX,
  UserCheck,
  Users,
  RefreshCw,
  Trash2,
} from "lucide-react";

type AdminUser = {
  id: string;
  email: string;
  account_type: "individual" | "company";
  role: string;
  is_blocked: boolean;
  title?: string;
  gender?: string;
  profile_photo_url?: string;
  company_name?: string;
};

const AdminDashboard: React.FC = () => {
  const { currentUser } = useApp();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <ShieldAlert className="mx-auto mb-4 text-red-400" size={48} />
          <p className="text-xl font-bold text-gray-700">Access Denied</p>
          <p className="mt-2 text-sm text-gray-400">Admin access required.</p>
        </div>
      </div>
    );
  }

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setError("Session expired.");
        return;
      }

      const res = await fetch(`${BACKEND_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to load users.");
        return;
      }
      setUsers(json.users || []);
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleBlockToggle = async (userId: string, isBlocked: boolean) => {
    setActionLoading(`${userId}:block`);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const action = isBlocked ? "unblock" : "block";
      const res = await fetch(
        `${BACKEND_URL}/api/admin/users/${userId}/${action}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );
      if (res.ok) {
        await fetchUsers();
      } else {
        const json = await res.json();
        setError(json.error || `Failed to ${action} user.`);
      }
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const confirmed = window.confirm(
      "Are you sure? This will permanently delete this user and all their data."
    );
    if (!confirmed) return;

    setActionLoading(`${userId}:delete`);
    setError("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${BACKEND_URL}/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.ok) {
        await fetchUsers();
      } else {
        const json = await res.json();
        setError(json.error || "Failed to delete user.");
      }
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setActionLoading(null);
    }
  };

  const displayName = (u: AdminUser) =>
    u.account_type === "company"
      ? u.company_name || "—"
      : [u.title, u.gender].filter(Boolean).join(" / ") || "—";

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      {/* Header */}
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">All Users</h1>
          <p className="mt-1 text-gray-500">Manage platform accounts.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-300 px-5 py-3">
            <Users className="text-gray-700" size={20} />
            <div>
              <p className="text-xs font-bold uppercase text-gray-800">
                Total Users
              </p>
              <p className="text-xl font-bold text-teal-700">{users.length}</p>
            </div>
          </div>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="rounded-2xl border border-gray-200 bg-white p-3 text-gray-500 shadow-sm transition-all hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <RefreshCw size={24} className="animate-spin mr-3" /> Loading users…
          </div>
        ) : users.length === 0 ? (
          <p className="py-20 text-center text-gray-400">No users found.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between gap-4 p-6 transition-colors hover:bg-gray-50/80"
              >
                {/* Avatar */}
                <div className="shrink-0">
                  {u.profile_photo_url ? (
                    <img
                      src={u.profile_photo_url}
                      alt="avatar"
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700">
                      {u.email.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-gray-900">
                    {u.email}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    <span className="capitalize">{u.account_type}</span>
                    {" · "}
                    {displayName(u)}
                  </p>
                </div>

                {/* Status badge */}
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                    u.is_blocked
                      ? "bg-red-100 text-red-600"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {u.is_blocked ? "Blocked" : "Active"}
                </span>

                {/* Block / Unblock and Delete — admins cannot be modified */}
                {u.role !== "ADMIN" && (
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => handleBlockToggle(u.id, u.is_blocked)}
                      disabled={
                        actionLoading === `${u.id}:block` ||
                        actionLoading === `${u.id}:delete`
                      }
                      className={`rounded-xl p-3 transition-all disabled:opacity-50 ${
                        u.is_blocked
                          ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          : "bg-red-50 text-red-600 hover:bg-red-100"
                      }`}
                      title={u.is_blocked ? "Unblock user" : "Block user"}
                    >
                      {actionLoading === `${u.id}:block` ? (
                        <RefreshCw size={18} className="animate-spin" />
                      ) : u.is_blocked ? (
                        <UserCheck size={18} />
                      ) : (
                        <UserX size={18} />
                      )}
                    </button>

                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      disabled={
                        actionLoading === `${u.id}:block` ||
                        actionLoading === `${u.id}:delete`
                      }
                      className="rounded-xl bg-gray-900 p-3 text-white transition-all hover:bg-black disabled:opacity-50"
                      title="Delete user"
                    >
                      {actionLoading === `${u.id}:delete` ? (
                        <RefreshCw size={18} className="animate-spin" />
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminDashboard;
