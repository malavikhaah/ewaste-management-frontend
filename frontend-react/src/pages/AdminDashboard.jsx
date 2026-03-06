import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../api.js";

const STATUS_OPTIONS = [
  "SUBMITTED",
  "PICKUP_SCHEDULED",
  "PICKED_UP",
  "RECYCLED",
  "REJECTED"
];

const STATUS_LABELS = {
  SUBMITTED: "Submitted",
  PICKUP_SCHEDULED: "Pickup Scheduled",
  PICKED_UP: "Picked Up",
  RECYCLED: "Recycled",
  REJECTED: "Rejected"
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const load = async () => {
      try {
        const me = await apiRequest("/profile/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(me);
        if (me.role !== "ADMIN") {
          setError("Admin access required.");
          setLoading(false);
          return;
        }

        const data = await apiRequest("/admin/requests", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const normalized = Array.isArray(data) ? data : [];
        setRequests(normalized);

        const initialDrafts = {};
        normalized.forEach((req) => {
          initialDrafts[req.id] = {
            status: req.status || "SUBMITTED",
            pickupDate: req.pickupDate || "",
            pickupTime: req.pickupTime || "",
            pickupPersonnelName: req.pickupPersonnelName || ""
          };
        });
        setDrafts(initialDrafts);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests.filter((req) => {
      if (statusFilter !== "ALL" && req.status !== statusFilter) return false;
      if (!q) return true;
      const text = [
        req.id,
        req.requesterName,
        req.requesterEmail,
        req.deviceType,
        req.brand,
        req.model,
        req.pickupAddress
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(q);
    });
  }, [requests, query, statusFilter]);

  const handleDraftChange = (id, field, value) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const saveUpdate = async (id) => {
    const token = localStorage.getItem("token");
    const draft = drafts[id];
    if (!draft) return;

    setError("");
    setSavingId(id);

    try {
      const body = {
        status: draft.status
      };
      if (draft.status === "PICKUP_SCHEDULED") {
        body.pickupDate = draft.pickupDate || null;
        body.pickupTime = draft.pickupTime || null;
        body.pickupPersonnelName = draft.pickupPersonnelName || null;
      }

      const updated = await apiRequest(`/admin/requests/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      setRequests((prev) => prev.map((req) => (req.id === id ? updated : req)));
      setDrafts((prev) => ({
        ...prev,
        [id]: {
          status: updated.status,
          pickupDate: updated.pickupDate || "",
          pickupTime: updated.pickupTime || "",
          pickupPersonnelName: updated.pickupPersonnelName || ""
        }
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <div className="page-shell"><div className="loading">Loading admin dashboard...</div></div>;
  }

  if (profile?.role !== "ADMIN") {
    return (
      <div className="page-shell" style={{ display: "grid", placeItems: "center", minHeight: "70vh" }}>
        <div className="content-card" style={{ maxWidth: 560, textAlign: "center" }}>
          <h2>Access Denied</h2>
          <p>{error || "You are not allowed to view admin tools."}</p>
          <button className="btn pin-btn-primary" onClick={() => navigate("/dashboard")}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell" style={{ display: "block", padding: "36px 20px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gap: 20 }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div className="pin-pill" style={{ background: "rgba(14,165,164,0.15)", color: "var(--accent-1)", fontWeight: 700 }}>Admin Module</div>
            <h1 style={{ margin: "8px 0 0", color: "var(--ink-1)" }}>Request Management & Scheduling</h1>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Link to="/dashboard" className="btn pin-btn-ghost">User Dashboard</Link>
          </div>
        </header>

        {error && (
          <div className="form-error">{error}</div>
        )}

        <section className="content-card" style={{ padding: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by request ID, user, device, address"
              style={{ padding: 12, borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--ink-1)" }}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: 12, borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--ink-1)" }}
            >
              <option value="ALL">All statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>{STATUS_LABELS[status]}</option>
              ))}
            </select>
          </div>
        </section>

        <section style={{ display: "grid", gap: 12 }}>
          {filtered.map((req) => {
            const draft = drafts[req.id] || {};
            const requiresSchedule = draft.status === "PICKUP_SCHEDULED";
            return (
              <article key={req.id} className="content-card" style={{ padding: 18 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1.3fr", gap: 16 }}>
                  <div>
                    <h3 style={{ marginTop: 0, marginBottom: 8, color: "var(--ink-1)" }}>#{req.id} {req.deviceType} - {req.brand} {req.model}</h3>
                    <div style={{ fontSize: 14, color: "var(--ink-2)" }}>
                      <div><b>User:</b> {req.requesterName || "N/A"}</div>
                      <div><b>Email:</b> {req.requesterEmail || "N/A"}</div>
                      <div><b>Qty:</b> {req.quantity} | <b>Condition:</b> {req.condition}</div>
                      <div><b>Address:</b> {req.pickupAddress}</div>
                      <div><b>Current:</b> {STATUS_LABELS[req.status] || req.status}</div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: 8 }}>
                    <label style={{ fontSize: 12, color: "var(--ink-2)" }}>New Status</label>
                    <select
                      value={draft.status || req.status}
                      onChange={(e) => handleDraftChange(req.id, "status", e.target.value)}
                      style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--ink-1)" }}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: "grid", gap: 8 }}>
                    <label style={{ fontSize: 12, color: "var(--ink-2)" }}>Pickup Date</label>
                    <input
                      type="date"
                      value={draft.pickupDate || ""}
                      onChange={(e) => handleDraftChange(req.id, "pickupDate", e.target.value)}
                      disabled={!requiresSchedule}
                      style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--ink-1)" }}
                    />
                    <label style={{ fontSize: 12, color: "var(--ink-2)" }}>Pickup Time</label>
                    <input
                      type="time"
                      value={draft.pickupTime || ""}
                      onChange={(e) => handleDraftChange(req.id, "pickupTime", e.target.value)}
                      disabled={!requiresSchedule}
                      style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--ink-1)" }}
                    />
                    <label style={{ fontSize: 12, color: "var(--ink-2)" }}>Pickup Personnel</label>
                    <input
                      type="text"
                      placeholder="Personnel name"
                      value={draft.pickupPersonnelName || ""}
                      onChange={(e) => handleDraftChange(req.id, "pickupPersonnelName", e.target.value)}
                      disabled={!requiresSchedule}
                      style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--ink-1)" }}
                    />
                    <button
                      className="btn pin-btn-primary"
                      onClick={() => saveUpdate(req.id)}
                      disabled={savingId === req.id}
                    >
                      {savingId === req.id ? "Saving..." : "Apply Update"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
          {filtered.length === 0 && (
            <div className="content-card" style={{ textAlign: "center" }}>
              No requests found.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
