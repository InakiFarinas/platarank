export function WaxSeal({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="6.25" stroke="currentColor" strokeWidth="1.1" />
      <path
        d="M12 7.2 13.1 9.9 16 10.1 13.7 12 14.5 14.8 12 13.1 9.5 14.8 10.3 12 8 10.1 10.9 9.9Z"
        fill="currentColor"
      />
    </svg>
  );
}
