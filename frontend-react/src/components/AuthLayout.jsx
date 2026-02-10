export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark">EW</div>
          <div>
            <div className="brand-name">E-Waste Management</div>
          </div>
        </div>
        <div className="auth-head">
          <div className="auth-title">{title}</div>
          {subtitle ? <div className="auth-subtitle">{subtitle}</div> : null}
        </div>
        {children}
        {footer ? <div className="auth-footer">{footer}</div> : null}
      </div>
    </div>
  );
}
