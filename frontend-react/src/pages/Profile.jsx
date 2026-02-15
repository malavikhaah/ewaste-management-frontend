import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";   // 👈 ADDED
import { apiRequest } from "../api.js";

const PHONE_REGEX = /^[6-9]\d{9}$/;

export default function Profile() {

  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: ""
  });

  /* =========================
     PASSWORD STATES
  ========================= */

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [passwordStatus, setPasswordStatus] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  /* 👁️ TOGGLE STATES */
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  /* =========================
     LOAD PROFILE
  ========================= */

  useEffect(() => {

    const token = localStorage.getItem("token");

    apiRequest("/profile/me", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((data) => {
        setProfile(data);
        setForm({
          name: data.name || "",
          phone: data.phone || ""
        });
      })
      .catch((err) => setError(err.message));

  }, []);

  /* =========================
     PROFILE UPDATE
  ========================= */

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextValue =
      name === "phone"
        ? value.replace(/\D/g, "").slice(0, 10)
        : value;

    setForm((prev) => ({
      ...prev,
      [name]: nextValue
    }));
  };

  const handleSubmit = async (event) => {

    event.preventDefault();
    setError("");
    setStatus("");

    const phoneValue = form.phone.trim();

    if (phoneValue && !PHONE_REGEX.test(phoneValue)) {
      setError("Enter valid 10-digit phone number");
      return;
    }

    const token = localStorage.getItem("token");

    try {

      const response = await apiRequest(
        "/profile/update",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: form.name,
            phone: phoneValue
          })
        }
      );

      setProfile((prev) => ({
        ...prev,
        name: form.name,
        phone: phoneValue || prev?.phone || ""
      }));

      setStatus(
        response.message ||
        "Profile updated successfully ✅"
      );
      setIsEditingProfile(false);

    } catch (err) {
      setError(err.message);
    }
  };

  const startProfileEdit = () => {
    setError("");
    setStatus("");
    setIsEditingProfile(true);
  };

  const cancelProfileEdit = () => {
    setError("");
    setStatus("");
    setForm({
      name: profile?.name || "",
      phone: profile?.phone || ""
    });
    setIsEditingProfile(false);
  };

  /* =========================
     PASSWORD HANDLERS
  ========================= */

  const handlePasswordChange = (e) => {

    const { name, value } = e.target;

    setPasswordForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const changePassword = async (e) => {

    e.preventDefault();

    setPasswordStatus("");
    setError("");

    if (
      passwordForm.newPassword !==
      passwordForm.confirmPassword
    ) {
      setError("New passwords do not match ❌");
      return;
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (!passwordRegex.test(passwordForm.newPassword)) {
      setError(
        "Password must be 8+ chars with Uppercase, Lowercase, Number & Special character 🔐"
      );
      return;
    }

    const token = localStorage.getItem("token");

    try {

      const response = await apiRequest(
        "/auth/change-password",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            oldPassword: passwordForm.oldPassword,
            newPassword: passwordForm.newPassword
          })
        }
      );

      setPasswordStatus(
        response.message ||
        "Password changed successfully 🔐"
      );

      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      setIsChangingPassword(false);

    } catch (err) {
      setError(err.message);
    }
  };

  const startPasswordChange = () => {
    setError("");
    setPasswordStatus("");
    setIsChangingPassword(true);
  };

  const cancelPasswordChange = () => {
    setError("");
    setPasswordStatus("");
    setPasswordForm({
      oldPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    setIsChangingPassword(false);
  };

  /* =========================
     UI
  ========================= */

  return (
    <div className="page-shell">

      {/* HEADER */}
      <div className="page-header">
        <div>
          <div className="page-title">
            Profile
          </div>
          <div className="page-subtitle">
            Update your details & security settings
          </div>
        </div>

        <button
          className="btn ghost"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          Back to Dashboard
        </button>
      </div>

      {/* PROFILE CARD */}
      <div className="content-card profile-card">

        {error &&
          <div className="form-error">
            {error}
          </div>}

        {status &&
          <div className="form-success">
            {status}
          </div>}

        {!profile ? (
          <div className="loading">
            Loading profile...
          </div>
        ) : !isEditingProfile ? (
          <div className="profile-grid">
            <div className="input-group">
              <label>Name</label>
              <div className="profile-value">{profile.name || "-"}</div>
            </div>

            <div className="input-group">
              <label>Email</label>
              <div className="profile-value">{profile.email || "-"}</div>
            </div>

            <div className="input-group">
              <label>Phone</label>
              <div className="profile-value">{profile.phone || "-"}</div>
            </div>

            <div className="input-group profile-actions">
              <button
                className="btn primary"
                type="button"
                onClick={startProfileEdit}
              >
                Edit Profile
              </button>
            </div>
          </div>
        ) : (
          <form
            className="profile-grid"
            onSubmit={handleSubmit}
          >

            <div className="input-group">
              <label>Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label>Email</label>
              <input
                value={profile.email || ""}
                disabled
              />
            </div>

            <div className="input-group">
              <label>Phone</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter 10-digit phone"
                inputMode="numeric"
                maxLength={10}
                pattern="[6-9][0-9]{9}"
                title="Phone number must be 10 digits and start with 6, 7, 8, or 9"
              />
              {form.phone && !PHONE_REGEX.test(form.phone) && (
                <small className="field-error">
                  Phone must be 10 digits and start with 6, 7, 8, or 9
                </small>
              )}
            </div>

            <div className="input-group profile-actions">
              <button
                className="btn primary"
                type="submit"
              >
                Save Changes
              </button>
              <button
                className="btn ghost"
                type="button"
                onClick={cancelProfileEdit}
              >
                Cancel
              </button>
            </div>

          </form>
        )}
      </div>

      {/* ===============================
          CHANGE PASSWORD
      =============================== */}

      <div
        className="content-card profile-card"
        style={{ marginTop: "20px" }}
      >

        <div className="page-title">
          Change Password
        </div>

        {passwordStatus &&
          <div className="form-success">
            {passwordStatus}
          </div>}

        {!isChangingPassword ? (
          <button
            className="btn primary"
            type="button"
            onClick={startPasswordChange}
          >
            Change Password
          </button>
        ) : (
          <>
            <div className="password-criteria">
              Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.
            </div>

            <form
              className="profile-grid"
              onSubmit={changePassword}
            >

              {/* OLD */}
              <div className="input-group">
                <label>Old Password</label>

                <div className="password-wrapper">
                  <input
                    type={showOld ? "text" : "password"}
                    name="oldPassword"
                    value={passwordForm.oldPassword}
                    onChange={handlePasswordChange}
                    required
                  />

                  <button
                    type="button"
                    className="toggle-eye"
                    onClick={() =>
                      setShowOld(!showOld)
                    }
                  >
                    {showOld
                      ? <FaEyeSlash />
                      : <FaEye />}
                  </button>
                </div>
              </div>

              {/* NEW */}
              <div className="input-group">
                <label>New Password</label>

                <div className="password-wrapper">
                  <input
                    type={showNew ? "text" : "password"}
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    required
                  />

                  <button
                    type="button"
                    className="toggle-eye"
                    onClick={() =>
                      setShowNew(!showNew)
                    }
                  >
                    {showNew
                      ? <FaEyeSlash />
                      : <FaEye />}
                  </button>
                </div>
              </div>

              {/* CONFIRM */}
              <div className="input-group">
                <label>
                  Confirm Password
                </label>

                <div className="password-wrapper">
                  <input
                    type={showConfirm ? "text" : "password"}
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />

                  <button
                    type="button"
                    className="toggle-eye"
                    onClick={() =>
                      setShowConfirm(!showConfirm)
                    }
                  >
                    {showConfirm
                      ? <FaEyeSlash />
                      : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="input-group profile-actions">
                <button
                  className="btn primary"
                  type="submit"
                >
                  Save Password
                </button>
                <button
                  className="btn ghost"
                  type="button"
                  onClick={cancelPasswordChange}
                >
                  Cancel
                </button>
              </div>

            </form>
          </>
        )}
      </div>

    </div>
  );
}
