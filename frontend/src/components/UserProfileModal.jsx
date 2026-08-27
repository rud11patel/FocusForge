import { useEffect, useState } from "react";
import { api } from "../api/client";
import { toast } from "react-hot-toast";

function formatMinutes(minutes) {
  if (!minutes) return "0m";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest}m`;
  return `${hours}h ${rest}m`;
}

export function UserProfileModal({ userId, onClose, onFriendshipChange }) {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadData() {
    if (!userId) return;
    setLoading(true);
    try {
      const profData = await api.get(`/users/${userId}/profile`);
      setProfile(profData);

      if (profData.statsVisible) {
        try {
          const statsData = await api.get(`/users/${userId}/stats`);
          setStats(statsData);
        } catch {
          setStats(null);
        }
      } else {
        setStats(null);
      }
    } catch (err) {
      toast.error(err.message || "Failed to load user profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [userId]);

  async function handleSendRequest() {
    setActionLoading(true);
    try {
      await api.post(`/friends/requests/${userId}`);
      toast.success("Friend request sent!");
      await loadData();
      if (onFriendshipChange) onFriendshipChange();
    } catch (err) {
      toast.error(err.message || "Failed to send request");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancelRequest() {
    setActionLoading(true);
    try {
      await api.delete(`/friends/requests/${userId}`);
      toast.success("Request cancelled");
      await loadData();
      if (onFriendshipChange) onFriendshipChange();
    } catch (err) {
      toast.error(err.message || "Failed to cancel request");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAcceptRequest() {
    setActionLoading(true);
    try {
      await api.post(`/friends/requests/${userId}/accept`);
      toast.success("Friend request accepted!");
      await loadData();
      if (onFriendshipChange) onFriendshipChange();
    } catch (err) {
      toast.error(err.message || "Failed to accept request");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRejectRequest() {
    setActionLoading(true);
    try {
      await api.post(`/friends/requests/${userId}/reject`);
      toast.success("Request rejected");
      await loadData();
      if (onFriendshipChange) onFriendshipChange();
    } catch (err) {
      toast.error(err.message || "Failed to reject request");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRemoveFriend() {
    if (!window.confirm(`Are you sure you want to remove ${profile?.username} from your friends?`)) {
      return;
    }
    setActionLoading(true);
    try {
      await api.delete(`/friends/${userId}`);
      toast.success("Friend removed");
      await loadData();
      if (onFriendshipChange) onFriendshipChange();
    } catch (err) {
      toast.error(err.message || "Failed to remove friend");
    } finally {
      setActionLoading(false);
    }
  }

  if (!userId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h2 className="text-xl font-semibold text-white">User Profile</h2>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 px-3 py-1.5 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
          >
            Close
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400">Loading profile...</div>
        ) : profile ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white">{profile.username}</h3>
                <p className="text-sm text-forge-300 font-medium mt-0.5">
                  Level {profile.level}
                </p>
              </div>

              <div>
                {profile.friendshipStatus === "NONE" && (
                  <button
                    disabled={actionLoading}
                    onClick={handleSendRequest}
                    className="rounded-2xl bg-forge-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-forge-400 disabled:opacity-50"
                  >
                    + Add Friend
                  </button>
                )}
                {profile.friendshipStatus === "PENDING_OUTGOING" && (
                  <button
                    disabled={actionLoading}
                    onClick={handleCancelRequest}
                    className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-200 hover:bg-amber-500/20 disabled:opacity-50"
                  >
                    Cancel Request
                  </button>
                )}
                {profile.friendshipStatus === "PENDING_INCOMING" && (
                  <div className="flex gap-2">
                    <button
                      disabled={actionLoading}
                      onClick={handleAcceptRequest}
                      className="rounded-2xl bg-forge-500 px-3 py-2 text-xs font-medium text-white hover:bg-forge-400 disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      disabled={actionLoading}
                      onClick={handleRejectRequest}
                      className="rounded-2xl border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/5 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}
                {profile.friendshipStatus === "FRIENDS" && (
                  <button
                    disabled={actionLoading}
                    onClick={handleRemoveFriend}
                    className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-200 hover:bg-rose-500/20 disabled:opacity-50"
                  >
                    Remove Friend
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Productivity Statistics
              </h4>

              {profile.statsVisible && stats ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                    <p className="text-xs text-slate-400">Total XP</p>
                    <p className="mt-1 text-lg font-bold text-forge-200">{stats.xp}</p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                    <p className="text-xs text-slate-400">Level</p>
                    <p className="mt-1 text-lg font-bold text-white">{stats.level}</p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                    <p className="text-xs text-slate-400">Current Streak</p>
                    <p className="mt-1 text-lg font-bold text-amber-300">
                      🔥 {stats.currentStreak} days
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                    <p className="text-xs text-slate-400">Longest Streak</p>
                    <p className="mt-1 text-lg font-bold text-white">
                      ⚡ {stats.longestStreak} days
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                    <p className="text-xs text-slate-400">Total Focus Time</p>
                    <p className="mt-1 text-lg font-bold text-white">
                      {formatMinutes(stats.totalFocusMinutes)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                    <p className="text-xs text-slate-400">Completed Sessions</p>
                    <p className="mt-1 text-lg font-bold text-white">
                      {stats.completedSessionsCount}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                    <p className="text-xs text-slate-400">This Week Focus</p>
                    <p className="mt-1 text-lg font-bold text-forge-200">
                      {formatMinutes(stats.thisWeekFocusMinutes)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                    <p className="text-xs text-slate-400">Last Week Focus</p>
                    <p className="mt-1 text-lg font-bold text-forge-200">
                      {formatMinutes(stats.lastWeekFocusMinutes)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-white/5 bg-white/5 p-6 text-center">
                  <p className="text-sm text-slate-400">
                    {profile.statsVisibilityReason === "FRIENDS_ONLY"
                      ? "Statistics are visible to friends only."
                      : "This user's statistics are private."}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400">User not found</div>
        )}
      </div>
    </div>
  );
}
