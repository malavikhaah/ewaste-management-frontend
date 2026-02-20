import { Link, useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");   // remove JWT
    navigate("/");                      // go to landing page
  };

  return (
    <div className="home-shell">

      {/* 🔹 Top Navigation Bar */}
      <header className="home-header">

        {/* Brand */}
        <div className="brand">
          <div className="brand-mark">EW</div>
          <div>
            <div className="brand-name">E-Waste Management</div>
            <div className="brand-tag">
              Sustainable disposal made simple
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="home-header-actions">
          <Link to="/requests/submit" className="btn primary">
            Submit Request
          </Link>
          <Link to="/requests/view" className="btn ghost">
            View Requests
          </Link>

          {/* ✅ Profile Link */}
          <Link to="/profile/me" className="btn ghost">
            Profile
          </Link>

          {/* ✅ Logout */}
          <button className="btn ghost" onClick={handleLogout}>
            Logout
          </button>

        </div>
      </header>

      {/* 🔹 Middle Content */}
      <section className="home-hero-centered">
        <div className="home-hero-content">

          <div className="home-pill">
            🌱 Smart Recycling Dashboard
          </div>

          <h1 className="home-headline">
            Welcome to Your <span className="home-highlight">Dashboard</span>
          </h1>

          <p className="home-subtitle">
            This platform helps you dispose electronic waste responsibly.
            Schedule pickups, monitor recycling progress, and contribute
            towards a cleaner and greener environment.
          </p>

        </div>
      </section>

    </div>
  );
}
