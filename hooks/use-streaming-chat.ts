"use client";

import { useState } from "react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface UseStreamingChatOptions {
  api: string;
}

export function useStreamingChat({ api }: UseStreamingChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<"idle" | "submitted" | "streaming">("idle");
  const [error, setError] = useState<any>(null);

  const sendMessage = async ({ text }: { text: string }) => {
    if (!text.trim()) return;

    setError(null);
    setStatus("submitted");

    const userMessage: Message = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      role: "user",
      content: text,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    // Create a placeholder for the assistant response
    const assistantId = `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const assistantMessage: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
    };

    try {
      const response = await fetch(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })) }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to fetch: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body available to read stream.");
      }

      setStatus("streaming");
      setMessages((prev) => [...prev, assistantMessage]);

      const decoder = new TextDecoder();
      let streamContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        streamContent += chunk;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: streamContent } : m
          )
        );
      }

      setStatus("idle");
    } catch (err: any) {
      console.error("[useStreamingChat Error]:", err);
      setError(err);
      setStatus("idle");

      // Inject the error directly as a fallback assistant message so the user ALWAYS sees what happened
      const errorMsg = err?.message || String(err);
      const errorAssistantMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `I encountered an error trying to process your request:\n\n**Error:** ${errorMsg}\n\nPlease verify your server connection or try again.`,
      };
      setMessages((prev) => [...prev, errorAssistantMessage]);
    }
  };

  return {
    messages,
    sendMessage,
    status,
    error,
    setMessages,
  };
}
