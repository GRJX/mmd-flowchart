interface FolderIconProps {
  open?: boolean
  size?: number
}

/** VS Code-style two-tone folder icon — inline SVG only, no emoji */
export function FolderIcon({ open = false, size = 16 }: FolderIconProps) {
  if (open) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Open folder: body */}
        <path
          d="M1.5 4.5C1.5 3.948 1.948 3.5 2.5 3.5H6L7 5H13.5C14.052 5 14.5 5.448 14.5 6V12C14.5 12.552 14.052 13 13.5 13H2.5C1.948 13 1.5 12.552 1.5 12V4.5Z"
          fill="#dcb67a"
          opacity="0.9"
        />
        {/* Tab lighter */}
        <path
          d="M1.5 6H14.5V12C14.5 12.552 14.052 13 13.5 13H2.5C1.948 13 1.5 12.552 1.5 12V6Z"
          fill="#e8c987"
        />
      </svg>
    )
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Closed folder: base */}
      <path
        d="M1.5 5C1.5 4.448 1.948 4 2.5 4H6L7 5.5H13.5C14.052 5.5 14.5 5.948 14.5 6.5V12C14.5 12.552 14.052 13 13.5 13H2.5C1.948 13 1.5 12.552 1.5 12V5Z"
        fill="#dcb67a"
        opacity="0.85"
      />
      {/* Tab on top */}
      <path
        d="M1.5 5H6L7 6.5H14.5V12C14.5 12.552 14.052 13 13.5 13H2.5C1.948 13 1.5 12.552 1.5 12V5Z"
        fill="#e8c987"
      />
    </svg>
  )
}
