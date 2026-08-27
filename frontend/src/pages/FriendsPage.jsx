import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Card } from "../components/Card";
import { UserProfileModal } from "../components/UserProfileModal";
import { toast } from "react-hot-toast";

export function FriendsPage() {
  const [activeTab, setActiveTab] = useState("friends"); // 'friends' | 'requests' | 'search'
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  async function loadSocialData() {
    setLoading(true);
    try {
      const [friendsRes, incomingRes, outgoingRes] = await Promise.all([
        api.get("/friends"),
        api.get("/friends/requests/incoming"),
        api.get("/friends/requests/outgoing"),
      ]);

      setFriends(friendsRes.friends || []);
      setIncomingRequests(incomingRes.requests || []);
      setOutgoingRequests(outgoingRes.requests || []);
    } catch (err) {
      toast.error(err.message || "Failed to load social data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSocialData();
  }, []);

  async function handleSearch(e) {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await api.get(`/users/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchResults(res.users || []);
    } catch (err) {
      toast.error(err.message || "Search failed");
    } finally {
      setSearching(false);
    }
  }

  async function handleSendRequest(userId) {
    try {
      await api.post(`/friends/requests/${userId}`);
      toast.success("Friend request sent!");
      await loadSocialData();
      if (searchQuery.trim()) handleSearch();
    } catch (err) {
      toast.error(err.message || "Failed to send request");
    }
  }

  async function handleCancelRequest(userId) {
    try {
      await api.delete(`/friends/requests/${userId}`);
      toast.success("Request cancelled");
      await loadSocialData();
      if (searchQuery.trim()) handleSearch();
    } catch (err) {
      toast.error(err.message || "Failed to cancel request");
    }
  }

  async function handleAcceptRequest(userId) {
    try {
      await api.post(`/friends/requests/${userId}/accept`);
      toast.success("Friend request accepted!");
      await loadSocialData();
      if (searchQuery.trim()) handleSearch();
    } catch (err) {
      toast.error(err.message || "Failed to accept request");
    }
  }

  async function handleRejectRequest(userId) {
    try {
      await api.post(`/friends/requests/${userId}/reject`);
      toast.success("Request rejected");
      await loadSocialData();
      if (searchQuery.trim()) handleSearch();
    } catch (err) {
      toast.error(err.message || "Failed to reject request");
    }
  }

  async function handleRemoveFriend(userId, username) {
    if (!window.confirm(`Are you sure you want to remove ${username} from your friends?`)) {
      return;
    }
    try {
      await api.delete(`/friends/${userId}`);
      toast.success("Friend removed");
      await loadSocialData();
      if (searchQuery.trim()) handleSearch();
    } catch (err) {
      toast.error(err.message || "Failed to remove friend");
    }
  }

  const totalPendingRequests = incomingRequests.length;

  return (
    <div className="space-y-6">
      {/* Header Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-white">Social & Friends</h1>
          <p className="mt-1 text-sm text-slate-400">
            Connect with friends, track mutual discipline, and control stats privacy.
          </p>
        </div>

        <div className="flex rounded-2xl bg-white/5 p-1 border border-white/10">
          <button
            onClick={() => setActiveTab("friends")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              activeTab === "friends"
                ? "bg-forge-500 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`relative rounded-xl px-4 py-2 text-sm font-medium transition ${
              activeTab === "requests"
                ? "bg-forge-500 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Requests
            {totalPendingRequests > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                {totalPendingRequests}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("search")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              activeTab === "search"
                ? "bg-forge-500 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Find Users
          </button>
        </div>
      </div>

      {/* Friends Tab */}
      {activeTab === "friends" && (
        <Card title="Your Friends" subtitle="Accepted mutual connections">
          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading friends...</div>
          ) : friends.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-slate-400">You haven't added any friends yet.</p>
              <button
                onClick={() => setActiveTab("search")}
                className="rounded-2xl bg-forge-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-forge-400"
              >
                Find & Add Friends
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3
                        onClick={() => setSelectedUserId(friend.id)}
                        className="text-lg font-bold text-white hover:text-forge-300 cursor-pointer transition"
                      >
                        {friend.username}
                      </h3>
                      <p className="text-xs text-forge-300 font-medium mt-0.5">
                        Level {friend.level} • {friend.xp} XP
                      </p>
                      <p className="text-xs text-slate-400 mt-2">
                        🔥 Streak: {friend.current_streak} days
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Friends since {new Date(friend.friendSince).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => setSelectedUserId(friend.id)}
                      className="flex-1 rounded-2xl border border-white/10 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/5"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => handleRemoveFriend(friend.id, friend.username)}
                      className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-200 hover:bg-rose-500/20"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Requests Tab */}
      {activeTab === "requests" && (
        <div className="space-y-6">
          <Card title="Incoming Friend Requests" subtitle="Users who want to connect with you">
            {incomingRequests.length === 0 ? (
              <p className="py-6 text-slate-400 text-sm">No pending incoming requests.</p>
            ) : (
              <div className="space-y-3">
                {incomingRequests.map((req) => (
                  <div
                    key={req.request_id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-4"
                  >
                    <div>
                      <h4
                        onClick={() => setSelectedUserId(req.user_id)}
                        className="font-semibold text-white hover:text-forge-300 cursor-pointer"
                      >
                        {req.username}
                      </h4>
                      <p className="text-xs text-slate-400">Level {req.level}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedUserId(req.user_id)}
                        className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
                      >
                        View Profile
                      </button>
                      <button
                        onClick={() => handleAcceptRequest(req.user_id)}
                        className="rounded-xl bg-forge-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-forge-400"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectRequest(req.user_id)}
                        className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Sent Friend Requests" subtitle="Requests you have sent to others">
            {outgoingRequests.length === 0 ? (
              <p className="py-6 text-slate-400 text-sm">No pending outgoing requests.</p>
            ) : (
              <div className="space-y-3">
                {outgoingRequests.map((req) => (
                  <div
                    key={req.request_id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-4"
                  >
                    <div>
                      <h4
                        onClick={() => setSelectedUserId(req.user_id)}
                        className="font-semibold text-white hover:text-forge-300 cursor-pointer"
                      >
                        {req.username}
                      </h4>
                      <p className="text-xs text-slate-400">Level {req.level}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedUserId(req.user_id)}
                        className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
                      >
                        View Profile
                      </button>
                      <button
                        onClick={() => handleCancelRequest(req.user_id)}
                        className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200 hover:bg-amber-500/20"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Search Tab */}
      {activeTab === "search" && (
        <Card title="Search Users" subtitle="Find FocusForge members by username">
          <form onSubmit={handleSearch} className="flex gap-3 mb-6">
            <input
              type="text"
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-forge-400"
            />
            <button
              type="submit"
              disabled={searching}
              className="rounded-2xl bg-forge-500 px-6 py-3 font-medium text-white hover:bg-forge-400 disabled:opacity-50"
            >
              {searching ? "Searching..." : "Search"}
            </button>
          </form>

          {searching ? (
            <p className="py-8 text-center text-slate-400">Searching users...</p>
          ) : searchResults.length > 0 ? (
            <div className="space-y-3">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-4"
                >
                  <div
                    onClick={() => setSelectedUserId(user.id)}
                    className="cursor-pointer"
                  >
                    <h4 className="font-semibold text-white hover:text-forge-300">
                      {user.username}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Level {user.level} • 🔥 {user.current_streak}d streak
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedUserId(user.id)}
                      className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
                    >
                      View Profile
                    </button>

                    {user.friendshipStatus === "NONE" && (
                      <button
                        onClick={() => handleSendRequest(user.id)}
                        className="rounded-xl bg-forge-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-forge-400"
                      >
                        + Add Friend
                      </button>
                    )}
                    {user.friendshipStatus === "PENDING_OUTGOING" && (
                      <button
                        onClick={() => handleCancelRequest(user.id)}
                        className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200 hover:bg-amber-500/20"
                      >
                        Cancel Request
                      </button>
                    )}
                    {user.friendshipStatus === "PENDING_INCOMING" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptRequest(user.id)}
                          className="rounded-xl bg-forge-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-forge-400"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectRequest(user.id)}
                          className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {user.friendshipStatus === "FRIENDS" && (
                      <button
                        onClick={() => handleRemoveFriend(user.id, user.username)}
                        className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-200 hover:bg-rose-500/20"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <p className="py-8 text-center text-slate-400">No users found matching "{searchQuery}".</p>
          ) : (
            <p className="py-8 text-center text-slate-400">Enter a username above to search for users.</p>
          )}
        </Card>
      )}

      {/* User Profile Modal */}
      {selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onFriendshipChange={() => {
            loadSocialData();
            if (searchQuery.trim()) handleSearch();
          }}
        />
      )}
    </div>
  );
}
