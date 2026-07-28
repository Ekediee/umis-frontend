"use client";

import { useState, useRef, useEffect } from "react";
import { useStreamingChat } from "@/hooks/use-streaming-chat";
import { X, Send, Bot, User, Loader2, Sparkles, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';

function Premium3DLightbulb(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        {/* Soft yellow radial gradient for the bulb glass */}
        <radialGradient id="bulbGlow" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#FFFbeb" />
          <stop offset="60%" stopColor="#FDE047" />
          <stop offset="100%" stopColor="#EAB308" />
        </radialGradient>
        {/* Sleek metallic gray base */}
        <linearGradient id="metallicBase" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#9CA3AF" />
          <stop offset="50%" stopColor="#E5E7EB" />
          <stop offset="100%" stopColor="#9CA3AF" />
        </linearGradient>
      </defs>

      {/* Main outer bulb body */}
      <path
        d="M12 2A7 7 0 0 0 5 9c0 2.8 1.6 5.1 3.5 6.5.5.3.5.7.5 1.1v1.4h6v-1.4c0-.4 0-.8.5-1.1C17.4 14.1 19 11.8 19 9a7 7 0 0 0-7-7Z"
        fill="url(#bulbGlow)"
        stroke="#EAB308"
        strokeWidth="1.2"
      />

      {/* Glossy glass reflection curve */}
      <path
        d="M8.5 4.5A5.5 5.5 0 0 1 12 3.2c.2 0 .3 0 .5.1C9.6 3.8 7.3 6.2 6.8 9.3c0-.3-.1-.5-.1-.8 0-1.6.7-3.1 1.8-4Z"
        fill="#FFFFFF"
        opacity="0.6"
      />

      {/* Modern filament */}
      <path
        d="M10 11.5l2-3.5 2 3.5"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="7.5" r="0.6" fill="#FFFFFF" />

      {/* Base contact segments */}
      <path d="M9 18h6v2H9v-2Z" fill="url(#metallicBase)" />
      <path d="M10 20h4v1.5a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V20Z" fill="#4B5563" />
    </svg>
  );
}

export function AILiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const { messages, sendMessage, status, error } = useStreamingChat({
    api: '/api/chat',
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Diagnostic logging for debugging client-side message handling
    try {
      // eslint-disable-next-line no-console
      console.log('useStreamingChat messages update:', messages);
      // eslint-disable-next-line no-console
      console.log('useStreamingChat status:', status, 'error:', error);
    } catch (e) {
      // ignored
    }
  }, [messages, status, error]);

  const isLoading = status === "submitted" || status === "streaming";

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleQuickAction = (text: string) => {
    try {
      sendMessage({ text });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('sendMessage error:', err);
    }
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    try {
      sendMessage({ text: inputValue });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('sendMessage error:', err);
    }
    setInputValue("");
  };

  const getMessageText = (m: any) => {
    return m.content || "";
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes very-slow-breath {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 0 1px rgba(245, 158, 11, 0.1));
          }
          50% {
            transform: scale(1.06);
            filter: drop-shadow(0 0 12px rgba(245, 158, 11, 0.5));
          }
        }
        .slow-breathing-lamp {
          animation: very-slow-breath 5s ease-in-out infinite;
        }
      `}} />

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-28 right-6 md:bottom-24 md:right-8 w-14 h-14 bg-[#003cbb] text-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50",
          isOpen && "scale-0 opacity-0 pointer-events-none"
        )}
      >
        <Premium3DLightbulb className="w-8 h-8 text-white slow-breathing-lamp" />
      </button>

      {/* Chat Window */}
      <div
        className={cn(
          "fixed bottom-0 right-0 md:bottom-24 md:right-8 w-full md:w-[380px] h-[85vh] md:h-[600px] bg-white dark:bg-gray-900 md:rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] z-50 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right border border-gray-100 dark:border-gray-800",
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#003cbb] to-[#2563eb] p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Premium3DLightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-[15px]">AI Support</h3>
              <p className="text-blue-100 text-[12px] font-medium">Online • Ask me anything</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[#f8fafc] dark:bg-[#0f172a]">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4 shrink-0">
                <Bot className="w-8 h-8 text-[#003cbb] dark:text-[#4d82ff]" />
              </div>
              <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Welcome to Pulse Support</h4>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-6 max-w-[280px]">
                I can help you resolve registration issues, explain fee breakdowns, or guide you through the student handbook.
              </p>

              {/* AI Quick Actions */}
              <div className="w-full max-w-[280px] flex flex-col gap-2.5">
                <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-left pl-1">AI Quick Actions</p>
                <button
                  onClick={() => handleQuickAction("Can you give me a quick academic advice on course selection and GPA optimization?")}
                  className="w-full text-left px-3.5 py-2.5 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 rounded-xl text-[13px] font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2.5 transition-all group active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4 text-[#003cbb] dark:text-[#4d82ff] group-hover:animate-pulse" />
                  <span>🎓 Quick Course Advice</span>
                </button>
                <button
                  onClick={() => handleQuickAction("My school fees payment failed, what should I do?")}
                  className="w-full text-left px-3.5 py-2.5 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 rounded-xl text-[13px] font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2.5 transition-all group active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4 text-[#003cbb] dark:text-[#4d82ff] group-hover:animate-pulse" />
                  <span>💳 Payment Troubleshooting</span>
                </button>
                <button
                  onClick={() => handleQuickAction("What are the chapel attendance rules and dress code guidelines on campus?")}
                  className="w-full text-left px-3.5 py-2.5 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 rounded-xl text-[13px] font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2.5 transition-all group active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4 text-[#003cbb] dark:text-[#4d82ff] group-hover:animate-pulse" />
                  <span>👗 Dress Code & Curfew Rules</span>
                </button>
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex gap-3 max-w-[85%]",
                  m.role === "user" ? "self-end flex-row-reverse" : "self-start"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    m.role === "user"
                      ? "bg-gray-200 dark:bg-gray-800"
                      : "bg-[#003cbb] text-white"
                  )}
                >
                  {m.role === "user" ? (
                    <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div
                  className={cn(
                    "px-4 py-3 rounded-[16px] text-[14px] leading-relaxed shadow-sm",
                    m.role === "user"
                      ? "bg-[#003cbb] text-white rounded-tr-sm"
                      : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-sm prose prose-sm dark:prose-invert max-w-none prose-p:m-0 prose-headings:m-0 prose-ul:my-1 prose-ol:my-1"
                  )}
                >
                  {m.role === "user" ? (
                    getMessageText(m)
                  ) : (
                    <ReactMarkdown>{getMessageText(m)}</ReactMarkdown>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-3 max-w-[85%] self-start">
              <div className="w-8 h-8 rounded-full bg-[#003cbb] text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="px-4 py-3 rounded-[16px] rounded-tl-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shrink-0">
          <form
            onSubmit={onSubmit}
            className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-full pl-4 pr-1.5 py-1.5 focus-within:border-[#003cbb] dark:focus-within:border-[#4d82ff] focus-within:ring-1 focus-within:ring-[#003cbb] dark:focus-within:ring-[#4d82ff] transition-all"
          >
            <input
              type="text"
              value={inputValue}
              onChange={handleTextChange}
              placeholder="Ask a question..."
              className="flex-1 bg-transparent border-none outline-none text-[14px] text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="w-9 h-9 rounded-full bg-[#003cbb] hover:bg-[#003095] disabled:opacity-50 disabled:hover:bg-[#003cbb] text-white flex items-center justify-center shrink-0 transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4 ml-0.5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
