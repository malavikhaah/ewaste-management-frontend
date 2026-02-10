import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="home-shell">
      <header className="home-header">
        <div className="brand">
          <div className="brand-mark">EW</div>
          <div className="brand-text">
            <div className="brand-name">E-Waste Management</div>
          </div>
        </div>

      </header>

      <section className="home-hero-centered">
        <div className="home-hero-content">
          <span className="home-pill">E-Waste Portal</span>
          <h1 className="home-headline">
            Recover. Reuse. <span className="home-highlight">Renew.</span>
          </h1>
          <p className="home-subtitle">
            Sign in to continue or create a new account to get started.
          </p>
          <div className="home-cta">
            <Link className="btn primary" to="/login">
              Login
            </Link>
            <Link className="btn ghost" to="/register">
              Register
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
