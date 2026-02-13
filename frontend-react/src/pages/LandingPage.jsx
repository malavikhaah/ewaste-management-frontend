import React from "react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-brand">
            <span className="landing-brand-icon" aria-hidden="true">
              EC
            </span>
            <span className="landing-brand-name">EcoCircuit</span>
          </div>

          <nav className="landing-links" aria-label="Primary">
            <a href="#categories" className="landing-nav-link">
              Categories
            </a>
            <a href="#how-it-works" className="landing-nav-link">
              How It Works
            </a>
            <a href="#impact" className="landing-nav-link">
              Impact
            </a>
          </nav>

          <div className="landing-actions">
            <Link to="/login" className="landing-btn landing-btn-light">
              Login
            </Link>
            <Link to="/register" className="landing-btn landing-btn-primary">
              Register
            </Link>
          </div>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-overlay" />

        <div className="landing-hero-content">
          <div className="landing-pill">Responsible E-Waste Recycling</div>

          <h1 className="landing-title">
            Give Your Old Electronics a <span>Second Life</span>
          </h1>

          <p className="landing-copy">
            Schedule pickups, track your impact, and ensure your e-waste is
            recycled responsibly. Together we can reduce toxic waste in
            landfills.
          </p>

          <div className="landing-cta">
            <Link to="/register" className="landing-btn landing-btn-primary">
              Get Started
            </Link>
            <a href="#how-it-works" className="landing-btn landing-btn-outline">
              Learn More
            </a>
          </div>
        </div>
      </section>

      <section id="categories" className="landing-section">
        <div className="landing-section-inner">
          <p className="landing-kicker">What We Collect</p>
          <h2 className="landing-section-title">Categories</h2>
          <div className="landing-categories">
            <article className="landing-feature-card">
              <h3>Small Devices & Accessories</h3>
              <p>
                Phones, smartwatches, earbuds, power banks, and daily-use
                electronics.
              </p>
              <ul className="landing-points">
                <li>Safe battery handling</li>
                <li>Component-level sorting</li>
                <li>Data wipe recommendation</li>
              </ul>
            </article>

            <article className="landing-card landing-card-rich">
              <h3>Office Electronics</h3>
              <p>
                Monitors, routers, printers, UPS units, keyboards, and old
                workstation parts.
              </p>
            </article>

            <article className="landing-card landing-card-rich">
              <h3>Large Appliances</h3>
              <p>
                Refrigerators, microwaves, and bulky electrical items for
                certified dismantling.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="landing-section landing-section-alt">
        <div className="landing-section-inner">
          <p className="landing-kicker">Process</p>
          <h2 className="landing-section-title">How It Works</h2>
          <div className="landing-steps">
            <article className="landing-step">
              <span className="landing-step-number">01</span>
              <h3>Schedule Pickup</h3>
              <p>Pick category, quantity, and a collection time that suits you.</p>
            </article>
            <article className="landing-step">
              <span className="landing-step-number">02</span>
              <h3>Secure Collection</h3>
              <p>
                Trained partners collect and verify items with tracking updates.
              </p>
            </article>
            <article className="landing-step">
              <span className="landing-step-number">03</span>
              <h3>Sort & Recycle</h3>
              <p>
                Materials are sorted for reuse, recovery, and compliant disposal.
              </p>
            </article>
            <article className="landing-step">
              <span className="landing-step-number">04</span>
              <h3>Impact Dashboard</h3>
              <p>
                Track landfill diversion and your environmental contribution.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section id="impact" className="landing-section">
        <div className="landing-section-inner">
          <p className="landing-kicker">Why It Matters</p>
          <h2 className="landing-section-title">Impact</h2>
          <div className="landing-impact-grid">
            <article className="landing-impact-card">
              <p className="landing-impact-value">12,400+</p>
              <h3>Devices Recycled</h3>
              <p>Collected and processed through verified recycling channels.</p>
            </article>
            <article className="landing-impact-card">
              <p className="landing-impact-value">38.6 t</p>
              <h3>Landfill Waste Diverted</h3>
              <p>
                Toxic e-waste prevented from entering unmanaged dumping sites.
              </p>
            </article>
            <article className="landing-impact-card">
              <p className="landing-impact-value">96%</p>
              <h3>Recovery Efficiency</h3>
              <p>
                Recyclable metals and components recovered for second-use streams.
              </p>
            </article>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <p className="landing-footer-copy">© 2026 EcoCircuit</p>
        </div>
      </footer>
    </div>
  );
}
