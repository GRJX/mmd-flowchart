interface FileIconProps {
  size?: number
}

/** Document SVG with folded top-right corner — inline SVG only, no emoji */
export function FileIcon({ size = 16 }: FileIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Document body */}
      <path
        d="M4 2H9.5L13 5.5V14H4V2Z"
        fill="var(--text-dim)"
        opacity="0.7"
      />
      {/* Folded corner */}
      <path
        d="M9.5 2L13 5.5H9.5V2Z"
        fill="var(--bg-panel)"
        opacity="0.9"
      />
      <path
        d="M9.5 2L13 5.5H9.5V2Z"
        stroke="var(--border-hi)"
        strokeWidth="0.5"
      />
      {/* Document lines */}
      <line x1="6" y1="7.5" x2="11" y2="7.5" stroke="var(--bg-panel)" strokeWidth="0.8" opacity="0.6" />
      <line x1="6" y1="9.5" x2="11" y2="9.5" stroke="var(--bg-panel)" strokeWidth="0.8" opacity="0.6" />
      <line x1="6" y1="11.5" x2="9" y2="11.5" stroke="var(--bg-panel)" strokeWidth="0.8" opacity="0.6" />
    </svg>
  )
}
