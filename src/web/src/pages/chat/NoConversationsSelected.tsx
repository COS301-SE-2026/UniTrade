import {IconMessageCircle } from '@tabler/icons-react';

export default function NoConversationsSelected() {
    return (
        <div className = "h-full flex flex-col items-center justify-center text-gray-400 gap-2">
            <IconMessageCircle size = {40} stroke={1.5} />
            <p className="text-sm">
                Select a conversation to start chatting
            </p>
        </div>
    );
}