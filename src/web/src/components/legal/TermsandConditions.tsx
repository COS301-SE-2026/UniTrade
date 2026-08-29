import React, { useState } from "react"

interface TermsandConditions {
    isOpen: boolean;
    onAccept?: () => void;
    onDecline?: () => void;
    readonly?: boolean;
}

const theSections = [
    {
        title: "1. Eligibility & Acceptance",
        body: `UniTrade is available to currently enrolled students at recognized South African universities. By creating an account, you confirm that the information you provide is accurate, and that you 
    agree to be bound by these Terms. If you do not agree, unfortunately you may not create an account or use UniTrade.`,
    },

    {
        title: "2: Your Account",
        body: `You are responsible for keeping your login credentials and OTP secure. Each user may hold only one account, and use another person details is not allowed
    You must notify us immediately if you believe your account has been compromised.`,
    },

    {
        title: "3. Data Privacy (POPIA)",
        body: `Unitrade collects and processes personal information, including you proof of registration (to verify you degree), profile details, meetup location data, payment metadata
        , and chat logs, in accordance with the Protection of Personaly Information Act (POPIA). This data is used solely to operate the platform (verification, matchingn scheduling, payments, dispute resolution)
        and is not sold to third any parties.`,
    },

    {
        title: "4. Listings & Marketplace Conduct",
        body: `Sellers are responsible for the accuracy of their listings, including item condition, decsription, and price. Items not allowed include counterfeit goods, stolen items or anything illegal to sell.
        UniTrade acts only as a platform connecting buyers and sellers and is not a party to the sale itself.`,
    },

    {
        title: "5. Meetups & In-Person Safety",
        body: `UniTrade provides scheduling tools and a PIN verification system to help confirm the correct handover between buyer and seller. UniTrade does not supervise, monitor, or guarantee the safety of any in-person meetup.
        You meet other users at your own risk. We strongly recommens meeting in busy, public, well-lit locations on or near campus. PIN verification confirms transaction identity only, it is not a safety guarantee.`,
    },

    {
        title: "6. Chat & Communication",
        body: `Chat is provided for coordinating transactions. Harassment, spam, and abusive language are not permitted. Attempting to move payment off-platfrom to avoid fees or buyer/seller protections is discouraged and may be flagged.
        UniTrade reserves the right to moderate or remove content that breaches these terms.`,
    },

    {
        title: "7. Suspension & Termination",
        body: `Accounts may be suspended or terminated for fraud, repeated disputes, abusive behavior, or breach of these Terms, at UniTrade's discretion.`,
    },

    {
        title: "8: Changes to These Terms",
        body: `We may update these Terms from time to time. Continued use of UniTrade after changes take effect constitutes acceptance of the revised Terms.`,
    }

]

export default function TermsAndConditionsModal({
  isOpen,
  onAccept,
  onDecline,
}: TermsandConditions) {
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const [checked, setChecked] = useState(false);

  if (!isOpen) return null;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 24) {
      setHasScrolledToEnd(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="flex w-2xl max-w-2xl flex-col rounded-xl bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-navy-900 text-center">
            Terms &amp; Conditions
          </h2>
          <p className="mt-1 text-sm text-slate-500 text-center">
            Please read and accept before creating your UniTrade account.
          </p>
        </div>
        <div
          onScroll={handleScroll}
          className="max-h-[60vh] overflow-y-auto px-6 py-4 text-sm leading-relaxed text-slate-700"
        >
          {theSections.map((s) => (
            <div key={s.title} className="mb-4">
              <h3 className="mb-1 font-semibold text-navy-800">{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
          <p className="text-xs text-slate-400">
            Last updated: {new Date().toLocaleDateString("en-ZA")}
          </p>
        </div>
      <div className="border-t border-slate-200 px-6 py-4">
          <label className="mb-3 flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={checked}
              disabled={!hasScrolledToEnd}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-navy-700 focus:ring-navy-600 disabled:opacity-40"
            />
            <span>
              I have read and agree to the Terms &amp; Conditions and Privacy
              Policy.
              {!hasScrolledToEnd && (
                <span className="ml-1 text-xs text-slate-400">
                  (scroll to the bottom to enable)
                </span>
              )}
            </span>
          </label>
        <div className="flex justify-end gap-3">
            <button
              onClick={onDecline}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={onAccept}
              disabled={!checked}
              className="rounded-lg bg-navy-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-navy-900 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Accept &amp; Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
