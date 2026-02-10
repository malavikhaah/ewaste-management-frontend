import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout.jsx";
import { apiRequest } from "../api.js";

export default function OtpVerify() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const email = localStorage.getItem("pendingEmail") || "";

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!email) {
      setError("No email found. Please register again.");
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest("/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      });
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      localStorage.removeItem("pendingEmail");
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Verify OTP"
      subtitle={
        email
          ? `OTP sent to ${email}. You will be signed in automatically after verification.`
          : "Check your email for the OTP."
      }
      footer={<span>If you used the wrong email, please register again.</span>}
    >
      <form onSubmit={onSubmit} className="form-grid">
        <div className="input-group">
          <label htmlFor="otp">Enter OTP</label>
          <input
            id="otp"
            name="otp"
            type="text"
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
            placeholder="6-digit OTP"
            required
          />
        </div>
        {error ? <div className="form-error">{error}</div> : null}
        <button type="submit" className="btn primary" disabled={loading}>
          {loading ? "Verifying..." : "Verify"}
        </button>
      </form>
    </AuthLayout>
  );
}
