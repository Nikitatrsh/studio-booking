type Tone = "success" | "info" | "error";

const toneClasses: Record<Tone, string> = {
  success: "bg-green-50 text-green-800 border-green-200",
  info: "bg-amber-50 text-amber-800 border-amber-200",
  error: "bg-red-50 text-red-800 border-red-200",
};

export default function Alert({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <div className={`rounded-md border px-3.5 py-2.5 text-sm ${toneClasses[tone]}`} role="alert">
      {children}
    </div>
  );
}
