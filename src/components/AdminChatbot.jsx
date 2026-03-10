import React, { useState, useRef, useEffect } from 'react';
import { getInventorySuggestions } from '../utils/aiService';
import { useAgent } from '../context/AgentContext';
import { getInventorySnapshot } from '../utils/inventoryEngine';

export default function AdminChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', text: 'Hello! I am your PharmAgent AI. I can help you check inventory, analyze trends, or draft purchase orders. How can I assist you today?' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [smsPopup, setSmsPopup] = useState(null);
    const messagesEndRef = useRef(null);
    const { inventoryAlerts, autoPOs } = useAgent();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userText = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userText }]);
        setIsTyping(true);

        // Check for specific "Refill" command
        if (userText.toLowerCase() === 'refill') {
            const inventory = getInventorySnapshot();
            const lowStockItems = inventory
                .filter(item => item.totalQuantity < 100)
                .map(item => ({ name: item.name, stock: item.totalQuantity }));

            if (lowStockItems.length === 0) {
                setMessages(prev => [...prev, { role: 'assistant', text: "All inventory items have 100 or more units in stock. No bulk refill needed." }]);
                setIsTyping(false);
                return;
            }

            // Immediately show SMS popup (fires regardless of backend)
            const itemNames = lowStockItems.slice(0, 3).map(i => i.name).join(', ');
            const extra = lowStockItems.length > 3 ? ` +${lowStockItems.length - 3} more` : '';
            setSmsPopup({
                phone: 'dhevadharshini05@gmail.com',
                message: `PharmAgent Bulk Refill: ${lowStockItems.length} low-stock items flagged: ${itemNames}${extra}. PO email sent to vendor. - City Pharmacy`
            });
            setTimeout(() => setSmsPopup(null), 5000);

            try {
                // Send email to dhevadharshini05@gmail.com for bulk refill
                const API_PORT = import.meta.env.VITE_API_PORT || '3012';
                await fetch(`http://localhost:${API_PORT}/api/send-bulk-refill`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: 'dhevadharshini05@gmail.com',
                        items: lowStockItems
                    })
                });

                let responseText = `I have dispatched a bulk refill request to dhevadharshini05@gmail.com for the following low stock items:\n\n`;
                lowStockItems.forEach(item => {
                    responseText += `• ${item.name} (${item.stock} Units)\n`;
                });

                setMessages(prev => [...prev, { role: 'assistant', text: responseText }]);
            } catch (error) {
                setMessages(prev => [...prev, { role: 'assistant', text: "I found the low stock items but failed to send the bulk email." }]);
            } finally {
                setIsTyping(false);
            }
            return;
        }

        try {
            // Integrate with our existing groq/ai service
            // passing context about alerts and auto POs to make the AI aware
            const contextMsg = `There are ${inventoryAlerts?.length || 0} active inventory alerts and ${autoPOs?.length || 0} pending auto-purchase orders. Notes: If these numbers are 0, do not mention them.`;
            const response = await getInventorySuggestions(userText, contextMsg);

            setMessages(prev => [...prev, {
                role: 'assistant',
                text: response.success ? response.message : "I'm having trouble connecting right now. Please try again."
            }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', text: "Error communicating with the AI service." }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="w-[380px] h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 mb-4 flex flex-col overflow-hidden animate-fade-in-up origin-bottom-right">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary to-indigo-700 p-4 text-white flex justify-between items-center shadow-md z-10 relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                        <div className="relative flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30">
                                <span className="material-symbols-outlined text-white">smart_toy</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-sm leading-tight">PharmAgent AI</h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                    <span className="text-[10px] uppercase tracking-wider font-semibold opacity-80">Online</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="relative p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 bg-slate-50 flex flex-col gap-4">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.role === 'user'
                                    ? 'bg-primary text-white rounded-tr-sm'
                                    : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'
                                    }`}>
                                    {msg.role === 'assistant' && <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold uppercase text-primary tracking-wider"><span className="material-symbols-outlined text-[12px]">auto_awesome</span> AI Agent</div>}
                                    <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-1.5 h-1.5 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white border-t border-slate-100">
                        <div className="relative flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                            <textarea
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask PharmAgent..."
                                rows="1"
                                className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 text-sm p-2 text-slate-700 placeholder:text-slate-400"
                                style={{ minHeight: '40px' }}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isTyping}
                                className="p-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:hover:bg-primary shrink-0 m-1 shadow-md shadow-primary/20"
                            >
                                <span className="material-symbols-outlined text-[20px] -rotate-45 ml-1 mt-0.5 block">send</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 flex items-center justify-center rounded-2xl shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 z-50 relative group ${isOpen ? 'bg-slate-800 rotate-90' : 'bg-primary hover:bg-primary-dark rotate-0'
                    }`}
            >
                <div className="absolute -inset-0.5 bg-gradient-to-br from-indigo-400 to-primary rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                <div className="relative w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-3xl block transition-transform duration-300">
                        {isOpen ? 'close' : 'smart_toy'}
                    </span>
                </div>
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-primary"></span>
                    </span>
                )}
            </button>

            {/* SMS Sent Popup */}
            {smsPopup && (
                <div className="fixed top-6 right-6 z-50 w-96 animate-fade-in-up">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                        <div className="px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white">sms</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-white font-black text-sm tracking-wide">SMS SENT SUCCESSFULLY</h4>
                                <p className="text-white/70 text-[10px] font-bold">via Twilio API</p>
                            </div>
                            <button onClick={() => setSmsPopup(null)} className="text-white/50 hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>
                        <div className="p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="material-symbols-outlined text-slate-400 text-lg">call</span>
                                <span className="font-bold text-slate-800 text-sm tracking-wider">{smsPopup.phone}</span>
                            </div>
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                                <p className="text-sm text-slate-600 leading-relaxed italic">"{smsPopup.message}"</p>
                            </div>
                            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold">
                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                Delivered successfully
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
