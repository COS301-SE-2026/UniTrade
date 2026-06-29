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
import AlexAvatar from '/auth/AlexAvatar';

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
    const navigate = useNavigate();

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


}