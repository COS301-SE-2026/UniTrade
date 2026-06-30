import React, { useState} from 'react';
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
  IconArrowLeft
} from '@tabler/icons-react';
import { useNavigate} from 'react-router-dom';
import AlexAvatar from './AlexAvatar.tsx';
import logo from "../../assets/logo.jpeg"


function Navbar() 
{
  const navigate = useNavigate()
  return (
    <nav className="bg-white dark:bg-navy-800 border-b border-gray-100 dark:border-white/10 sticky top-0 z-50">
      <div className="max-w-full mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
          onClick={ () => navigate(-1) }
          className = "p-2 text-gray-500 hover:text-[#003366] hover:bg-gray-100 rounded-full transition-all">
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

interface QuickLinkItem{
    icon: React.ReactNode;
    title: string;
    description: string;
}

interface FaqItem{
    question: string;
    answer: string;
}

export default function HelpCenter() {
    //const navigate = useNavigate();

    const [searchQuery,setSearchQuery] = useState<string>('');
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const toogleFaq = (index: number): void => {
        setOpenFaq(openFaq == index ? null : index);
    };

    const quickLinks: QuickLinkItem[] = [
        { icon: <IconBookmark size={22} className = "text-[#003366]" />, title: 'Reserving items', description: 'How reservations work and when they expire.' },
        { icon: <IconUpload size={22} className = "text-[#003366]" />, title: 'Listing a product', description: 'Create and manage your product listing.' },
        { icon: <IconCreditCard size={22} className = "text-[#003366]" />, title: 'Payment and Payouts', description: 'How payments are processed and when you get paid.' },
        { icon: <IconShield size={22} className = "text-[#003366]" />, title: 'Buyer Protection', description: 'Whats covered is something goes wrong.' },
        { icon: <IconStar size={22} className = "text-[#003366]" />, title: 'Reviews and ratings', description: 'How to leave and respond to reviews.' },
        { icon: <IconAlertCircle size={22} className = "text-[#003366]" />, title: 'Reporting a problem', description: 'Flag a listing, user, or dispute an order.' },
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


    return(
        <div className = 'min-h-screen bg-[#f8fafc] text-gray-800 font-sans pb-16'>
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
            <AlexAvatar isThinking={searchQuery.length === 0} />
          </div>

        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-10">
        <h3 className="text-xs font-bold text-[#003366] uppercase tracking-wider mb-4">Quick Links</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {quickLinks.map((link, idx) => (
            <div 
              key={idx} 
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

      <div className="max-w-5xl mx-auto px-6 mt-12">
        <h3 className="text-xs font-bold text-[#003366] uppercase tracking-wider mb-4">Frequently Asked Questions</h3>
        <div className="flex flex-col gap-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div 
                key={index} 
                className="bg-white border border-gray-200/80 rounded-xl overflow-hidden shadow-xs transition-all"
              >
                <button
                  onClick={() => toogleFaq(index)}
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
    </div>
  );
}