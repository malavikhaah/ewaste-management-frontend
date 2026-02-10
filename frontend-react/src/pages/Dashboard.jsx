import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const onLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Welcome back</div>
        </div>
        <button className="btn ghost" onClick={onLogout}>
          Logout
        </button>
      </div>

      <div className="hero-card">
        <div>
          <h1>Welcome</h1>
          <p>
            You are successfully logged in.
          </p>
          <button className="btn primary" onClick={() => navigate("/profile")}>
            Go to Profile
          </button>
        </div>
      </div>
    </div>
  );
}
