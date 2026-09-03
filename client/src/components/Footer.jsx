import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-paper">
      <div className="container-editorial py-16">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <span className="font-serif text-xl text-ink">Organis</span>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-stone-500">
              An educational prototype for AI-assisted organ compatibility analysis and coordinated allocation.
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Platform</p>
            <ul className="mt-4 space-y-2 text-sm text-stone-600">
              <li><Link to="/#how-it-works" className="hover:text-forest-700">How it works</Link></li>
              <li><Link to="/#matching" className="hover:text-forest-700">AI matching</Link></li>
              <li><Link to="/assistant" className="hover:text-forest-700">Organis Assistant</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Important</p>
            <p className="mt-4 max-w-sm text-xs leading-relaxed text-stone-500">
              AI recommendations are decision-support outputs only and must be reviewed by qualified clinical and
              authorized allocation personnel. This platform has not undergone clinical validation and is not
              intended for use in real medical decision-making.
            </p>
          </div>
        </div>
        <div className="mt-12 border-t border-stone-200 pt-6 text-xs text-stone-400">
          © {new Date().getFullYear()} Organis. Educational prototype — fictional data only.
        </div>
      </div>
    </footer>
  );
}
