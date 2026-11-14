import React from 'react';
import { X } from 'lucide-react';

export type PolicyPage = 'about' | 'privacy' | 'terms' | 'contact' | 'ads' | null;

interface PolicyModalProps {
  page: PolicyPage;
  onClose: () => void;
  nonPersonalizedAds: boolean;
  onToggleNonPersonalized: (val: boolean) => void;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({
  page,
  onClose,
  nonPersonalizedAds,
  onToggleNonPersonalized,
}) => {
  if (!page) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Site information and ad settings"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-[#131722] border border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
          <h2 className="font-display text-lg font-bold text-white">
            {page === 'about' && 'About Axiom Puzzle Studio'}
            {page === 'privacy' && 'Privacy Policy & AdSense Cookies'}
            {page === 'terms' && 'Terms of Use'}
            {page === 'contact' && 'Publisher Contact'}
            {page === 'ads' && 'Ad Preferences'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-sm text-slate-300 leading-relaxed max-h-[70vh] overflow-y-auto">
          {page === 'about' && (
            <>
              <p>
                Axiom is a browser-based problem-solving studio featuring sixteen original and classic logic, spatial, routing, and deduction games built for instant play without installs or splash screens.
              </p>
              <p>
                Every puzzle runs locally in your browser with client-side progress tracking stored in <code className="font-mono text-xs text-sky-300">localStorage</code>.
              </p>
            </>
          )}

          {page === 'privacy' && (
            <>
              <p>
                Axiom stores your puzzle completion counts, best scores, and sound preferences strictly inside your browser&apos;s local storage. No account registration is required.
              </p>
              <p>
                <strong>Third-Party Advertising (Google AdSense):</strong> Google, as a third-party vendor, uses cookies to serve display ads on this site. Google&apos;s use of advertising cookies enables it and its partners to serve ads based on visits to this site and other sites on the Internet.
              </p>
              <p>
                You may opt out of personalized advertising at any time using the Ad Preferences toggle below or through Google&apos;s Ad Settings.
              </p>
            </>
          )}

          {page === 'terms' && (
            <>
              <p>
                All sixteen interactive puzzles on Axiom are provided free for personal, educational, and recreational use directly in modern web browsers.
              </p>
              <p>
                Display advertising supports ongoing hosting and development. Ads are deliberately separated from active game boards to prevent accidental clicks.
              </p>
            </>
          )}

          {page === 'contact' && (
            <>
              <p>
                For publisher inquiries, bug reports, level feedback, or advertising compliance questions, reach the site maintainer via your configured domain contact channel.
              </p>
              <p className="text-xs text-slate-400">
                Before submitting your domain for Google AdSense review, ensure <code className="font-mono text-slate-300">/ads.txt</code> contains your verified <code className="font-mono text-slate-300">pub-XXXXXXXXXXXXXXXX</code> publisher ID and your <code className="font-mono text-slate-300">VITE_ADSENSE_*</code> environment variables are configured.
              </p>
            </>
          )}

          {page === 'ads' && (
            <p>
              Choose whether Google AdSense display units may use personalized cookies or serve strictly non-personalized contextual ads.
            </p>
          )}

          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-white">Non-Personalized Ads Mode</div>
              <div className="text-xs text-slate-400">
                {nonPersonalizedAds
                  ? 'Contextual ads only (personalized cookies disabled)'
                  : 'Standard Google AdSense personalization enabled'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onToggleNonPersonalized(!nonPersonalizedAds)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                nonPersonalizedAds
                  ? 'bg-emerald-400 text-slate-950'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {nonPersonalizedAds ? 'Contextual Only: ON' : 'Switch to Contextual Only'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
