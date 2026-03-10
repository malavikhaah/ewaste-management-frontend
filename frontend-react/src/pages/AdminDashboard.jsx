import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../api.js";

const STATUS_OPTIONS = [
  "PENDING",
  "ACCEPTED",
  "SCHEDULED",
  "PICKUP_SCHEDULED",
  "PICKED_UP",
  "REJECTED"
];

const STATUS_LABELS = {
  SUBMITTED: "Pending",
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  SCHEDULED: "Pickup Scheduled",
  PICKUP_SCHEDULED: "Out for Delivery",
  PICKED_UP: "Delivered Successfully",
  REJECTED: "Rejected"
};

const FILTER_CHIPS = [
  { id: "ALL", label: "All" },
  { id: "PICKUP", label: "Pickup" },
  { id: "COMPLETED", label: "Completed" },
  { id: "REJECTED", label: "Rejected" }
];

const TIME_SLOTS = [
  { value: "09:00:00", label: "Morning (9:00 AM - 12:00 PM)" },
  { value: "12:00:00", label: "Noon (12:00 PM - 03:00 PM)" },
  { value: "15:00:00", label: "Afternoon (3:00 PM - 06:00 PM)" },
  { value: "18:00:00", label: "Evening (6:00 PM - 09:00 PM)" }
];

function formatDate(dateValue, options = { dateStyle: "medium" }) {
  if (!dateValue) return "Not set";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleString(undefined, options);
}

function formatSchedule(dateValue, timeValue) {
  if (!dateValue && !timeValue) return "Schedule not assigned";
  const datePart = dateValue ? formatDate(dateValue, { dateStyle: "medium" }) : "Date pending";
  return timeValue ? `${datePart} at ${getTimeSlotLabel(timeValue)}` : datePart;
}

function getTimeSlotOptions(currentValue) {
  if (!currentValue || TIME_SLOTS.some((slot) => slot.value === currentValue)) return TIME_SLOTS;
  return [{ value: currentValue, label: currentValue }, ...TIME_SLOTS];
}

function getTimeSlotLabel(value) {
  return TIME_SLOTS.find((slot) => slot.value === value)?.label || value;
}

function getConditionLabel(condition) {
  switch ((condition || "").toUpperCase()) {
    case "WORKING":
      return "Working";
    case "DAMAGED":
      return "Damaged";
    case "DEAD":
      return "Dead";
    default:
      return condition || "Unknown";
  }
}

function getConditionClass(condition) {
  switch ((condition || "").toUpperCase()) {
    case "WORKING":
      return "adminv2-condition adminv2-condition-working";
    case "DAMAGED":
      return "adminv2-condition adminv2-condition-damaged";
    case "DEAD":
      return "adminv2-condition adminv2-condition-dead";
    default:
      return "adminv2-condition";
  }
}

function getStatusClass(status) {
  switch (status) {
    case "PENDING":
    case "SUBMITTED":
      return "adminv2-status adminv2-status-pending";
    case "ACCEPTED":
      return "adminv2-status adminv2-status-accepted";
    case "SCHEDULED":
    case "PICKUP_SCHEDULED":
      return "adminv2-status adminv2-status-scheduled";
    case "PICKED_UP":
      return "adminv2-status adminv2-status-complete";
    case "REJECTED":
      return "adminv2-status adminv2-status-rejected";
    default:
      return "adminv2-status";
  }
}

function getStatusFieldClass(status) {
  switch (status) {
    case "PENDING":
    case "SUBMITTED":
      return "adminv2-field adminv2-field-status adminv2-field-status-pending";
    case "ACCEPTED":
      return "adminv2-field adminv2-field-status adminv2-field-status-accepted";
    case "SCHEDULED":
    case "PICKUP_SCHEDULED":
      return "adminv2-field adminv2-field-status adminv2-field-status-scheduled";
    case "PICKED_UP":
      return "adminv2-field adminv2-field-status adminv2-field-status-complete";
    case "REJECTED":
      return "adminv2-field adminv2-field-status adminv2-field-status-rejected";
    default:
      return "adminv2-field adminv2-field-status";
  }
}

function getStatusCount(requests, chipId) {
  switch (chipId) {
    case "PICKUP":
      return requests.filter((req) => req.status === "SCHEDULED" || req.status === "PICKUP_SCHEDULED").length;
    case "COMPLETED":
      return requests.filter((req) => req.status === "PICKED_UP").length;
    case "REJECTED":
      return requests.filter((req) => req.status === "REJECTED").length;
    default:
      return requests.length;
  }
}

