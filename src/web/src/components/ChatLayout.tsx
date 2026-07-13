import { Outlet } from "react-router-dom";
import ConversationsSidebar from "./layout/ConversationsSidebar";

export default function ChatLayout ({role} : {role: 'buyer' | 'seller'}){
    return (
        <div className="flex h-[85vh] my-4 bg-gray-50 rounded-xl overflow-hidden border-gray-100 shadow-sm">
        
            <ConversationsSidebar role = {role} />
            <div className="flex-1 min-w-0">
                <Outlet/>
           
           </div>
        </div>
    )
}