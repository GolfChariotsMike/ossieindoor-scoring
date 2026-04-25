import { useEffect, useState } from "react";

interface AceBlockFlashProps {
  trigger: { type: "ace" | "block"; team: "home" | "away"; id: number } | null;
}

const config = {
  ace: {
    label: "ACE!",
    bg: "bg-yellow-400",
    text: "text-volleyball-black",
    shadow: "drop-shadow-[0_0_40px_rgba(250,204,21,0.8)]",
  },
  block: {
    label: "BLOCK!",
    bg: "bg-blue-500",
    text: "text-white",
    shadow: "drop-shadow-[0_0_40px_rgba(59,130,246,0.8)]",
  },
};

export const AceBlockFlash = ({ trigger }: AceBlockFlashProps) => {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<typeof trigger>(null);

  useEffect(() => {
    if (!trigger) return;
    setCurrent(trigger);
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 1200);
    return () => clearTimeout(t);
  }, [trigger?.id]);

  if (!visible || !current) return null;

  const { label, bg, text, shadow } = config[current.type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div
        className={`${bg} ${text} ${shadow} rounded-3xl px-16 py-8 animate-bounce-in`}
        style={{
          animation: "aceBlockPop 1.2s ease forwards",
        }}
      >
        <span className="font-score text-[8rem] leading-none tracking-widest">
          {label}
        </span>
      </div>
      <style>{`
        @keyframes aceBlockPop {
          0%   { opacity: 0; transform: scale(0.4); }
          15%  { opacity: 1; transform: scale(1.15); }
          30%  { transform: scale(0.95); }
          40%  { transform: scale(1.05); }
          50%  { transform: scale(1); }
          75%  { opacity: 1; }
          100% { opacity: 0; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};
