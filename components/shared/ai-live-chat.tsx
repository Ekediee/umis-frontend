"use client";

import { useState, useRef, useEffect } from "react";
import { useStreamingChat } from "@/hooks/use-streaming-chat";
import { MessageCircle, X, Send, User, Loader2, Sparkles, RotateCcw, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import { getUserData } from "@/app/actions/user";
import { usePathname } from "next/navigation";

export function AILiveChat() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [studentName, setStudentName] = useState<string | null>(null);
  
  const { messages, sendMessage, status, error, setMessages } = useStreamingChat({
    api: '/api/chat',
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch student name on mount
  useEffect(() => {
    getUserData()
      .then((session) => {
        if (session?.user_data?.personal_information?.student_name) {
          setStudentName(session.user_data.personal_information.student_name);
        } else if (session?.entity_name) {
          setStudentName(session.entity_name);
        }
      })
      .catch((err) => {
        console.error("Failed to load session details in chatbot:", err);
      });
  }, []);

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
  }, [messages, isLoading]);

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

  const handleClearHistory = () => {
    if (confirm("Reset your conversation with Pulse?")) {
      setMessages([]);
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

  const getFirstName = () => {
    if (!studentName) return "";
    const cleanName = studentName.trim();
    return cleanName.split(" ")[0];
  };

  const firstName = getFirstName();
  const greetingText = firstName ? `Hey ${firstName}! 👋` : "Welcome! 👋";

  const quickActions = [
    {
      title: "Course Advisor",
      desc: "GPA & academic tips",
      prompt: "Can you give me a quick academic advice on course selection and GPA optimization?",
      icon: "🎓",
      color: "from-blue-500/10 to-indigo-500/10 hover:from-blue-500/20 hover:to-indigo-500/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-900/30"
    },
    {
      title: "Fee Payment",
      desc: "Troubleshoot failed payments",
      prompt: "My school fees payment failed, what should I do?",
      icon: "💳",
      color: "from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/30"
    },
    {
      title: "Dress & Rules",
      desc: "Chapel and dress code rules",
      prompt: "What are the chapel attendance rules and dress code guidelines on campus?",
      icon: "👗",
      color: "from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-900/30"
    },
    {
      title: "Portal Guide",
      desc: "How to view/pay fees",
      prompt: "Walk me through how to view my school fees and make payments on the portal.",
      icon: "📖",
      color: "from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-900/30"
    }
  ];

  if (pathname === "/") {
    return null;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 0.3; }
          100% { transform: scale(0.95); opacity: 0.6; }
        }
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.08); }
          30% { transform: scale(1); }
          35% { transform: scale(1.08); }
          50% { transform: scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes slide-in-up {
          from { transform: translateY(12px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .pulse-ring-glow {
          animation: pulse-ring 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .heartbeat-hover:hover .pulse-icon-target {
          animation: heartbeat 1.2s infinite;
        }
        .float-anim {
          animation: float 3s ease-in-out infinite;
        }
        .slide-in-up-anim {
          animation: slide-in-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 5px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.25);
          border-radius: 9999px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.45);
        }
      `}} />

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-24 right-6 md:bottom-8 md:right-8 group heartbeat-hover flex items-center gap-2 pl-3 pr-4 py-3 bg-gradient-to-r from-[#003cbb] via-[#1d4ed8] to-[#2563eb] text-white rounded-full shadow-[0_8px_32px_rgba(0,60,187,0.35)] dark:shadow-[0_8px_32px_rgba(37,99,235,0.25)] border border-white/10 hover:shadow-[0_12px_40px_rgba(0,60,187,0.5)] transition-all duration-300 z-50 hover:-translate-y-0.5 active:scale-95",
          isOpen && "scale-0 opacity-0 pointer-events-none"
        )}
      >
        <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-inner p-1">
          <img src="/images/bu_logo.png" className="w-full h-full object-contain pulse-icon-target transition-transform duration-300" alt="Babcock" />
          <span className="absolute -inset-1 rounded-full border border-blue-400/30 pulse-ring-glow"></span>
        </div>
        <div className="flex flex-col items-start leading-none text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Babcock Companion</span>
          <span className="text-sm font-bold tracking-tight">Ask Pulse</span>
        </div>
        <span className="relative flex h-2 w-2 ml-1">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
      </button>

      {/* Chat Window */}
      <div
        className={cn(
          "fixed bottom-0 right-0 md:bottom-8 md:right-8 w-full md:w-[400px] h-[85vh] md:h-[630px] bg-white dark:bg-slate-900 md:rounded-[28px] shadow-[0_16px_48px_rgba(15,23,42,0.15)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.6)] z-50 flex flex-col overflow-hidden transition-all duration-350 cubic-bezier(0.16, 1, 0.3, 1) origin-bottom-right border border-slate-100 dark:border-slate-800",
          isOpen ? "scale-100 translate-y-0 opacity-100" : "scale-90 translate-y-4 opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#003cbb] via-[#1d4ed8] to-[#2563eb] p-4 flex items-center justify-between shrink-0 shadow-md">
          {/* Glass Overlay */}
          <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px] pointer-events-none"></div>

          <div className="relative flex items-center gap-3 z-10">
            <div className="relative w-11 h-11 bg-white rounded-2xl flex items-center justify-center shadow-inner border border-white/10 float-anim p-2">
              <img src="/images/bu_logo.png" className="w-full h-full object-contain" alt="Babcock University Torch" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-[2.5px] border-[#003cbb] rounded-full flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-white text-[15px] tracking-tight">Pulse AI</h3>
                <span className="bg-white/20 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider scale-90">Companion</span>
              </div>
              <p className="text-blue-100/90 text-[11px] font-medium flex items-center gap-1">
                <span>Active</span>
                <span className="w-1 h-1 rounded-full bg-blue-200"></span>
                <span>Powered by ICT</span>
              </p>
            </div>
          </div>

          <div className="relative flex items-center gap-1.5 z-10">
            {messages.length > 0 && (
              <button
                onClick={handleClearHistory}
                title="Reset conversation"
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all duration-200 hover:rotate-45 active:scale-90"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all duration-200 active:scale-90"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="relative flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[#f8fafc] dark:bg-slate-950 scrollbar-thin">
          {/* Watermark */}
          <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-0 opacity-100">
            <img src="/images/bu_logo2.png" className="w-[280px] h-[280px] object-contain opacity-30" alt="BU Torch Watermark" />
          </div>

          {messages.length === 0 ? (
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-2 py-4 slide-in-up-anim">
              <div className="relative w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-5 shrink-0 border border-blue-500/20 dark:border-blue-400/20 shadow-md float-anim p-3">
                <img src="/images/Bu_logo.png" className="w-full h-full object-contain" alt="BU Torch" />
                <span className="absolute -inset-2 rounded-3xl border border-blue-400/10 pulse-ring-glow"></span>
              </div>
              
              <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg mb-2 tracking-tight">
                {firstName ? `${greetingText} I'm Pulse.` : "Hello! I'm Pulse."}
              </h4>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-8 max-w-[310px] leading-relaxed">
                Your smart academic companion. Let me help you with course selection, GPA strategies, failed fees payments, or student regulations.
              </p>

              {/* AI Quick Actions Grid */}
              <div className="w-full max-w-[340px] flex flex-col gap-2">
                <div className="flex items-center gap-1.5 pl-1 mb-1">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Suggested Questions</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickAction(action.prompt)}
                      className={cn(
                        "text-left p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border rounded-2xl flex flex-col justify-between h-[96px] transition-all duration-200 active:scale-[0.97] group shadow-sm",
                        action.color
                      )}
                    >
                      <span className="text-xl leading-none group-hover:scale-110 transition-transform duration-200">{action.icon}</span>
                      <div>
                        <p className="font-bold text-[12px] leading-snug tracking-tight">{action.title}</p>
                        <p className="text-[9.5px] opacity-75 leading-tight line-clamp-1 mt-0.5">{action.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  className={cn(
                    "relative z-10 flex gap-2.5 max-w-[88%] slide-in-up-anim",
                    isUser ? "self-end flex-row-reverse" : "self-start"
                  )}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-sm border text-[11px] font-bold overflow-hidden p-0.5",
                      isUser
                        ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                        : "bg-white border-blue-100 dark:border-slate-700/80"
                    )}
                  >
                    {isUser ? (
                      <User className="w-3.5 h-3.5" />
                    ) : (
                      <img src="/images/bu_logo.png" className="w-full h-full object-contain" alt="BU Torch" />
                    )}
                  </div>

                  {/* Message box */}
                  <div
                    className={cn(
                      "px-4 py-3 rounded-2xl text-[13.5px] leading-relaxed shadow-[0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-sm",
                      isUser
                        ? "bg-gradient-to-br from-[#003cbb] to-[#2563eb] text-white rounded-tr-none"
                        : "bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-slate-100/50 dark:border-slate-700/50 rounded-tl-none prose prose-sm dark:prose-invert max-w-none prose-p:mb-3 prose-headings:mt-3 prose-headings:mb-1.5 prose-ul:my-1.5 prose-ol:my-1.5"
                    )}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap font-medium">{getMessageText(m)}</p>
                    ) : (
                      <div className="prose-p:leading-relaxed prose-li:my-0.5 prose-strong:font-bold prose-strong:text-indigo-600 dark:prose-strong:text-blue-300">
                        <ReactMarkdown>{getMessageText(m)}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          
          {/* Loading Indicator */}
          {isLoading && (
            <div className="relative z-10 flex gap-2.5 max-w-[88%] self-start slide-in-up-anim">
              <div className="w-7 h-7 rounded-lg bg-white border border-blue-100 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-sm p-0.5">
                <img src="/images/BU Torch.png" className="w-full h-full object-contain animate-pulse" alt="BU Torch" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-100/50 dark:border-slate-700/50 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-indigo-500 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-1.5 h-1.5 bg-indigo-500 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-1.5 h-1.5 bg-indigo-500 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="relative z-10" />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80 shrink-0">
          <form
            onSubmit={onSubmit}
            className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl pl-4 pr-1.5 py-1.5 focus-within:border-[#003cbb] dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15 transition-all duration-200"
          >
            <input
              type="text"
              value={inputValue}
              onChange={handleTextChange}
              placeholder="Ask Pulse something..."
              className="flex-1 bg-transparent border-none outline-none text-[13.5px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 font-medium"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#003cbb] to-[#2563eb] hover:shadow-[0_2px_10px_rgba(0,60,187,0.3)] disabled:opacity-50 text-white flex items-center justify-center shrink-0 transition-all duration-200 active:scale-90"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4.5 h-4.5 ml-0.5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

