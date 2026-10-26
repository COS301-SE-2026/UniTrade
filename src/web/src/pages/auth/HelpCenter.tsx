import React, {useState, useMemo } from "react";
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
          <div className="w-10 h-10 rounded-lg bg-[#eef4fa] flex items-center justify-center shrink-0">
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
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors shrink-0"
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
        "Add a title, description, category, price, condition and at least one photo. You need a verified student account to publish.",
        "You can edit listings that are still available. Reserved, sold, pending and rejected listings cannot be edited.",
        "Use the listing controls to unpublish or remove your item.",
      ],
    },
    {
      icon: <IconBookmark size={22} className="text-[#003366]" />,
      title: "Reserving items",
      description: "How reservations work and when they expire.",
      details: [
        "A reservation starts with a 24-hour response window. Responding or confirming a meetup affects how long it stays active.",
        "The item is held for you until the reservation is completed, cancelled or expires.",
        "You can cancel before the meetup is confirmed from your Reservations page.",
      ],
    },
    {
      icon: <IconBrandHipchat size={22} className="text-[#003366]" />,
      title: "In-app chat",
      description: "Chat with the other student and arrange your meetup.",
      details: [
        "Once the seller acknowledges your reservation, use chat to agree on a time and place or suggest a meetup.",
        "You can use your timetables to find a time that works for both of you. The meetup must be confirmed before check-in and payment.",
      ],
    },
    {
      icon: <IconCreditCard size={22} className="text-[#003366]" />,
      title: "Payment and Handover",
      description: "Pay for your item and confirm the handover.",
      details: [
        "After your meetup is confirmed and you check in, pay through PayFast.",
        "The seller will show you a six-digit PIN. Enter it in UniTrade to confirm you received the item and complete the trade.",
      ],
    },
    {
      icon: <IconFlag size={22} className="text-[#003366]" />,
      title: "Dispute Reporting",
      description: "Report a listing or an item-quality issue.",
      details: [
        "To report a listing, choose Report Listing on its detail page.",
        "For an item-quality issue, choose Report listing quality on your reservation after you and the seller check in. Add photos to your report.",
      ],
    },
    {
      icon: <IconShield size={22} className="text-[#003366]" />,
      title: "Buyer Protection",
      description: "Check your item and report any problems.",
      details: [
        "Meet in person and check the item before you pay.",
        "If the item has a problem, report it from your reservation after you and the seller check in.",
        "After the trade, you and the seller can each leave one review.",
      ],
    },
    {
      icon: <IconLockCode size={22} className="text-[#003366]" />,
      title: "PIN-based handover confirmation",
      description: "Confirm that you received your item.",
      details: [
        "After your payment is confirmed, the seller will show you a six-digit PIN.",
        "Enter the PIN in UniTrade to confirm you received the item and complete the trade.",
      ],
    },
    {
      icon: <IconStar size={22} className="text-[#003366]" />,
      title: "Reviews and ratings",
      description: "Who can leave a review and when.",
      details: [
        "After you confirm the handover PIN, you and the other student can each leave one rating and an optional comment.",
        "Check your review before submitting; you cannot edit it later.",
      ],
    },
    {
      icon: <IconAlertCircle size={22} className="text-[#003366]" />,
      title: "Reporting a problem",
      description: "Report a listing or an item-quality issue.",
      details: [
        "To report a listing, choose Report Listing on its detail page.",
        "To report an item-quality issue, choose Report listing quality on your reservation after you and the seller check in.",
      ],
    },
    {
      icon: <IconLockCode size={22} className="text-[#003366]" />,
      title: "Handover PIN Protocol",
      description: "Follow these steps to complete your trade.",
      details: [
        "Meet at the agreed campus location and check in through UniTrade.",
        "Inspect the item, then pay through PayFast.",
        "The seller will show you a six-digit PIN. Enter it in UniTrade to confirm the handover.",
      ],
    },
    {
      icon: <IconPigMoney size={22} className="text-[#003366]" />,
      title: "Smart Budget",
      description: "Find items that fit your budget.",
      details: [
        "Choose listings and set your total budget. Smart Budget can select items across multiple sellers to help you get the most for your money.",
        "Eligible bundle discounts are applied automatically.",
        "Review your total before confirming your reservation.",
      ],
    },
    {
      icon: <IconCalendarEvent size={22} className="text-[#003366]" />,
      title: "Timetable Sync",
      description: "Find a meetup time that works for both of you.",
      details: [
        "Export your timetable as an .ics file and import it into UniTrade.",
        "For an active reservation, UniTrade suggests times when you are both free.",
        "Choose a time and propose a meetup in chat. The meetup must be accepted before check-in and payment.",
      ],
    },
    {
      icon: <IconShieldLock size={22} className="text-[#003366]" />,
      title: "POPIA Privacy",
      description: "How your student verification file is handled.",
      details: [
        "Your proof of registration is used to verify your student status.",
        "It is automatically deleted 30 days after your verification decision. If you need to resubmit, you can upload a new copy.",
      ],
    },
  ];

  const faqs: FaqItem[] = [
    {
      question: "How long does verification take?",
      answer:
        "We aim to review your verification within 48 hours.",
    },
    {
      question: "What can I do while I'm waiting for verification?",
      answer:
        "You can browse listings and create drafts. You need verified student status to publish or reserve an item.",
    },
    {
      question: "Can I be both a buyer and a seller?",
      answer:
        "Yes. Use the switch in the sidebar to move between your buyer and seller dashboards.",
    },
    {
      question: "Can I resubmit if my verification was sent back?",
      answer:
        "Yes. Upload your proof of registration again for review.",
    },
    {
      question: "Can I edit a listing after it's live?",
      answer:
        "Yes, unless it is reserved, sold, pending or rejected.",
    },
    {
      question: "Can I report a listing I think is fake or misleading?",
      answer:
        "Yes. Choose Report Listing on the listing's detail page and tell us why you're reporting it.",
    },
    {
      question: "How long does a reservation last?",
      answer:
        "A reservation starts with a 24-hour response window. Reply to the seller to reset the timer, or confirm a meetup to pause it. If the time runs out, the item becomes available again.",
    },
    {
      question: "How is a sale paid for and completed?",
      answer:
        "After your meetup is confirmed, check in and pay through PayFast. The seller will show you a six-digit PIN; enter it in UniTrade to confirm you received the item and complete the sale.",
    },
    {
      question: "Can I negotiate the price with a seller?",
      answer:
        "You can't make an offer in UniTrade, but you can ask the seller a question before reserving. Eligible bundle discounts may apply when you use Smart Budget.",
    },
    {
      question: "What happens if I don't collect a reserved item on time?",
      answer:
        "Check in during the meetup window. If you and the seller miss it, the reservation is cancelled and the item becomes available again.",
    },
    {
      question: "What is my reputation score and how is it calculated?",
      answer:
        "Your score is out of 100 and is based on your average rating and the number of reviews you've received.",
    },
    {
      question: "What do I do if I am not happy with the product?",
      answer:
        "Check the item before paying. If it is damaged or not as described, check in with the seller and choose Report listing quality on your reservation.",
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
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-visible">
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
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-[#003366] focus:bg-white transition-all"
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
            No results for "{searchQuery}". Try a different word.
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
                className="bg-white border border-gray-100 p-5 rounded-xl shadow-2xs hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group"
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
                  className="bg-white border border-gray-200/80 rounded-xl overflow-hidden shadow-2xs transition-all"
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
          className="bg-white border border-gray-200/80 rounded-xl p-5 flex items-center gap-4 hover:border-gray-300 hover:shadow-2xs transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-[#dbeafe] text-[#003366] flex items-center justify-center shrink-0">
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
