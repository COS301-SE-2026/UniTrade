import { Outlet, useParams } from "react-router-dom";
import ConversationsSidebar from "./layout/ConversationsSidebar";

export default function ChatLayout({ role }: { role: 'buyer' | 'seller' }) {
    const { reservationId } = useParams<{ reservationId: string }>();
    const hasActiveConversation = !!reservationId;
    return (
        <div className="flex flex-1 min-h-0 bg-gray-50 rounded-xl overflow-hidden border-gray-100 shadow-sm">
            <div className={`${hasActiveConversation ? 'hidden md:flex' : 'flex'} w-full md:w-auto`}>

              <ConversationsSidebar role={role} />
            </div>
            <div className={`${hasActiveConversation ? 'flex' : 'hidden md:flex'} flex-1 min-w-0`}>
                <Outlet />

            </div>
        </div>
    )
}