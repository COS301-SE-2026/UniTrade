import React, { useState } from "react"

interface TermsandConditions {
    isOpen: boolean;
    onAccept?: () => void;
    onDecline?: () => void;
    readonly?: boolean;
}

const theSections = [
    {
        title: "1. E;igibility & Acceptance",
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

export default function TersmAndConditions({
    isOpen,
    onAccept,
    onDecline,
    readonly = false,
}: TermsandConditions) {
    const [hasScrolledToEnd, setHasScrolledToEnd] = useState(readonly);
    const [checked, setChecked] = useState(false)

    if (!isOpen) return null;

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (readonly) return;
        const el = e.currentTarget;

        if (el.scrollHeight - el.scrollTop - el.clientHeight < 24) {
            setHasScrolledToEnd(true);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 p-4">
            <div className="flex w-full max-w-2xl rounded-2xl bg-white shadow-xl border border-gray-100 dark:bg-navy-800 dark:border-white/10">
                <div className="border-b border-gray-100 dark:border-white/10 px-6 py-4">
                    <h2 className="text-lg font-semibold text-navy-700 dark:text-white">
                        Terms &amp; Conditions
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {readonly
                            ? "UniTrade's current Terms and Conditions."
                            : "Please read and accept before creating your UniTrade account."
                        }
                    </p>
                </div>

                <div
                    onScroll={handleScroll}
                    className="max-h-[60vh] overflow-y-auto px-6 py-4 text-sm leading-related text-gray-700 dark:text-gray-300"
                >
                    {theSections.map((s) => (
                        <div key={s.title} className="mb-4">
                            <h3 className="mb-1 font-semibold text-navy-700 dark:text-white">
                                {s.title}
                            </h3>
                            <p>{s.body}</p>
                        </div>
                    ))}
                    <p className="text-xs text-gray-400">
                        Last updated: {new Date().toLocaleDateString("en-ZA")}
                    </p>
                </div>

                <div className="border-t border-gray-100 dark:border-white/10 px-6 py-4">
                    {readonly ? (
                        <div className="flex justify-end">
                            <button
                                onClick={onDecline}
                                className="rounded-full bg-navy-700 hover:bg-navy-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        <>
                            <label className="mb-3 flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={!hasScrolledToEnd}
                                    onChange={(e) => setChecked(e.target.checked)}
                                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-navy-700 focus:ring-navy-500 disabled:opacity-40"
                                />
                                <span>
                                    I have read and agree to the Terms &amp; Conditions.
                                    {!hasScrolledToEnd && (
                                        <span className="ml-1 text-xs text-gray-400">
                                            (scroll to the bottom enable)
                                        </span>
                                    )}
                                </span>
                            </label>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={onDecline}
                                    className="rounded-full px-6 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5">
                                    Cancel
                                </button>
                                <button
                                    onClick={onAccept}
                                    disabled={!checked}
                                    className="rounded-full bg-navy-700 hover:bg-navy-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:bg-gray-300 disabled:hover:bg-gray-300">
                                    Accept &amp; Continue
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}