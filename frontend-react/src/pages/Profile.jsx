import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api.js";

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    apiRequest("/profile/me", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((data) => setProfile(data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-title">Profile</div>
          <div className="page-subtitle">Read-only account details</div>
        </div>
        <button className="btn ghost" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </div>

      <div className="content-card">
        {error ? <div className="form-error">{error}</div> : null}
        {!profile ? (
          <div className="loading">Loading profile...</div>
        ) : (
          <div className="profile-grid">
            <div className="input-group">
              <label>Name</label>
              <input value={profile.name || ""} disabled />
            </div>
            <div className="input-group">
              <label>Email</label>
              <input value={profile.email || ""} disabled />
            </div>
            <div className="input-group">
              <label>Phone</label>
              <input value={profile.phone || ""} disabled />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
