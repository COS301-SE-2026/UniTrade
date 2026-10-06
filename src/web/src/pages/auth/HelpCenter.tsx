import React, { useState, useMemo } from "react";
import {
  IconChevronDown,
  IconChevronUp,
  IconSearch,
  IconBookmark,
  IconUpload,
  IconCreditCard,
  IconShield,
  IconStar,
  IconAlertCircle,
  IconArrowLeft,
  IconX,
  IconMail,
  IconLockCode,
  IconBrandHipchat,
  IconFlag,
  IconPigMoney,
  IconCalendarEvent,
  IconShieldLock,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import logo from "../../assets/Transaprent Logo.png"

interface QuickLinkItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  details: string[];
}

interface FaqItem {
  question: string;
  answer: string;
}


function Navbar() {
  const navigate = useNavigate();
  return (
    <nav className="bg-white dark:bg-navy-800 border-b border-gray-100 dark:border-white/10 sticky top-0 z-50">
      <div className="max-w-full mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 text-gray-500 hover:text-[#003366] hover:bg-gray-100 rounded-full transition-all"
          >
            <IconArrowLeft size={20} />
          </button>
          <div className="flex items-end gap-2">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-white flex items-center justify-center">
              <img
                src={logo}
                alt="UniTrade Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://placehold.co/120x40/0d1f4e/white?text=UniTrade";
                }}
              />
            </div>
            <h1 className="font-bold text-navy-700 dark:text-white text-3xl leading-none">
              UniTrade
            </h1>
          </div>
        </div>
      </div>
    </nav>
  );
}