function matchesChip(status, chipId) {
  if (chipId === "ALL") return true;
  if (chipId === "PICKUP") return status === "SCHEDULED" || status === "PICKUP_SCHEDULED";
  if (chipId === "COMPLETED") return status === "PICKED_UP";
  if (chipId === "REJECTED") return status === "REJECTED";
  return true;
}

function getDeviceInitials(deviceType) {
  const text = (deviceType || "EW").trim();
  return text.slice(0, 2).toUpperCase();
}

function getTodayInputValue() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offsetMs).toISOString().split("T")[0];
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [requestImages, setRequestImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [updateNotice, setUpdateNotice] = useState(null);
  const minPickupDate = getTodayInputValue();

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
            status: req.status || "PENDING",
            pickupDate: req.pickupDate || "",
            pickupTime: req.pickupTime || "",
            pickupPersonnelName: req.pickupPersonnelName || "",
            rejectionReason: req.rejectionReason || ""
          };
        });
        setDrafts(initialDrafts);
        setExpandedId(normalized[0]?.id ?? null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (requests.length === 0) return;

    let isActive = true;
    const token = localStorage.getItem("token");

    const fetchImages = async () => {
      const updates = {};

      await Promise.all(
        requests.map(async (request) => {
          if (!request?.id || requestImages[request.id]) return;

          try {
            const imagePayload = await apiRequest(`/admin/requests/${request.id}/image-data`, {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (imagePayload?.base64Data) {
              const contentType = imagePayload.contentType || "image/jpeg";
              updates[request.id] = `data:${contentType};base64,${imagePayload.base64Data}`;
            }
          } catch {
            // Leave the fallback tile when an image is missing.
          }
        })
      );

      if (isActive && Object.keys(updates).length > 0) {
        setRequestImages((prev) => ({ ...prev, ...updates }));
      }
    };

    fetchImages();

    return () => {
      isActive = false;
    };
  }, [requestImages, requests]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests.filter((req) => {
      if (!matchesChip(req.status, statusFilter)) return false;
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
  }, [query, requests, statusFilter]);

  const metrics = useMemo(() => {
    const total = requests.length;
    const active = requests.filter((req) => req.status !== "PICKED_UP" && req.status !== "REJECTED").length;
    const completed = requests.filter((req) => req.status === "PICKED_UP").length;
    const rejected = requests.filter((req) => req.status === "REJECTED").length;
    return { total, active, completed, rejected };
  }, [requests]);

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
      const requiresSchedule = draft.status === "SCHEDULED" || draft.status === "PICKUP_SCHEDULED";
      const isRejected = draft.status === "REJECTED";
      const body = {
        status: draft.status
      };

      if (requiresSchedule) {
        body.pickupDate = draft.pickupDate || null;
        body.pickupTime = draft.pickupTime || null;
        body.pickupPersonnelName = draft.pickupPersonnelName || null;
      }

      if (isRejected) {
        body.rejectionReason = draft.rejectionReason?.trim() || null;
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
          pickupPersonnelName: updated.pickupPersonnelName || "",
          rejectionReason: updated.rejectionReason || ""
        }
      }));
      setExpandedId((prev) => (prev === id ? null : prev));
      setUpdateNotice({
        id: updated.id,
        status: STATUS_LABELS[updated.status] || updated.status
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="page-shell">
        <div className="loading">Loading admin dashboard...</div>
      </div>
    );
  }

  if (profile?.role !== "ADMIN") {
    return (
      <div className="page-shell" style={{ display: "grid", placeItems: "center", minHeight: "70vh" }}>
        <div className="content-card" style={{ maxWidth: 560, textAlign: "center" }}>
          <h2>Access Denied</h2>
          <p>{error || "You are not allowed to view admin tools."}</p>
          <button className="btn pin-btn-primary" onClick={() => navigate("/dashboard")}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell adminv2-page">
      <div className="adminv2-shell">
        <header className="adminv2-topbar">
          <div>
            <div className="adminv2-kicker">Admin dashboard</div>
            <h1 className="adminv2-title">Operations overview</h1>
            <p className="adminv2-copy">
              Review pickup requests, update delivery stages, and assign the field team from one queue.
            </p>
          </div>
          <div className="adminv2-topbar-actions">
            <Link to="/dashboard" className="btn adminv2-secondary-btn">
              User Dashboard
            </Link>
          </div>
        </header>

        <section className="adminv2-stats">
          <article className="adminv2-stat-card">
            <span className="adminv2-stat-value">{metrics.total}</span>
            <span className="adminv2-stat-label">Total</span>
          </article>
          <article className="adminv2-stat-card">
            <span className="adminv2-stat-value adminv2-stat-value-active">{metrics.active}</span>
            <span className="adminv2-stat-label">Active</span>
          </article>
          <article className="adminv2-stat-card">
            <span className="adminv2-stat-value adminv2-stat-value-complete">{metrics.completed}</span>
            <span className="adminv2-stat-label">Completed</span>
          </article>
          <article className="adminv2-stat-card">
            <span className="adminv2-stat-value adminv2-stat-value-rejected">{metrics.rejected}</span>
            <span className="adminv2-stat-label">Rejected</span>
          </article>
        </section>

        <section className="adminv2-toolbar">
          <div className="adminv2-filters">
            {FILTER_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                className={statusFilter === chip.id ? "adminv2-chip is-active" : "adminv2-chip"}
                onClick={() => setStatusFilter(chip.id)}
              >
                <span>{chip.label}</span>
                <strong>{getStatusCount(requests, chip.id)}</strong>
              </button>
            ))}
          </div>

          <div className="adminv2-search">
            <input
              className="adminv2-search-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search device, brand, city, user or address"
            />
          </div>
        </section>

        {error && <div className="form-error">{error}</div>}

        <section className="adminv2-list">
          {filtered.map((req) => {
            const draft = drafts[req.id] || {};
            const requiresSchedule = draft.status === "SCHEDULED" || draft.status === "PICKUP_SCHEDULED";
            const isRejected = draft.status === "REJECTED";
            const isExpanded = expandedId === req.id;

            return (
              <article key={req.id} className="adminv2-row">
                <div className="adminv2-row-main">
                  <div className="adminv2-device-tile">
                    <span className="adminv2-device-type">{getConditionLabel(req.condition)}</span>
                    <div className="adminv2-device-thumb">
                      {requestImages[req.id] ? (
                        <img
                          src={requestImages[req.id]}
                          alt={`${req.deviceType || "Device"} preview`}
                          className="adminv2-device-image"
                        />
                      ) : (
                        getDeviceInitials(req.deviceType)
                      )}
                    </div>
                  </div>

                  <div className="adminv2-row-copy">
                    <div className="adminv2-row-header">
                      <div>
                        <h3 className="adminv2-row-title">{req.deviceType || "Device"}</h3>
                        <p className="adminv2-row-subtitle">
                          {[req.brand, req.model].filter(Boolean).join(" ")}{[req.brand, req.model].some(Boolean) ? "" : "Unknown model"}
                        </p>
                      </div>
                      <span className={getConditionClass(req.condition)}>{getConditionLabel(req.condition)}</span>
                    </div>

                    <div className="adminv2-row-banner">
                      <span className="adminv2-row-banner-label">
                        Pickup on {formatSchedule(req.pickupDate, req.pickupTime)}
                      </span>
                    </div>

                    <div className="adminv2-meta">
                      <span>#{req.id}</span>
                      <span>{req.requesterName || "Unknown user"}</span>
                      <span>{req.quantity || 1} item</span>
                      <span>{req.pickupAddress || "Address unavailable"}</span>
                      <span>{formatDate(req.createdAt, { dateStyle: "medium", timeStyle: "short" })}</span>
                    </div>
                  </div>

                  <div className="adminv2-row-side">
                    <span className={getStatusClass(req.status)}>
                      {STATUS_LABELS[req.status] || req.status}
                    </span>
                    <button
                      type="button"
                      className="adminv2-view-btn"
                      onClick={() => setExpandedId((prev) => (prev === req.id ? null : req.id))}
                    >
                      {isExpanded ? "Close" : "View"}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="adminv2-editor">
                    <div className="adminv2-editor-grid">
                      <div className="adminv2-editor-block">
                        <label className="adminv2-label">Requester</label>
                        <div className="adminv2-info-card">
                          <strong>{req.requesterName || "N/A"}</strong>
                          <span>{req.requesterEmail || "Email not available"}</span>
                          <span>{req.pickupAddress || "Pickup address not available"}</span>
                          {req.rejectionReason && <span>Rejection: {req.rejectionReason}</span>}
                        </div>
                      </div>

                      <div className="adminv2-editor-block">
                        <label className="adminv2-label">Update status</label>
                        <select
                          className={getStatusFieldClass(draft.status || req.status)}
                          value={draft.status || req.status}
                          onChange={(event) => handleDraftChange(req.id, "status", event.target.value)}
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {STATUS_LABELS[status]}
                            </option>
                          ))}
                        </select>
                      </div>

                      {!isRejected && (
                        <>
                          <div className={requiresSchedule ? "adminv2-editor-block adminv2-editor-block-accent" : "adminv2-editor-block adminv2-editor-block-muted"}>
                            <label className="adminv2-label">Pickup date</label>
                            <input
                              className="adminv2-field"
                              type="date"
                              min={minPickupDate}
                              value={draft.pickupDate || ""}
                              onChange={(event) => handleDraftChange(req.id, "pickupDate", event.target.value)}
                              disabled={!requiresSchedule}
                            />
                          </div>

                          <div className={requiresSchedule ? "adminv2-editor-block adminv2-editor-block-accent" : "adminv2-editor-block adminv2-editor-block-muted"}>
                            <label className="adminv2-label">Pickup time</label>
                            <select
                              className="adminv2-field"
                              value={draft.pickupTime || ""}
                              onChange={(event) => handleDraftChange(req.id, "pickupTime", event.target.value)}
                              disabled={!requiresSchedule}
                            >
                              <option value="">Select a time slot</option>
                              {getTimeSlotOptions(draft.pickupTime).map((slot) => (
                                <option key={slot.value} value={slot.value}>
                                  {slot.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className={requiresSchedule ? "adminv2-editor-block adminv2-editor-block-wide adminv2-editor-block-accent" : "adminv2-editor-block adminv2-editor-block-wide adminv2-editor-block-muted"}>
                            <label className="adminv2-label">Pickup personnel</label>
                            <input
                              className="adminv2-field"
                              type="text"
                              placeholder="Assign pickup personnel"
                              value={draft.pickupPersonnelName || ""}
                              onChange={(event) => handleDraftChange(req.id, "pickupPersonnelName", event.target.value)}
                              disabled={!requiresSchedule}
                            />
                          </div>
                        </>
                      )}

                      {isRejected && (
                        <div className="adminv2-editor-block adminv2-editor-block-wide adminv2-editor-block-rejected">
                          <label className="adminv2-label">Reason for rejection</label>
                          <textarea
                            className="adminv2-field adminv2-textarea"
                            rows="4"
                            placeholder="Type the reason for rejection"
                            value={draft.rejectionReason || ""}
                            onChange={(event) => handleDraftChange(req.id, "rejectionReason", event.target.value)}
                          />
                        </div>
                      )}
                    </div>

                    <div className="adminv2-editor-actions">
                      <button
                        type="button"
                        className="btn adminv2-primary-btn"
                        onClick={() => saveUpdate(req.id)}
                        disabled={savingId === req.id}
                      >
                        {savingId === req.id ? "Saving..." : "Apply Update"}
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}

          {filtered.length === 0 && (
            <div className="adminv2-empty">
              <h3>No requests found</h3>
              <p>Try a different search term or switch the status chips above.</p>
            </div>
          )}
        </section>
      </div>

      {updateNotice && (
        <div className="popup-overlay" style={{ zIndex: 1200 }}>
          <div
            className="popup-box"
            style={{
              maxWidth: "420px",
              background: "var(--surface)",
              padding: "40px",
              borderRadius: "28px",
              border: "1px solid var(--border)",
              textAlign: "center"
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "rgba(16, 185, 129, 0.12)",
                color: "#10b981",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 20px",
                fontSize: "30px",
                fontWeight: 800
              }}
            >
              ✓
            </div>
            <h2 style={{ marginBottom: "10px" }}>Update applied</h2>
            <p style={{ marginBottom: "22px" }}>
              Request #{updateNotice.id} was updated to <strong>{updateNotice.status}</strong>.
            </p>
            <button
              type="button"
              className="btn adminv2-primary-btn"
              style={{ width: "100%" }}
              onClick={() => setUpdateNotice(null)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
