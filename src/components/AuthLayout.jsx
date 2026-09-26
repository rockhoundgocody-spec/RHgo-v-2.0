import React from "react";
import { Link } from "react-router-dom";
import AuthChamberCanvas from "@/components/AuthChamberCanvas";

export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 relative">
      <AuthChamberCanvas />
      <div className="w-full max-w-[430px]">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="brand text-[20px] font-semibold tracking-tight text-[#E8EEF2]">
            ROCKHOUND-<span className="italic bg-gradient-to-r from-[#A78BFA] to-[#E8C36A] bg-clip-text text-transparent">GO</span>
          </Link>
          <span className="text-[10px] tracking-[0.16em] uppercase text-[#5C6B74]">Field desk</span>
        </div>

        <div
          className="rounded-[18px] p-5"
          style={{
            background: "rgba(10,14,24,0.68)",
            backdropFilter: "blur(18px)",
            border: "1px solid rgba(232,238,242,0.14)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          <h1 className="text-[28px] leading-[1.12] tracking-tight font-semibold mb-2 bg-gradient-to-r from-[#A78BFA] to-[#E8C36A] bg-clip-text text-transparent">
            {title}
          </h1>
          {subtitle && <p className="text-[#9AA8B0] text-[15px] mb-4">{subtitle}</p>}
          {children}
        </div>

        {footer && <p className="text-center text-sm text-[#9AA8B0] mt-5">{footer}</p>}
        <p className="text-center text-[11px] text-[#5C6B74] mt-6">
          Snap it. Know it. Log it.
        </p>
      </div>
    </div>
  );
}
