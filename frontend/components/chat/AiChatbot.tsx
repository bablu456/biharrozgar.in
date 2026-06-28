"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import {
  DEFAULT_OPENROUTER_CHAT_MODEL_ID,
  OPENROUTER_CHAT_MODELS,
} from "@/constants/openrouterModels";
import { apiFetch, ApiError } from "@/lib/api";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

const FALLBACK_ASSISTANT_MESSAGE =
  "Main abhi clear response generate nahi kar paaya. Aap apna sawaal thoda aur detail me dobara bhejiye.";

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "Namaste, main Rozgar Mitra hoon. Bihar me job search, profile improvement, ya hiring me aapki help kar sakta hoon.",
  },
];

export default function AiChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState(
    DEFAULT_OPENROUTER_CHAT_MODEL_ID
  );
  const [isOpen, setIsOpen] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const selectedModelInfo =
    OPENROUTER_CHAT_MODELS.find(
      (model) => model.id === selectedModel
    ) ?? OPENROUTER_CHAT_MODELS[0];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const sendMessage = async (event?: FormEvent<HTMLFormElement>, chipText?: string) => {
    event?.preventDefault();

    const trimmedInput = (chipText ?? input).trim();
    if (!trimmedInput || isSending) {
      return;
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: trimmedInput,
    };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsSending(true);

    try {
      const data = await apiFetch<{ reply: string | null }>("/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: nextMessages,
          model_id: selectedModel,
        }),
      });
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: "assistant",
          content: normalizeAssistantContent(data.reply),
        },
      ]);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setError("Slow down! You've reached the limit of 5 messages per minute to prevent system overload. Please wait a few seconds.");
        setMessages(messages);
        setInput(trimmedInput);
      } else {
        const message =
          err instanceof Error
            ? formatChatError(err.message)
            : "Kuch error aa gaya. Thodi der baad try kijiye.";
        setError(message);
        setMessages(messages);
        setInput(trimmedInput);
      }
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-[60] inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-900 to-emerald-700 text-white shadow-xl shadow-emerald-950/20 transition-all hover:scale-105 active:scale-95 duration-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/25"
        aria-label="Open Rozgar Mitra chat"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <section className="fixed bottom-5 right-5 z-[60] flex h-[550px] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden backdrop-blur-xl bg-white/90 border border-emerald-500/10 rounded-3xl shadow-[0_20px_50px_rgba(15,118,110,0.15)] sm:w-[400px]">
      <div className="flex items-center justify-between gap-3 border-b border-emerald-500/10 px-5 py-4 bg-transparent z-10">
        <div>
          <h2 className="text-base font-bold bg-gradient-to-r from-emerald-800 to-teal-600 bg-clip-text text-transparent tracking-tight leading-tight">
            Rozgar Mitra
          </h2>
          <p className="text-[10px] text-emerald-600/70 font-semibold tracking-wider uppercase mt-0.5">
            AI job assistant
          </p>
        </div>
        <div className="flex min-w-0 items-start gap-2">
          <div className="flex max-w-[160px] flex-col items-end sm:max-w-[180px]">
            <select
              value={selectedModel}
              onChange={(event) => setSelectedModel(event.target.value)}
              className="w-full truncate bg-emerald-50/50 text-emerald-800 text-xs py-1.5 px-3 rounded-full border border-emerald-500/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer transition-all hover:bg-emerald-50"
              aria-label="Select AI model"
              title={selectedModelInfo.description}
            >
              {OPENROUTER_CHAT_MODELS.map((model) => (
                <option
                  key={model.id}
                  value={model.id}
                  className="text-slate-800 bg-white"
                >
                  {model.label}
                </option>
              ))}
            </select>
            <p className="mt-1 max-w-[160px] text-right text-[10px] leading-tight text-emerald-700/70 sm:max-w-[180px]">
              {selectedModelInfo.hint}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            aria-label="Close Rozgar Mitra chat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto bg-gradient-to-b from-white to-emerald-50/20 px-5 py-5 scroll-smooth">
        <AnimatePresence initial={false}>
          {messages.map((message, index) => {
            const isUser = message.role === "user";
            const rawContent = normalizeChatMessageContent(message.content);

            let displayContent = rawContent;
            const options: string[] = [];
            
            if (!isUser) {
              const regex = /\[(.*?)\]/g;
              let match;
              while ((match = regex.exec(rawContent)) !== null) {
                options.push(match[1]);
              }
              displayContent = rawContent.replace(/\[(.*?)\]/g, "").trim();
            }

            if (!displayContent && !isUser) {
              displayContent = FALLBACK_ASSISTANT_MESSAGE;
            }

            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                key={`${message.role}-${index}`}
                className={`flex flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}
              >
                <div className={`flex ${isUser ? "justify-end" : "justify-start"} w-full`}>
                  <div
                    className={`max-w-[85%] px-4 py-3 text-[14px] leading-relaxed ${
                      isUser
                        ? "bg-gradient-to-tr from-emerald-900 to-emerald-800 text-white rounded-2xl rounded-tr-sm shadow-md shadow-emerald-950/10 font-medium"
                        : "bg-white border border-emerald-500/5 text-slate-800 rounded-2xl rounded-tl-sm shadow-sm"
                    }`}
                  >
                    {displayContent}
                  </div>
                </div>
                
                {!isUser && options.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {options.map((opt, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        onClick={() => sendMessage(undefined, opt)}
                        className="px-4 py-2 text-xs font-semibold bg-white text-emerald-800 border border-emerald-500/10 rounded-full hover:bg-emerald-50 hover:border-emerald-500/30 hover:text-emerald-900 transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        {opt}
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}

          {isSending && (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-white border border-emerald-500/5 text-slate-500 rounded-2xl rounded-tl-sm shadow-sm px-4 py-3 text-sm flex items-center space-x-1">
                <motion.div
                  className="w-1.5 h-1.5 bg-emerald-600/70 rounded-full"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                  className="w-1.5 h-1.5 bg-emerald-600/70 rounded-full"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="w-1.5 h-1.5 bg-emerald-600/70 rounded-full"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={chatEndRef} />
      </div>

      {error && (
        <div className="bg-red-50 px-5 py-2.5 text-xs text-red-600 font-medium border-t border-red-100 z-10">
          {error}
        </div>
      )}

      <form
        onSubmit={sendMessage}
        className="m-4 p-1.5 bg-white border border-emerald-500/10 rounded-full shadow-lg shadow-emerald-950/5 flex items-center gap-2 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all z-10"
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Type your message..."
          className="bg-transparent border-none focus:ring-0 px-4 w-full text-slate-700 outline-none text-sm placeholder:text-slate-400 font-medium"
          disabled={isSending}
        />
        <button
          type="submit"
          disabled={isSending || !input.trim()}
          className="bg-gradient-to-tr from-emerald-950 to-emerald-800 text-white p-2.5 rounded-full hover:shadow-lg hover:shadow-emerald-900/15 transition-all disabled:cursor-not-allowed disabled:opacity-60 flex-shrink-0 active:scale-95"
          aria-label="Send message"
        >
          <Send className="h-4 w-4 ml-0.5" />
        </button>
      </form>
    </section>
  );
}

function formatChatError(message: string): string {
  if (message.includes("OPENROUTER_API_KEY is not configured")) {
    return "OpenRouter key missing hai. backend/.env me OPENROUTER_API_KEY add karke backend restart kijiye.";
  }

  if (message.includes("Unsupported OpenRouter chat model")) {
    return "Selected model free list me nahi hai. Dropdown se koi available free model choose kijiye.";
  }

  if (message.includes("AI models are unavailable")) {
    return "Abhi selected AI model unavailable hai. Koi aur free model try kijiye.";
  }

  return message;
}

function normalizeChatErrorDetail(detail: unknown): string {
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (item && typeof item === "object" && "msg" in item) {
          const maybeMessage = (item as { msg?: unknown }).msg;
          return typeof maybeMessage === "string" ? maybeMessage : "";
        }
        return "";
      })
      .filter((item) => item.trim().length > 0);

    if (messages.length > 0) {
      return messages.join(" ");
    }
  }

  return "Chat request failed.";
}

function normalizeAssistantContent(content: unknown): string {
  const normalized = normalizeChatMessageContent(content);
  return normalized || FALLBACK_ASSISTANT_MESSAGE;
}

function normalizeChatMessageContent(content: unknown): string {
  return typeof content === "string" ? content : "";
}
