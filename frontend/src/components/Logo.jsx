export default function Logo({ size = "md", showSubtitle = true, className = "" }) {
  const sizes = {
    sm: { icon: "w-7 h-7", text: "text-sm", sub: "text-[0.6rem]", gap: "gap-2" },
    md: { icon: "w-9 h-9", text: "text-base", sub: "text-[0.65rem]", gap: "gap-2.5" },
    lg: { icon: "w-11 h-11", text: "text-xl", sub: "text-xs", gap: "gap-3" },
  };

  const current = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center ${current.gap} select-none ${className}`}>
      {/* Brand Icon SVG */}
      <div className={`relative ${current.icon} rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-600 p-[1.5px] shadow-lg shadow-sky-500/20 group`}>
        <div className="w-full h-full bg-slate-900 dark:bg-slate-950 rounded-[10px] flex items-center justify-center overflow-hidden relative">
          {/* Subtle inner grid pattern */}
          <svg className="w-full h-full p-1.5 text-sky-400 transform transition-transform duration-300 group-hover:scale-110" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 2L3 9.5V22.5L16 30L29 22.5V9.5L16 2Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
            <path d="M16 2V16.5M16 16.5L29 9.5M16 16.5L3 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" opacity="0.75" />
            <path d="M16 16.5V30" stroke="url(#logo_grad)" strokeWidth="2.2" />
            <circle cx="16" cy="16.5" r="2.5" fill="#38bdf8" />
            <defs>
              <linearGradient id="logo_grad" x1="16" y1="16.5" x2="16" y2="30" gradientUnits="userSpaceOnUse">
                <stop stopColor="#38bdf8" />
                <stop offset="1" stopColor="#818cf8" />
              </linearGradient>
            </defs>
          </svg>
          {/* Glow effect */}
          <div className="absolute inset-0 bg-sky-400/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <span className={`font-black tracking-tight ${current.text} bg-gradient-to-r from-slate-900 via-sky-600 to-indigo-600 dark:from-white dark:via-sky-400 dark:to-indigo-300 bg-clip-text text-transparent`}>
            InfoTech
          </span>
          <span className="text-[0.65rem] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            ERP
          </span>
        </div>
        {showSubtitle && (
          <span className={`font-semibold tracking-wider uppercase ${current.sub} text-slate-500 dark:text-slate-400`}>
            Operations CRM Portal
          </span>
        )}
      </div>
    </div>
  );
}
