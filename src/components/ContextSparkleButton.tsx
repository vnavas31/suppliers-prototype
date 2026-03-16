import { Bot } from "lucide-react";

export default function ContextSparkleButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-[#0FB9B1] hover:text-[#0FB9B1]"
      title={label}
      aria-label={label}
    >
      <Bot className="h-4 w-4" />
    </button>
  );
}