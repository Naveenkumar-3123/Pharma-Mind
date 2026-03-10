import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AgentNotifications from './AgentNotifications';
import AdminChatbot from './AdminChatbot';

export default function Layout() {
    return (
        <div className="flex min-h-screen bg-background-light font-display text-slate-900">
            <Sidebar />
            <main className="flex-1 ml-[240px] p-8">
                <Outlet />
            </main>
            {/* <AgentNotifications /> */}
            <AdminChatbot />
        </div>
    );
}
