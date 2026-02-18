/* ---------------- Divider ---------------- */

export function Divider() {
  return (
    <div className="flex justify-center">
      <div
        className="
          flex items-center justify-center
          h-8 w-8
          rounded-full
          border border-black/5
          bg-white/70
          backdrop-blur
          text-black/40
          text-sm
        "
      >
        ↓
      </div>
    </div>
  );
}

/* ---------------- Footer ---------------- */

export function Footer() {
  return (
    <div className="flex justify-between text-xs text-black/40">
      <span>ZK-privacy enforced</span>
      <span>Relayer protected</span>
    </div>
  );
}

/* ---------------- Primary Button ---------------- */

export function PrimaryButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`
        w-full
        rounded-full
        py-3
        text-sm
        font-medium
        transition
        ${
          disabled
            ? "bg-black/10 text-black/40 cursor-not-allowed"
            : "bg-black text-white hover:bg-black/90 cursor-pointer"
        }
      `}
    >
      {children}
    </button>
  );
}
