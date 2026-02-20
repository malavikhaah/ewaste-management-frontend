import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../api.js";

const CONDITIONS = ["WORKING", "DAMAGED", "DEAD"];
const DEVICE_TYPES = ["Laptop", "Mobile", "Tablet", "Desktop", "Monitor", "Printer", "Battery", "Other"];
const STATUS_LABELS = {
  SUBMITTED: "Submitted",
  PICKUP_SCHEDULED: "Pickup Scheduled",
  PICKED_UP: "Picked Up",
  RECYCLED: "Recycled",
  REJECTED: "Rejected",
  OTHER: "Other"
};

export default function Requests({ mode = "all" }) {
  const navigate = useNavigate();
  const isSubmitOnly = mode === "submit";
  const isViewOnly = mode === "view";

  const [form, setForm] = useState({
    deviceType: "Laptop",
    customDeviceType: "",
    brand: "",
    model: "",
    condition: "WORKING",
    quantity: 1,
    pickupAddress: "",
    additionalRemarks: ""
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [requests, setRequests] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  useEffect(() => {
    if (!isSubmitOnly) {
      fetchMyRequests();
    }
  }, [isSubmitOnly]);

  const fetchMyRequests = async () => {
    const token = localStorage.getItem("token");
    setListLoading(true);
    setError("");
    try {
      const data = await apiRequest("/requests/mine", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setListLoading(false);
    }
  };

  const statusClassName = (status) => {
    switch (status) {
      case "RECYCLED":
        return "status-badge status-recycled";
      case "REJECTED":
        return "status-badge status-rejected";
      case "PICKED_UP":
        return "status-badge status-picked";
      case "PICKUP_SCHEDULED":
        return "status-badge status-scheduled";
      case "OTHER":
        return "status-badge status-other";
      default:
        return "status-badge status-submitted";
    }
  };

  const readableStatus = (status) => STATUS_LABELS[status] || STATUS_LABELS.OTHER;

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === "quantity") {
      setForm((prev) => ({
        ...prev,
        quantity: Number(value)
      }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDeleteRequest = async (requestId) => {
    const token = localStorage.getItem("token");
    setDeletingId(requestId);
    setError("");

    try {
      await apiRequest(`/requests/${requestId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setRequests((prev) => prev.filter((request) => request.id !== requestId));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setShowSuccess(false);

    if (!imageFile) {
      setError("Image is required");
      return;
    }

    const token = localStorage.getItem("token");
    const payload = new FormData();
    const finalDeviceType =
      form.deviceType === "Other"
        ? form.customDeviceType.trim()
        : form.deviceType.trim();
    if (!finalDeviceType) {
      setError("Please enter device type");
      return;
    }

    payload.append("deviceType", finalDeviceType);
    payload.append("brand", form.brand.trim());
    payload.append("model", form.model.trim());
    payload.append("condition", form.condition);
    payload.append("quantity", String(form.quantity));
    payload.append("pickupAddress", form.pickupAddress.trim());
    if (form.additionalRemarks.trim()) {
      payload.append("additionalRemarks", form.additionalRemarks.trim());
    }
    payload.append("image", imageFile);

    setLoading(true);
    try {
      await apiRequest("/requests", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: payload
      });
      setShowSuccess(true);
      setForm({
        deviceType: "Laptop",
        customDeviceType: "",
        brand: "",
        model: "",
        condition: "WORKING",
        quantity: 1,
        pickupAddress: "",
        additionalRemarks: ""
      });
      setImageFile(null);
      if (!isSubmitOnly) {
        await fetchMyRequests();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-title">E-Waste Requests</div>
          <div className="page-subtitle">
            {isSubmitOnly
              ? "Submit your e-waste pickup request"
              : isViewOnly
                ? "View your submitted requests"
                : "Submit and view your requests"}
          </div>
        </div>
        <Link className="btn ghost" to="/dashboard">
          Back to Dashboard
        </Link>
      </div>

      {!isViewOnly && (
        <div className="content-card request-card request-form-card">
          <div className="page-title">Submit Request</div>
          <div className="page-subtitle">Fill in details and upload an image to create pickup request</div>
          {error && <div className="form-error">{error}</div>}

          <form className="profile-grid" onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Device Type</label>
              <select name="deviceType" value={form.deviceType} onChange={handleChange} required>
                {DEVICE_TYPES.map((deviceType) => (
                  <option key={deviceType} value={deviceType}>
                    {deviceType}
                  </option>
                ))}
              </select>
            </div>

            {form.deviceType === "Other" && (
              <div className="input-group">
                <label>Specify Device Type</label>
                <input
                  name="customDeviceType"
                  value={form.customDeviceType}
                  onChange={handleChange}
                  placeholder="Enter device type"
                  required
                />
              </div>
            )}

            <div className="input-group">
              <label>Brand</label>
              <input name="brand" value={form.brand} onChange={handleChange} placeholder="HP, Dell, Samsung..." required />
            </div>

            <div className="input-group">
              <label>Model</label>
              <input name="model" value={form.model} onChange={handleChange} placeholder="Model name" required />
            </div>

            <div className="input-group">
              <label>Condition</label>
              <select name="condition" value={form.condition} onChange={handleChange} required>
                {CONDITIONS.map((condition) => (
                  <option key={condition} value={condition}>
                    {condition}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>Quantity</label>
              <input name="quantity" type="number" min={1} max={1000} value={form.quantity} onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label>Pickup Address</label>
              <textarea
                name="pickupAddress"
                rows={3}
                value={form.pickupAddress}
                onChange={handleChange}
                placeholder="Enter pickup address"
                required
              />
            </div>

            <div className="input-group">
              <label>Additional Remarks (Optional)</label>
              <textarea
                name="additionalRemarks"
                rows={3}
                value={form.additionalRemarks}
                onChange={handleChange}
                placeholder="Any notes for pickup team"
              />
            </div>

            <div className="input-group">
              <label>Image (max 5MB)</label>
              <input type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] || null)} required />
            </div>

            <div className="profile-actions">
              <button className="btn primary" type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>
        </div>
      )}

      {!isSubmitOnly && (
        <div className="content-card request-card request-list-card">
          <div className="page-title">My Requests</div>
          {error && <div className="form-error">{error}</div>}

          {listLoading ? (
            <div className="loading">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="loading">No requests submitted yet.</div>
          ) : (
            <div className="table-wrap">
              <table className="request-table">
                <thead>
                  <tr>
                    <th>Device</th>
                    <th>Brand</th>
                    <th>Model</th>
                    <th>Condition</th>
                    <th>Qty</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Track</th>
                    <th>Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id}>
                      <td>{request.deviceType}</td>
                      <td>{request.brand}</td>
                      <td>{request.model}</td>
                      <td>{request.condition}</td>
                      <td>{request.quantity}</td>
                      <td>
                        <span className={statusClassName(request.status)}>{readableStatus(request.status)}</span>
                      </td>
                      <td>{request.createdAt ? new Date(request.createdAt).toLocaleString() : "-"}</td>
                      <td>
                        <button className="btn ghost btn-track" type="button" onClick={() => navigate(`/requests/track/${request.id}`)}>
                          Track
                        </button>
                      </td>
                      <td>
                        <button
                          className="btn ghost btn-track btn-delete"
                          type="button"
                          onClick={() => setPendingDeleteId(request.id)}
                          disabled={deletingId === request.id}
                        >
                          {deletingId === request.id ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showSuccess && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h2>Request Submitted</h2>
            <p>Your e-waste pickup request has been submitted successfully.</p>
            <button className="btn primary" onClick={() => setShowSuccess(false)}>
              OK
            </button>
          </div>
        </div>
      )}

      {pendingDeleteId !== null && (
        <div className="popup-overlay">
          <div className="popup-box delete-popup-box">
            <h2>Delete Request</h2>
            <p>Are you sure you want to delete this request?</p>
            <div className="profile-actions" style={{ justifyContent: "center" }}>
              <button className="btn ghost" onClick={() => setPendingDeleteId(null)}>
                Cancel
              </button>
              <button
                className="btn primary btn-danger"
                onClick={async () => {
                  const requestId = pendingDeleteId;
                  setPendingDeleteId(null);
                  await handleDeleteRequest(requestId);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
