"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Sparkles, Bot, User as UserIcon } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import DashboardShell from "@/components/layout/DashboardShell";
import DatasetPicker from "@/components/DatasetPicker";
import EmptyState from "@/components/EmptyState";
import { useUploads } from "@/hooks/useUploads";
import { api, getErrorMessage } from "@/lib/api";
import { ChatResponse } from "@/types";

const SUGGESTIONS = [
  "What is total sales?",
  "Best selling product",
  "Monthly sales",
  "Highest profit",
  "Worst performing state",
  "Top customers",
  "Average revenue",
  "Compare last year",
];

interface Message {
  role: "user" | "assistant";
  text: string;
  data?: ChatResponse["data"];
  chartSuggestion?: string | null;
}

export default function ChatPage() {
  const { uploads, loading, selectedId, setSelectedId } = useUploads();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function sendMessage(question: string) {
    if (!question.trim() || !selectedId) return;
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setSending(true);
    try {
      const res = await api.post<ChatResponse>("/api/chat", { upload_id: selectedId, question });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: res.data.answer, data: res.data.data, chartSuggestion: res.data.chart_suggestion },
      ]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", text: getErrorMessage(e) }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <DashboardShell title="AI Chat">
      {loading ? (
        <div className="card h-96 animate-pulse bg-black/5 dark:bg-white/5" />
      ) : uploads.length === 0 ? (
        <EmptyState title="No data to chat with" description="Upload a dataset first so the AI has something to analyze." />
      ) : (
        <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[720px]">
          <div className="mb-4">
            <DatasetPicker uploads={uploads} selectedId={selectedId} onChange={setSelectedId} />
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto card p-5 space-y-4 mb-4">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center py-10">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-4">
                  <Sparkles size={26} />
                </div>
                <h3 className="font-display font-semibold text-lg mb-1">Ask anything about your data</h3>
                <p className="text-sm text-muted dark:text-muted-dark max-w-sm mb-5">
                  Try one of these to get started:
                </p>
                <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-xs px-3 py-1.5 rounded-full border border-border dark:border-border-dark hover:bg-accent/10 hover:border-accent hover:text-accent transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <ChatBubble key={i} message={m} />
            ))}

            {sending && (
              <div className="flex items-center gap-2 text-sm text-muted dark:text-muted-dark">
                <Bot size={16} />
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" />
                </span>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about your sales data…"
              className="input-field flex-1"
            />
            <button type="submit" disabled={sending || !input.trim()} className="btn-primary px-4">
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </DashboardShell>
  );
}

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const chartData =
    message.data && typeof message.data === "object" && !("total" in message.data) && !("count" in message.data) && !("average" in message.data)
      ? Object.entries(message.data as Record<string, number>).map(([name, value]) => ({ name, value }))
      : null;

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${isUser ? "justify-end" : ""}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0">
          <Bot size={16} />
        </div>
      )}
      <div className={`max-w-[80%] ${isUser ? "order-1" : ""}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm ${
            isUser ? "bg-accent text-white rounded-br-md" : "bg-black/5 dark:bg-white/5 rounded-bl-md"
          }`}
        >
          {message.text}
        </div>
        {chartData && chartData.length > 0 && (
          <div className="card p-3 mt-2">
            <ResponsiveContainer width="100%" height={200}>
              {message.chartSuggestion === "line" ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="name" fontSize={10} tick={{ fill: "currentColor" }} />
                  <YAxis fontSize={10} tick={{ fill: "currentColor" }} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Line type="monotone" dataKey="value" stroke="#5B5FEF" strokeWidth={2} dot={false} />
                </LineChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="name" fontSize={10} tick={{ fill: "currentColor" }} interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis fontSize={10} tick={{ fill: "currentColor" }} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="value" fill="#5B5FEF" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center shrink-0 order-2">
          <UserIcon size={16} />
        </div>
      )}
    </motion.div>
  );
}
