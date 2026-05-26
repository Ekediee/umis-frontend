"use client";

import { useState, useEffect } from "react";
import { useStreamingChat } from "@/hooks/use-streaming-chat";
import { Sparkles, X, ChevronRight, GraduationCap, AlertCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';

interface AICourseAdvisorProps {
  selectedCourses: string[];
}

export function AICourseAdvisor({ selectedCourses }: AICourseAdvisorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const { messages, sendMessage, status } = useStreamingChat({
    api: '/api/advisor',
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Automatically trigger the advisor when opened for the first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      sendMessage({
        text: `Analyze my course selection: ${selectedCourses.join(', ')} and provide recommendations for my academic path.`
      });
    }
  }, [isOpen, messages.length, sendMessage, selectedCourses]);

  const getMessageText = (m: any) => {
    return m.content || "";
  };

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="w-full md:w-auto bg-gradient-to-r from-[#003cbb] to-[#2563eb] hover:from-[#003095] hover:to-[#1d4ed8] text-white rounded-xl h-11 flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow-md"
      >
        <Sparkles className="w-4 h-4 text-blue-200" />
        <span className="font-semibold">AI Course Advisor</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[24px] shadow-2xl overflow-hidden flex flex-col h-[85vh] sm:h-[80vh] max-h-[800px] border border-gray-100 dark:border-gray-800 animate-in slide-in-from-bottom-8 duration-300">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-[#003cbb] to-[#1e3a8a] p-6 flex justify-between items-start shrink-0 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute bottom-[-20%] left-[-10%] w-32 h-32 bg-blue-400/20 rounded-full blur-xl"></div>
              
              <div className="relative z-10 flex gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-[20px] font-bold text-white mb-1">AI Course Advisor</h2>
                  <p className="text-blue-100 text-[14px] font-medium flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" />
                    Optimizing your path to graduation
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="relative z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#0a0d14] p-6">
              {isLoading && messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <div className="w-16 h-16 relative flex items-center justify-center">
                    <div className="absolute inset-0 border-4 border-[#003cbb]/20 border-t-[#003cbb] rounded-full animate-spin"></div>
                    <Sparkles className="w-6 h-6 text-[#003cbb] animate-pulse" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">Analyzing your academic profile...</p>
                </div>
              ) : (
                <div className="prose prose-blue dark:prose-invert max-w-none prose-headings:font-bold prose-h3:text-[18px] prose-p:text-[15px] prose-p:leading-relaxed prose-li:text-[15px]">
                  {messages.filter(m => m.role === 'assistant').map((m, index) => (
                    <ReactMarkdown 
                      key={index}
                      components={{
                        strong: ({node, ...props}) => <span className="font-bold text-[#003cbb] dark:text-[#4d82ff]" {...props} />,
                      }}
                    >
                      {getMessageText(m)}
                    </ReactMarkdown>
                  ))}
                  
                  {isLoading && messages.length > 0 && (
                    <div className="flex gap-1.5 mt-4">
                      <span className="w-2 h-2 bg-[#003cbb] dark:bg-[#4d82ff] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="w-2 h-2 bg-[#003cbb] dark:bg-[#4d82ff] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="w-2 h-2 bg-[#003cbb] dark:bg-[#4d82ff] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 md:p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="text-[12px] font-medium">AI suggestions do not override official departmental policies.</span>
              </div>
              <Button 
                onClick={() => setIsOpen(false)}
                className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-xl px-6 hidden sm:flex"
              >
                Close Advisor
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