function QuickLinkOverlay({
  link,
  onClose,
}: Readonly<{
  link: QuickLinkItem;
  onClose: () => void;
}>) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 ">
      <div className="bg-white rounded-2xl w-full max-w-lg flex flex-col max-h-[75vh] shadow-xl">
        <div className="flex items-start gap-3 px-6 py-5 border-b border-gray-100">
          <div className="w-10 h-10 rounded-lg bg-[#eef4fa] flex items-center justify-center flex-shrink-0">
            {link.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-[#003366] text-base">
              {link.title}
            </div>
            <div className="text-xs text-gray-400">{link.description}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors flex-shrink-0"
          >
            <IconX size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
          {link.details.map((paragraph, i) => (
            <p
              key={`${link.title}-detail-${i}`}
              className="text-sm text-gray-600 leading-relaxed"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeLink, setActiveLink] = useState<QuickLinkItem | null>(null);

  
  const toogleFaq = (index: number): void => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const quickLinks: QuickLinkItem[] = [
    {
      icon: <IconUpload size={22} className="text-[#003366]" />,
      title: "Listing a product",
      description: "Create and manage your product listing.",
      details: [
        "Go to upload a listing and fill in the details of the listing such as the price, condition and at least one photo of the item",
        "You can edit or remove a listing at any time before it is reserved by a buyer.",
        "Listings are automatically risk-scored (reservation image checks, content classification) and routed to go live, or held for an admin review.",
      ],
    },
    {
      icon: <IconBookmark size={22} className="text-[#003366]" />,
      title: "Reserving items",
      description: "How reservations work and when they expire.",
      details: [
        "When you reserve a listing , you have 24 hours to coordinate a meetup with the seller, if the meetup is not scheduled the reservation is not going to expire and relisted.",
        "Once accepted, the item is held for you and will not be shown to other buyers until the reservation is completed or cancelled",
        "You can cancel a pending reservation at any time from your Reservations page",
      ],
    },
    {
      icon: <IconBrandHipchat size={22} className="text-[#003366]" />,
      title: "In-app chat",
      description: "How the In-app chat work and when you start chatting.",
      details: [
        "Coordinate directly with the other party to arrange meetup time and location through a meetup scheduler.",
        "The chat thread opens immediately upon reservation creation, populated with an automated greeting. Both parties can immediately coordinate logistics.",
        "It is very important to schedule a meeting with the other party, because that is what will be used to stop the timer.",
        "If a meetup is not scheduled, then the buyer will not be allowed to pay (the pay button will be disabled), so to enable the pay button the buyer needs to check in at the location, and checkin can only be done if a meetup was arranged.",
      ],
    },
    {
      icon: <IconCreditCard size={22} className="text-[#003366]" />,
      title: "Payment and Payouts",
      description: "How payments are processed and when you get paid.",
      details: [
        "UniTrade operates as a direct escrow-style gateway via PayFast. Payments complete immediately at the physical meetup upon entering the 6-digit confirmation PIN.",
        "Sellers receive payouts within 2-3 business days after a completed and confirmed handover.",
        "You can track payout status from your Seller Dashboard.",
      ],
    },
    {
      icon: <IconFlag size={22} className="text-[#003366]" />,
      title: "Dispute Reporting",
      description: "How you can report a dispute.",
      details: [
        "After a transaction and you are not happy you should always report to the system as soon as possible, provide enough evidence for the admin to decide on a punishment.",
        "If you are reported you are always given a chance to state your case, ensure you have enough evidence to prove your innocence.",
        "Verifications operate on a 48-hour SLA; disputed operate on a 72-hour SLA, processed in strict FIFO chronological sequence.",
      ],
    },
    {
      icon: <IconShield size={22} className="text-[#003366]" />,
      title: "Buyer Protection",
      description: "Whats covered is something goes wrong.",
      details: [
        "A buyer can report a seller to the system if they are not happy with their product after a transaction.",
        "As a buyer you have to meetup with the seller on campus and inspect the product before commiting and paying.",
        "As a buyer you can review the seller after the transaction is complete, if you were not happy with the seller's behaviour, this is where you express your feelings.",
      ],
    },
    {
      icon: <IconLockCode size={22} className="text-[#003366]" />,
      title: "PIN-based handover confirmation",
      description: "How the PIN-based confirmation works.",
      details: [
        "Upon payment completion, the buyer receives a PIN they have to give to the seller, the PIN is used to confirm that the handover actually happened.",
        "If the PIN is not entered the transaction is never labelled complete, the listing status is always going to stay as reserved.",
      ],
    },
    {
      icon: <IconStar size={22} className="text-[#003366]" />,
      title: "Reviews and ratings",
      description: "How to leave and respond to reviews.",
      details: [
        "After a reservation is completed, both buyer and seller can leave a rating and short review.",
        "Reviews are public on a user's profile and can't be edited after posting, so double-check before submitting.",
        "You can reply once to a review you've received to add context.",
      ],
    },
    {
      icon: <IconAlertCircle size={22} className="text-[#003366]" />,
      title: "Reporting a problem",
      description: "Flag a listing, user, or dispute an order.",
      details: [
        "Use the 'Report' option on any listing, profile, or chat to flag something to our team.",
        "For order-specific issues, open a dispute from the Reservation page instead — it routes faster.",
        "We aim to review reports within 24 hours.",
      ],
    },
    {
      icon: <IconLockCode size={22} className="text-[#003366]" />,
      title: "Handover PIN Protocol",
      description: "The 5 steps from check-in to confirmed handover",
      details: [
        "Step 1: Buyer and seller meet at the agreed campus location.",
        "Step 2: Buyer checks in on their phone, unlocking the Pay button",
        "Step 3: Buyer completes payment via PayFast and inspects the textbook.",
        "Step 4: Seller's screen displays a 6-digit confirmation PIN.",
        "Step 5: Buyer enters the 6-digit PIN on their phone to complete the trade.",
      ],
    },
    {
      icon: <IconPigMoney size={22} className="text-[#003366]" />,
      title: "Smart Budget",
      description: "Set a budget and unlock seller bundle discounts.",
      details: [
        "Set a total budget cap, then select listings from the same seller until your combined total reaches, but does not exceed, that cap.",
        "When your selection qualifies for a seller's bundle discount, it is applied automatically. You don't need to request it or negotiate it in chat.",
        "You can add or remove listings at any time before reserving, and the running total and any discount update as you go.",
      ],
    },
    {
      icon: <IconCalendarEvent size={22} className="text-[#003366]" />,
      title: "Timetable Sync",
      description: "Import your timetable to find free slots that match.",
      details: [
        "Export your timetable from your calendar app as an .ics file, then import it into UniTrade.",
        "UniTrade compares your classes with the other person's and highlights the gaps you both have free on campus.",
        "Pick one of the highlighted slots when scheduling your meetup. A scheduled meetup is required to check in and unlock payment.",
      ],
    },
    {
      icon: <IconShieldLock size={22} className="text-[#003366]" />,
      title: "POPIA Privacy",
      description: "How your student data is protected and deleted.",
      details: [
        "Your proof of registration is only used to verify that you are a student.",
        "To protect your data in line with POPIA, proof-of-registration files are automatically and permanently deleted after 30 days.",
        "Deletion is automated, so you don't need to request it. If you are asked to resubmit later, you can upload a fresh copy.",
      ],
    },
  ];

  const faqs: FaqItem[] = [
    {
      question: "How long does verification take?",
      answer:
        "An admin reviews your proof of registration, usually within 48 hours.",
    },
    {
      question: "What can I do while I'm waiting for verification?",
      answer:
        "You get partial access to the system, as a buyer you can only browse and view listing, as a seller you can create a listing but it is automatically saved as draft until you are fully verified.",
    },
    {
      question: "Can I be both a buyer and a seller?",
      answer:
        "Yes you can be both be a buyer and a seller, just use the switch on the side bar to access your other dashboard.",
    },
    {
      question: "Can I resubmit if my verification was sent back?",
      answer:
        "If an admin marks your verification for resubmission, you can re-upload your proof of registration for another review — resubmitting doesn't guarantee approval. ",
    },
    {
      question: "Can I edit a listing after it's live?",
      answer:
        "Yes you can edit your listing, but edit is going to be blocked once the listing is reserved because that will not be fair to the buyer.",
    },
    {
      question: "Can I report a listing I think is fake or misleading?",
      answer:
        "Yes, If you see a listing you suspect of being fake please report it immediately, and admin will review it and decide on the verdict, either the seller will receive a warning or can be banned from the system.",
    },
    {
      question: "How long does a reservation last?",
      answer:
        "Reservations last 24 hours by default. If there is no communication or a schedules meeting between the buyer and seller within this window, the reservation expires and the item is re-listed automatically.",
    },
    {
      question: "How is a sale paid for and completed?",
      answer:
        "Payment happens in person when you meet. Once the meet-up is underway, the buyer pays through PayFast; when the payment goes through, the seller is shown a 6-digit PIN. The buyer enters that PIN to confirm they've received the item, and the sale is marked complete and the listing sold right away. The PIN is the final handshake — there's no separate waiting period or payout step.",
    },
    {
      question: "Can I negotiate the price with a seller?",
      answer:
        "No — items sell at the price the seller set. There's no in-app offers or haggling, and the amount at checkout is always the listed price. You can still use the listing's question feature to ask the seller about the item before you reserve it.",
    },
    {
      question: "What happens if I don't collect a reserved item on time?",
      answer:
        "If you miss the collection window without communicating, the seller has the right to cancel the transaction and make the listing active for other university students again.",
    },
    {
      question: "What is my reputation score and how is it calculated?",
      answer:
        "It's a trust score out of 100 that shows how trustworthy you are to trade with, based on the star ratings buyers leave you and how many reviews you've received.",
    },
    {
      question: "What do I do if I am not happy with the product?",
      answer:
        "If the item isn't as described or has hidden damage, tap 'Report listing quality' on the reservation. It appears once you and the seller have both checked in at the meet-up (before any payment is processed).",
    },
  ];

  const normalisedQuery = searchQuery.trim().toLowerCase();

  const filteredQuickLinks = useMemo(() => {
    if (!normalisedQuery) return quickLinks;
    return quickLinks.filter((link) =>
      `${link.title} ${link.description} ${link.details.join(" ")}`
        .toLowerCase()
        .includes(normalisedQuery),
    );
  }, [normalisedQuery]);

  const filteredFaqs = useMemo(() => {
    if (!normalisedQuery) return faqs;
    return faqs.filter((faq) =>
      `${faq.question} ${faq.answer}`.toLowerCase().includes(normalisedQuery),
    );
  }, [normalisedQuery]);

  const hasResults = filteredQuickLinks.length > 0 || filteredFaqs.length > 0;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-800 font-sans pb-16">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 mt-8 relative">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-visible">
          <div className="flex-1 w-full">
            <h2 className="text-3xl font-extrabold text-[#003366] tracking-tight">
              Help Center
            </h2>
            <p className="text-sm text-gray-500 mt-1 mb-6">
              Browse quick guides and FAQs
            </p>

            <div className="relative w-full max-w-lg">
              <input
                type="text"
                placeholder="Search for help articles..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchQuery(e.target.value)
                }
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#003366] focus:bg-white transition-all"
              />
              <IconSearch
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>
          </div>
        </div>
      </div>

      {!hasResults && (
        <div className="max-w-5xl mx-auto px-6 mt-10">
          <p className="text-center text-sm text-gray-400 py-6">
            No results for "{searchQuery}". Try a different word, or ask Alex.
          </p>
        </div>
      )}

      {filteredQuickLinks.length > 0 && (
        <div className="max-w-5xl mx-auto px-6 mt-10">
          <h3 className="text-xs font-bold text-[#003366] uppercase tracking-wider mb-4">
            Quick Links
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredQuickLinks.map((link) => (
              <button
                type="button"
                key={link.title}
                onClick={() => setActiveLink(link)}
                className="bg-white border border-gray-100 p-5 rounded-xl shadow-xs hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#eef4fa] flex items-center justify-center mb-3 group-hover:bg-[#dce9f7] transition-colors">
                  {link.icon}
                </div>
                <h4 className="text-sm font-bold text-gray-800 mb-1">
                  {link.title}
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {link.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {filteredFaqs.length > 0 && (
        <div className="max-w-5xl mx-auto px-6 mt-12">
          <h3 className="text-xs font-bold text-[#003366] uppercase tracking-wider mb-4">
            Frequently Asked Questions
          </h3>
          <div className="flex flex-col gap-3">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openFaq === filteredFaqs.indexOf(faq);
              return (
                <div
                  key={faq.question}
                  className="bg-white border border-gray-200/80 rounded-xl overflow-hidden shadow-xs transition-all"
                >
                  <button
                    type="button"
                    onClick={() => toogleFaq(idx)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left font-semibold text-sm text-gray-800 hover:bg-gray-50 transition-colors"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? (
                      <IconChevronUp size={18} className="text-gray-500" />
                    ) : (
                      <IconChevronDown size={18} className="text-gray-500" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-gray-600 leading-relaxed border-t border-gray-50 bg-slate-50/50">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 mt-12">
        <h3 className="text-xs font-bold text-[#003366] uppercase tracking-wider mb-4">
          Still Need Help?
        </h3>
        <a
          href="mailto:devnexus28@gmail.com"
          className="bg-white border border-gray-200/80 rounded-xl p-5 flex items-center gap-4 hover:border-gray-300 hover:shadow-xs transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-[#dbeafe] text-[#003366] flex items-center justify-center flex-shrink-0">
            <IconMail size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-800">Email support</h4>
            <p className="text-xs text-gray-500 mt-0.5">devnexus28@gmail.com</p>
          </div>
        </a>
      </div>

      {activeLink && (
        <QuickLinkOverlay
          link={activeLink}
          onClose={() => setActiveLink(null)}
        />
      )}
    </div>
  );
}
