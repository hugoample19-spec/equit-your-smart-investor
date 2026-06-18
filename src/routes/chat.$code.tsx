import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Send } from "lucide-react";
import { useState } from "react";
import { findUserByCode } from "@/lib/data";
import { useApp } from "@/lib/app-context";

export const Route = createFileRoute("/chat/$code")({
  head: ({ params }) => {
    const u = findUserByCode(params.code);
    return {
      meta: [
        { title: `Chat con ${u?.handle ?? "usuario"} · Equit` },
        { name: "description", content: "Conversación privada en Equit." },
      ],
    };
  },
  loader: ({ params }) => {
    const user = findUserByCode(params.code);
    if (!user) throw notFound();
    return { user };
  },
  notFoundComponent: () => <p className="pt-10 text-center text-sm">Conversación no encontrada</p>,
  component: ChatPage,
});

function ChatPage() {
  const { user } = Route.useLoaderData() as { user: ReturnType<typeof findUserByCode> & object };
  const { chats, sendMessage } = useApp();
  const [text, setText] = useState("");

  const seed = [
    { from: "them" as const, text: `¡Hola! Soy ${user.name.split(" ")[0]} 👋`, at: Date.now() - 86400000 },
    { from: "them" as const, text: `Vi tu cartera, muy buen rendimiento.`, at: Date.now() - 86000000 },
  ];
  const history = chats[user.code] ?? [];
  const all = [...seed, ...history];

  const onSend = () => {
    const t = text.trim();
    if (!t) return;
    sendMessage(user.code, t);
    setText("");
  };

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100vh - 180px)" }}>
      <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
        <Link to="/u/$code" params={{ code: user.code }} style={{ color: "var(--navy)" }}>
          <ArrowLeft size={18} />
        </Link>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-semibold" style={{ background: "var(--navy)", color: "var(--cream)" }}>
          {user.name.split(" ").map(w => w[0]).slice(0,2).join("")}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--navy)" }}>{user.handle}</p>
          <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>#{user.code}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-2">
        {all.map((m, i) => (
          <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[75%] px-3.5 py-2 rounded-2xl text-sm"
              style={{
                background: m.from === "me" ? "var(--navy)" : "var(--muted)",
                color: m.from === "me" ? "var(--cream)" : "var(--navy)",
                borderBottomRightRadius: m.from === "me" ? 6 : undefined,
                borderBottomLeftRadius: m.from === "them" ? 6 : undefined,
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-3 pb-2 sticky bottom-20 bg-[var(--cream)]">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onSend(); }}
          placeholder="Mensaje…"
          className="flex-1 px-4 py-2.5 rounded-full text-sm outline-none border"
          style={{ background: "var(--muted)", borderColor: "transparent", color: "var(--navy)" }}
        />
        <button
          onClick={onSend}
          aria-label="Enviar"
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "var(--navy)", color: "var(--cream)" }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
