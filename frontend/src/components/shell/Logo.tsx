export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="12" cy="16" r="9" stroke="#5FD3D0" strokeWidth="2.4" />
      <circle cx="20" cy="16" r="9" stroke="#FFFFFF" strokeWidth="2.4" />
      <path d="M16 7.94A9 9 0 0 1 16 24.06A9 9 0 0 1 16 7.94Z" fill="#5FD3D0" fillOpacity=".4" />
    </svg>
  )
}
