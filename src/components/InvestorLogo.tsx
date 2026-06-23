type Props = {
  name: string;
  bgColor?: string;
  className?: string;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function InvestorLogo({ name, bgColor, className }: Props) {
  return (
    <div
      className={"relative w-full h-full flex items-center justify-center overflow-hidden " + (className ?? "")}
      style={{ background: bgColor ?? "var(--navy)" }}
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.08), transparent 70%)",
        }}
      />
      <span
        className="relative text-3xl font-bold tracking-wide"
        style={{
          color: "#ffffff",
          textShadow: "0 1px 3px rgba(0,0,0,0.4)",
        }}
      >
        {initials(name)}
      </span>
    </div>
  );
}
