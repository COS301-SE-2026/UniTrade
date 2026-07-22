import React, { useRef, useState, useEffect, useMemo } from 'react';
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
  IconSend,
  IconX,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import AlexAvatar from './AlexAvatar.tsx';
import logo from "../../assets/logo.jpeg"

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

interface Message {
  role: 'user' | 'assistant';
  content: string;
}


function Navbar() {
  const navigate = useNavigate()
  return (
    <nav className="bg-white dark:bg-navy-800 border-b border-gray-100 dark:border-white/10 sticky top-0 z-50">
      <div className="max-w-full mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-500 hover:text-[#003366] hover:bg-gray-100 rounded-full transition-all">
            <IconArrowLeft size={20} />
          </button>
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
          <h1 className="font-bold text-navy-700 dark:text-white text-3xl mb-2">UniTrade</h1>
        </div>
      </div>
    </nav>
  );
}

function QuickLinkOverlay({
  link,
  onClose,

}: {
  link: QuickLinkItem;
  onClose: () => void;
}) {
  return (
    <div 
    className = "fixed inset-0 bg-black/40 z-50 flex items-end justify-center "
    onClick = {(e) => {
      if(e.target === e.currentTarget) onClose();
    }}
    >
      <div className = "bg-white rounded-t-2xl w-full max-w-lg flex flex-col max-h-[80vh]">
        <div className = "flex items-start gap-3 px-5 py-4 border-b border-gray-100">
          <div className = "w-10 h-10 rounded-lg bg-[#eef4fa] flex items-center justify-center flex-shrink-0">
            {link.icon}
          </div>
          <div className = "flex-1 min-w-0">
            <div className = "font-bold text-[#003366] text-sm">
              {link.title}
            </div>
            <div className = "text-xs text-gray-400">
              {link.description}
            </div>
          </div>
          <button
          onClick={onClose}
          aria-label = "Close"
          className = "w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors flex-shrink-0"
          >
            <IconX size = {16} />
          </button>
        </div>

        <div className = "flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
          {link.details.map((paragraph, i) => (
            <p key = {i} className = "text-sm text-gray-600 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function HelpCenter() {
  //const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeLink, setActiveLink] = useState<QuickLinkItem | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hey! I'm Alex, your UniTrade support assistant . What would you like to know?",
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);


  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (chatOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [chatOpen]);

  const toogleFaq = (index: number): void => {
    setOpenFaq(openFaq == index ? null : index);
  };

  const getResponse = (text: string): { reply: string; faqIndex?: number } => {
    const lower = text.toLowerCase();

    const keywordMap: { keywords: string[]; reply: string; faqIndex: number }[] = [
      {
        keywords: ['reservation', 'reserve', 'reserved', '24 hour', 'collection'],
        reply: 'Reservations last 24 hours by default. If there is no communication or a scheduled meeting between the buyer and seller within this window, the reservation expires and the item is re-listed automatically.',
        faqIndex: 0,
      },
      {
        keywords: ['payout', 'pay', 'paid', 'seller', 'receive money', 'business day'],
        reply: 'Payouts to sellers usually take about 2-3 business days after the buyers payments is confirmed.',
        faqIndex: 1,
      },
      {
        keywords: ['negotiate', 'negotiation', 'offer', 'price', 'bargain'],
        reply: 'Yes, only if the products listed are negotiable. For negotiations use the in-app chat to message the seller and propose an offer. Any agreed price changes must be made by the seller before you complete payment.',
        faqIndex: 2,
      },
      {
        keywords: ['collect', 'collection', 'missed', 'late', 'expired'],
        reply: "If you miss the collection window without communicating, the seller has the right to cancel the transaction and make the listing active for other university students again.",
        faqIndex: 3,
      },
      {
        keywords: ['unhappy', 'not satisfied', 'problem', 'issue', 'complaint'],
        reply: "If an item does not match its description or has undisclosed damage, you can log a formal case file immediately via the 'Report a Problem' tile on this dashboard before marking the trade complete.",
        faqIndex: 4,
      },
      {
        keywords: ['sign up', 'signing up', 'get started', 'open an account', 'start an account'],
        reply: "To sign up and start an account navigate to the home page and press on the get started account, if you have an account already, you can login to access your account.",
        faqIndex: 5
      }

    ];

    for (const entry of keywordMap) {
      if (entry.keywords.some(keyword => lower.includes(keyword))) {
        return { reply: entry.reply, faqIndex: entry.faqIndex };
      }
    }

    return {
      reply: "Im here to help with reservations, listings, payments, buyer protection, reviews, or reporting issues. Could you tell me more about what you need?",
    };
  };

  const sendMessage = async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;


    const userMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 300));

    const { reply, faqIndex } = getResponse(text);
    const assistantMessage: Message = { role: 'assistant', content: reply };
    setMessages(prev => [...prev, assistantMessage]);


    if (faqIndex !== undefined) {
      setOpenFaq(faqIndex);
      setTimeout(() => {
        const faqElement = document.getElementById(`faq-${faqIndex}`);
        if (faqElement) {
          faqElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }

    setIsLoading(false);

  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickLinks: QuickLinkItem[] = [
    { 
      icon: <IconBookmark size={22} className="text-[#003366]" />, 
      title: 'Reserving items', 
      description: 'How reservations work and when they expire.' ,
      details: [
        "when you reserve a listing , the seller has 24 hours to accept before the reservation expires automatically",
        "Once accepted, the item is held for you and will not be shown to other buyers until the reservation is completed or cancelled",
        "You can cancel a pending reservation at any time from your Reservations page",
      ],},
    { 
      icon: <IconUpload size={22} className="text-[#003366]" />, 
      title: 'Listing a product', 
      description: 'Create and manage your product listing.' ,
      details: [
      "Go to upload a listing and fill in the details of the listing such as the price, condition and at least one photo of the item",
      "You can edit or remove a listing at any time before it is reserved by a buyer",
      "Listings that break our content guidelines may be removed- see 'Reporting a problem' for more details",
      ],
    },
    { icon: <IconCreditCard size={22} className="text-[#003366]" />,
      title: 'Payment and Payouts', 
      description: 'How payments are processed and when you get paid.',
      details: [
        "Buyers pay securely through UniTrade at checkout; funds are held until the meetup is confirmed.",
        "Sellers receive payouts within 2-3 business days after a completed and confirmed handover.",
        "You can track payout status from your Seller Dashboard."

      ] },
    { icon: <IconShield size={22} className="text-[#003366]" />, 
      title: 'Buyer Protection', 
      description: 'Whats covered is something goes wrong.',
      details: [
        "still need to add this lol "

      ] },
    { icon: <IconStar size={22} className="text-[#003366]" />, 
      title: 'Reviews and ratings', 
      description: 'How to leave and respond to reviews.',
      details: [
        "After a reservation is completed, both buyer and seller can leave a rating and short review.",
        "Reviews are public on a user's profile and can't be edited after posting, so double-check before submitting.",
        "You can reply once to a review you've received to add context.",

      ] },
    { icon: <IconAlertCircle size={22} className="text-[#003366]" />, 
      title: 'Reporting a problem', 
      description: 'Flag a listing, user, or dispute an order.',
      details: [
        "Use the 'Report' option on any listing, profile, or chat to flag something to our team.",
        "For order-specific issues, open a dispute from the Reservation page instead — it routes faster.",
        "We aim to review reports within 24 hours.",

      ] },
  ];

  const faqs: FaqItem[] = [
    {
      question: "How long does a reservation last?",
      answer: "Reservations last 24 hours by default. If there is no communication or a schedules meeting between the buyer and seller within this window, the reservation expires and the item is re-listed automatically."
    },
    {
      question: "When will I receive my payout as seller?",
      answer: "This fully depends on the buyer's bank settings, either they do an immediate payment or just a transfer. But a rough estimate is as a seller you should expect a payout within 2-3 business days after the payment."
    },
    {
      question: "Can I negotiate the price with a seller?",
      answer: "Yes, only if the products listed are negotiable. For negotiations use the in-app chat to message the seller and propose an offer. Any agreed price changes must be made by the seller before you complete payment."
    },
    {
      question: "What happens if I don't collect a reserved item on time?",
      answer: "If you miss the collection window without communicating, the seller has the right to cancel the transaction and make the listing active for other university students again."
    },
    {
      question: "What do I do if I am not happy with the product?",
      answer: "If an item does not match its description or has undisclosed damage, you can log a formal case file immediately via the 'Report a Problem' tile on this dashboard before marking the trade complete."
    }
  ];

  const normalisedQuery = searchQuery.trim().toLowerCase();

  const filteredQuickLinks = useMemo(() => {
    if (!normalisedQuery) return quickLinks;
    return quickLinks.filter((link) =>
      `${link.title} ${link.description} ${link.details.join(' ')}`
        .toLowerCase()
        .includes(normalisedQuery)
    );
  }, [normalisedQuery]);


 const filteredFaqs = useMemo(() => {
    if (!normalisedQuery) return faqs;
    return faqs.filter((faq) =>
      `${faq.question} ${faq.answer}`.toLowerCase().includes(normalisedQuery)
    );
  }, [normalisedQuery]);


  const hasResults = filteredQuickLinks.length > 0 || filteredFaqs.length > 0;



  return (
    <div className='min-h-screen bg-[#f8fafc] text-gray-800 font-sans pb-16'>
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 mt-8 relative">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-visible">

          <div className="flex-1 w-full">
            <h2 className="text-3xl font-extrabold text-[#003366] tracking-tight">Help Center</h2>
            <p className="text-sm text-gray-500 mt-1 mb-6">Find answers, tutorials, and support resources</p>

            <div className="relative w-full max-w-lg">
              <input
                type="text"
                placeholder="Search for help articles..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#003366] focus:bg-white transition-all"
              />
              <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>
          </div>

          <div className="w-full md:w-auto flex justify-center md:block pt-4 md:pt-0">
            <AlexAvatar
              isThinking={searchQuery.length === 0}
              onClick={() => setChatOpen(!chatOpen)}
            />
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
          <h3 className="text-xs font-bold text-[#003366] uppercase tracking-wider mb-4">Quick Links</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredQuickLinks.map((link, idx) => (
              <div
                key={idx}
                onClick={() => setActiveLink(link)}
                className="bg-white border border-gray-100 p-5 rounded-xl shadow-xs hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#eef4fa] flex items-center justify-center mb-3 group-hover:bg-[#dce9f7] transition-colors">
                  {link.icon}
                </div>
                <h4 className="text-sm font-bold text-gray-800 mb-1">{link.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{link.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredFaqs.length > 0 && (
        <div className = "max-w-5xl mx-auto px-6 mt-12">
          <h3 className = "text-xs font-bold text-[#003366] uppercase tracking-wider mb-4"> 
            Frequently Asked Questions
          </h3>
          <div className = "flex flex-col gap-3">
            {filteredFaqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div 
                key = {index}
                id = {`faq-${index}`}
                className = "bg-white border border-gray-200/80 rounded-xl overflow-hidden shadow-xs transition-all"
                >
                  <button 
                  onClick = {() => toogleFaq(index)}
                  className = "w-full flex items-center justify-between px-5 py-4 text-left font-semibold text-sm text-gray-800 hover:bg-gray-50 transition-colors"
                  >
                    <span>
                      {faq.question}
                    </span>
                    {isOpen ? (
                      <IconChevronUp size = {18} className="text-gray-500" />
                    ): (
                      <IconChevronDown size = {18} className = "text-gray-500" />
                    )}
                  </button>

                  {isOpen && (
                    <div className = "px-5 pb-5 pt-1 text-xs text-gray-600 leading-relaxed border-t border-gray-50 bg-slate-50/50">
                      {faq.answer}
                      </div>
                  )}
                </div>
              );
            })}
          </div>
          </div>
      )}

      {activeLink && (
        <QuickLinkOverlay link={activeLink} onClose = {() => setActiveLink(null)} />
      )}
      {chatOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setChatOpen(false);
          }}
        >

          <div className="bg-white rounded-t-2xl w-full max-w-lg flex flex-col" style={{ height: '70vh' }}>
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div>
                <div className="font-bold text-[#003366] text-sm">Alex</div>
                <div className="text-xs text-gray-400">Unitrade Help Assistant</div>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                aria-label="Close chat"
                className="ml-auto w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
              >
                <IconX size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                        ? 'bg-[#003366] text-white rounded-br-sm'
                        : 'bg-[#eef4fa] text-[#003366] rounded-bl-sm'
                      }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#eef4fa] rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5">
                    {[0, 0.2, 0.4].map((delay, i) => (
                      <span
                        key={i}
                        style={{ animationDelay: `${delay}s` }}
                        className="w-2 h-2 bg-[#003366] rounded-full opacity-40 animate-bounce"
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-4 py-3 border-t border-gray-100 flex gap-3 items-end">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask Alex anything..."
                rows={1}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm resize-none outline-none focus:border-[#003366] bg-gray-50 focus:bg-white transition-all font-sans"
                style={{ maxHeight: 80 }}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputValue.trim()}
                aria-label="Send message"
                className="w-10 h-10 bg-[#003366] text-white rounded-xl flex items-center justify-center disabled:opacity-40 hover:bg-[#004080] transition-colors flex-shrink-0"
              >
                <IconSend size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}