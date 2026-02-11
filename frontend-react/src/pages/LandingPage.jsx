import React from "react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="home-shell">

      {/* Header / Navbar */}
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

        {/* Navigation */}
        <div className="home-header-actions">
          <Link to="/" className="btn ghost">Home</Link>
          <Link to="/dashboard" className="btn ghost">Dashboard</Link>
          <Link to="/register" className="btn primary">Register</Link>
          <Link to="/login" className="btn ghost">Login</Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="home-hero-centered">
        <div className="home-hero-content">

          <div className="home-pill">
            ♻ Smart Recycling Platform
          </div>

          <h1 className="home-headline">
            Welcome to <span className="home-highlight">E-Waste Management</span>
          </h1>

          <p className="home-subtitle">
            Dispose electronic waste responsibly and contribute
            towards a cleaner, greener, and sustainable environment.
            Manage pickups, track recycling, and reduce pollution
            through our digital platform.
          </p>

          <div className="home-cta">
            <Link to="/register" className="btn primary">
              Get Started
            </Link>

            <Link to="/login" className="btn ghost">
              Login
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
}
