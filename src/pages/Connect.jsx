import React, { useState } from "react";
import AuthLayout from "@/components/AuthLayout";
import { Plug, Copy, Check, ExternalLink } from "lucide-react";

const MCP_URL = "https://rhgo.base44.app/api/mcp";

function CopyButton({ value, label }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked — user can select manually */ }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all active:scale-95"
      style={{
        background: "hsla(265,40%,15%,0.8)",
        border: "1px solid hsla(270,50%,50%,0.3)",
        color: "hsl(var(--amethyst-glow))",
      }}
    >
      <span className="flex-1 text-left truncate">{label || value}</span>
      {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
    </button>
  );
}

function ClientCard({ icon, name, steps, link }) {
  return (
    <div className="rounded-2xl p-4 mb-3"
      style={{
        background: "linear-gradient(145deg, hsla(255,30%,12%,0.6), hsla(245,25%,8%,0.8))",
        border: "1px solid hsla(270,40%,45%,0.2)",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{icon}</span>
        <h3 className="text-white font-bold text-sm">{name}</h3>
        {link && (
          <a href={link} target="_blank" rel="noopener noreferrer"
            className="ml-auto text-white/40 hover:text-white/70 transition">
            <ExternalLink size={14} />
          </a>
        )}
      </div>
      <ol className="space-y-1.5">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-2 text-xs text-white/60">
            <span className="text-amethyst-glow/70 font-bold shrink-0">{i + 1}.</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function Connect() {
  return (
    <AuthLayout
      icon={Plug}
      title="Connect your AI assistant"
      subtitle="Link Claude, ChatGPT, Cursor, or any MCP client to your RockHound-GO data"
    >
      <p className="text-sm text-white/50 mb-4">
        Use the MCP URL below to connect your AI assistant. You'll authorize
        access on your phone after pasting it — your data stays yours.
      </p>

      <div className="mb-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1.5">MCP Server URL</p>
        <CopyButton value={MCP_URL} label={MCP_URL} />
      </div>

      <ClientCard
        icon="🤖"
        name="Claude (Desktop)"
        link="https://modelcontextprotocol.io/quickstart/user"
        steps={[
          "Open Claude Desktop Settings → Developer",
          "Click 'Edit Config' to open the config file",
          "Add a new MCP server with the URL above (streamable HTTP type)",
          "Restart Claude — it will prompt you to authorize on your phone",
        ]}
      />

      <ClientCard
        icon="💬"
        name="ChatGPT"
        link="https://help.openai.com/en/articles/10237198"
        steps={[
          "Go to ChatGPT Settings → Connectors",
          "Click 'Add connector' → 'Custom connector'",
          "Paste the MCP URL above and save",
          "Open the link ChatGPT sends to authorize on your phone",
        ]}
      />

      <ClientCard
        icon="⚡"
        name="Cursor"
        link="https://docs.cursor.com/context/model-context-protocol"
        steps={[
          "Open Cursor Settings → MCP",
          "Click 'Add new MCP server'",
          "Choose 'streamable HTTP' and paste the URL above",
          "Authorize when Cursor opens the consent link",
        ]}
      />

      <ClientCard
        icon="🔧"
        name="Custom MCP client"
        steps={[
          "Use any client that supports the MCP streamable HTTP transport",
          "Point it at the URL above",
          "Complete the OAuth flow when your browser opens the consent page",
        ]}
      />
    </AuthLayout>
  );
}