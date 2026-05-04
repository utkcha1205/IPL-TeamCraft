"use client";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="border-t mt-12"
      style={{ backgroundColor: "var(--bg-header)", borderColor: "var(--border-color)" }}
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* CTA Section */}
        <div className="text-center mb-6">
          <h3
            className="text-lg font-semibold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Get in Touch
          </h3>
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            Have feedback, ideas, or want to collaborate? Reach out to us!
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="mailto:support@guidezy.in"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              support@guidezy.in
            </a>
            <a
              href="mailto:utkarsh@guidezy.in"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors card-hover"
              style={{
                backgroundColor: "var(--bg-card)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-color)",
              }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              utkarsh@guidezy.in
            </a>
            <a
              href="mailto:founder@guidezy.in"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors card-hover"
              style={{
                backgroundColor: "var(--bg-card)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-color)",
              }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              founder@guidezy.in
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t my-6" style={{ borderColor: "var(--border-color)" }} />

        {/* Copyright */}
        <div className="text-center">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            © {currentYear} IPL TeamCraft by{" "}
            <a
              href="https://guidezy.in"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:underline"
              style={{ color: "var(--text-secondary)" }}
            >
              Guidezy
            </a>
            . All rights reserved.
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Built with ❤️ by Utkarsh Chaturvedi
          </p>
        </div>
      </div>
    </footer>
  );
}
