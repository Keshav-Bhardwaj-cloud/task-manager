import { ArrowRight, CheckCircle2, LayoutDashboard, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const featureList = [
  {
    title: 'Focused workflow',
    description: 'Plan, complete, and review tasks without distraction.',
    icon: LayoutDashboard,
  },
  {
    title: 'Reliable auth',
    description: 'Built around the verified JWT + cookie session flow of the backend.',
    icon: ShieldCheck,
  },
  {
    title: 'Progress visibility',
    description: 'Track what is done and what still needs attention in one place.',
    icon: TrendingUp,
  },
];

export default function LandingPage() {
  return (
    <div className="landing-page">
      <header className="topbar">
        <div className="brand-mark">
          <div className="brand-icon">T</div>
          <span>TaskPilot</span>
        </div>

        <nav className="topbar-actions">
          <Link to="/login" className="link-button">Log in</Link>
          <Link to="/register" className="button button-primary">Get started</Link>
        </nav>
      </header>

      <main className="hero-shell">
        <section className="hero-copy">
          <div className="badge-line">
            <Sparkles size={16} />
            <span>Built for focused teams and solo builders</span>
          </div>

          <h1>Turn daily work into a calm, confident routine.</h1>
          <p>
            TaskPilot keeps your work visible, manageable, and moving forward with a clean dashboard built around the real task manager backend.
          </p>

          <div className="hero-actions">
            <Link to="/register" className="button button-primary large-button">
              Create account
              <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="button button-secondary large-button">
              Sign in
            </Link>
          </div>

          <div className="hero-stats">
            <div>
              <strong>24/7</strong>
              <span>task access</span>
            </div>
            <div>
              <strong>JWT</strong>
              <span>secure sessions</span>
            </div>
            <div>
              <strong>100%</strong>
              <span>task-focused UI</span>
            </div>
          </div>
        </section>

        <aside className="dashboard-preview" aria-label="Task dashboard preview">
          <div className="preview-header">
            <div className="preview-dots">
              <span />
              <span />
              <span />
            </div>
            <span>Overview</span>
          </div>

          <div className="preview-body">
            <div className="mini-stat card-soft">
              <span>Total tasks</span>
              <strong>18</strong>
            </div>
            <div className="mini-stat card-soft">
              <span>Completed</span>
              <strong>12</strong>
            </div>

            <div className="task-list-preview">
              <div className="preview-task done">
                <CheckCircle2 size={18} />
                <span>Finalize sprint notes</span>
              </div>
              <div className="preview-task">
                <div className="task-check" />
                <span>Review customer feedback</span>
              </div>
              <div className="preview-task">
                <div className="task-check" />
                <span>Prepare release checklist</span>
              </div>
            </div>
          </div>
        </aside>
      </main>

      <section className="feature-section">
        {featureList.map(({ title, description, icon: Icon }) => (
          <article key={title} className="feature-card">
            <div className="feature-icon">
              <Icon size={22} />
            </div>
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </section>

      <footer className="page-footer">
        <span>TaskPilot</span>
        <span>Built for modern task management</span>
      </footer>
    </div>
  );
}
