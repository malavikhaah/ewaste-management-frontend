import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiRequest } from "../api.js";

export default function Dashboard() {
  const navigate = useNavigate();
  const [role, setRole] = useState("USER");

  useEffect(() => {
    const token = localStorage.getItem("token");
    apiRequest("/profile/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((data) => setRole(data.role || "USER"))
      .catch(() => setRole("USER"));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
      <div className="home-shell pin-dashboard-shell">
        <header className="home-header pin-dashboard-header">
          <div className="brand">
            <div className="brand-mark">EW</div>
            <div>
              <div className="brand-name">E-Waste Management</div>
              <div className="brand-tag">Sustainable disposal made simple</div>
            </div>
          </div>

          <div className="home-header-actions">
            <Link to="/requests/submit" className="btn pin-btn-primary">
              Submit Request
            </Link>
            <Link to="/requests/view" className="btn pin-btn-ghost">
              View Requests
            </Link>
            <Link to="/profile/me" className="btn pin-btn-ghost">
              Profile
            </Link>
            {role === "ADMIN" && (
              <Link to="/admin" className="btn pin-btn-primary">
                Admin Panel
              </Link>
            )}
            <button className="btn pin-btn-ghost" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <section className="pin-hero-card">

          <h1>
            Responsible Disposal, <span>Lasting Legacy</span>
          </h1>
          <p>
            Transform your environmental impact. Seamlessly submit electronics for responsible recycling, track every step of the journey, and join thousands making sustainable choices. Your waste management, powered by transparency and accountability.
          </p>
          <div className="pin-hero-actions">
            <Link to="/requests/submit" className="btn pin-btn-primary">
              Create Pickup
            </Link>
            <Link to="/requests/view" className="btn pin-btn-ghost">
              Open Requests
            </Link>
          </div>
        </section>

        <section className="pin-board-grid">
          <article className="pin-card pin-card-tall pin-card-olive">
            <div className="pin-card-kicker">Doorstep Pickup</div>
            <h3>Share details once, we handle the route.</h3>
            <p>Add device info, pickup location, and preferred notes in a guided flow.</p>
            <Link to="/requests/submit" className="pin-card-link">
              Start submission
            </Link>
          </article>

          <article className="pin-card pin-card-short pin-card-cream">
            <div className="pin-card-kicker">Live Status</div>
            <h3>Submitted to recycled.</h3>
            <p>Follow every request stage with a clear timeline view.</p>
            <Link to="/requests/view" className="pin-card-link">
              View all requests
            </Link>
          </article>

          <article className="pin-card pin-card-mid pin-card-rose">
            <div className="pin-card-kicker">Profile Ready</div>
            <h3>Keep contact details updated.</h3>
            <p>Accurate profile data helps pickup teams reach you faster.</p>
            <Link to="/profile/me" className="pin-card-link">
              Update profile
            </Link>
          </article>

          <article className="pin-card pin-card-mid pin-card-white">
            <div className="pin-card-kicker">Quick Tips</div>
            <ul className="pin-list">
              <li>Upload a clear device image for faster review.</li>
              <li>Use live location to avoid address mismatches.</li>
              <li>Track status changes from your requests page.</li>
            </ul>
          </article>

          <article className="pin-card pin-card-short pin-card-sky">
            <div className="pin-card-kicker">Recycling Promise</div>
            <h3>Responsible disposal only.</h3>
            <p>Devices are handled through an eco-conscious process.</p>
          </article>
        </section>
      </div>
  );
}
