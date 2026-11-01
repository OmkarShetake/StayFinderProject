import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="sf-footer">
      <div className="sf-footer-top">
        <div className="sf-footer-col">
          <div className="sf-footer-col-title">Support</div>
          <a className="sf-footer-link" href="#">Help Centre</a>
          <a className="sf-footer-link" href="#">AirCover</a>
          <a className="sf-footer-link" href="#">Anti-discrimination</a>
          <a className="sf-footer-link" href="#">Disability support</a>
          <a className="sf-footer-link" href="#">Cancellation options</a>
          <a className="sf-footer-link" href="#">Report a concern</a>
        </div>
        <div className="sf-footer-col">
          <div className="sf-footer-col-title">Hosting</div>
          <Link className="sf-footer-link" to="/host">StayFinder your home</Link>
          <a className="sf-footer-link" href="#">AirCover for hosts</a>
          <a className="sf-footer-link" href="#">Hosting resources</a>
          <a className="sf-footer-link" href="#">Community forum</a>
          <a className="sf-footer-link" href="#">Host responsibly</a>
          <a className="sf-footer-link" href="#">Find a co-host</a>
        </div>
        <div className="sf-footer-col">
          <div className="sf-footer-col-title">StayFinder</div>
          <a className="sf-footer-link" href="#">Newsroom</a>
          <a className="sf-footer-link" href="#">New features</a>
          <a className="sf-footer-link" href="#">Careers</a>
          <a className="sf-footer-link" href="#">Investors</a>
          <a className="sf-footer-link" href="#">Gift cards</a>
          <a className="sf-footer-link" href="#">Emergency stays</a>
        </div>
      </div>
      <div className="sf-footer-bottom">
        <div className="sf-footer-copy">
          © 2026 StayFinder, Inc. · <a href="#">Privacy</a> · <a href="#">Terms</a> · <a href="#">Sitemap</a>
        </div>
        <div className="sf-footer-social">
          <a className="sf-footer-social-btn" href="#" title="Facebook">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
            </svg>
          </a>
          <a className="sf-footer-social-btn" href="#" title="Twitter/X">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a className="sf-footer-social-btn" href="#" title="Instagram">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
