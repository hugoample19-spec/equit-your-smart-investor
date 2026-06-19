import { useState } from "react";

type Props = {
  src: string;
  name: string;
  className?: string;
  imgClassName?: string;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function InvestorLogo({ src, name, className, imgClassName }: Props) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className={
        "w-full h-full flex items-center justify-center " + (className ?? "")
      }
      style={{ background: "var(--navy)" }}
    >
      {failed || !src ? (
        <span
          className="text-3xl font-bold tracking-wide"
          style={{ color: "var(--gold)" }}
        >
          {initials(name)}
        </span>
      ) : (
        <img
          src={src}
          alt={name}
          onError={() => setFailed(true)}
          className={"max-w-[65%] max-h-[55%] object-contain " + (imgClassName ?? "")}
          style={{ filter: "brightness(0) invert(1)" }}
        />
      )}
    </div>
  );
}
