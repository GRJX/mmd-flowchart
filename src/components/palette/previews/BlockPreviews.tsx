/** Miniature inline SVG previews for the block palette — ~40×32px each */

export function StartPreview() {
  return (
    <svg width="36" height="28" viewBox="0 0 36 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="18" cy="14" rx="16" ry="12"
        stroke="var(--teal)" strokeWidth="2" fill="var(--bg-canvas)" />
    </svg>
  )
}

export function EndPreview() {
  return (
    <svg width="36" height="28" viewBox="0 0 36 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="18" cy="14" rx="16" ry="12"
        stroke="var(--red)" strokeWidth="2" fill="var(--bg-canvas)" />
    </svg>
  )
}

export function ActionPreview() {
  return (
    <svg width="38" height="28" viewBox="0 0 38 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="36" height="26" rx="4"
        stroke="var(--border-hi)" strokeWidth="2" fill="var(--bg-canvas)" />
    </svg>
  )
}

export function DecisionPreview() {
  return (
    <svg width="40" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Diamond: points at top-center, right-center, bottom-center, left-center */}
      <polygon
        points="20,2 38,12 20,22 2,12"
        stroke="var(--yellow)" strokeWidth="2" fill="var(--bg-canvas)"
      />
    </svg>
  )
}

export function ResultPreview() {
  return (
    <svg width="38" height="28" viewBox="0 0 38 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="36" height="26" rx="4"
        stroke="var(--border-hi)" strokeWidth="2" fill="var(--bg-canvas)" />
      {/* Thick left accent border */}
      <rect x="1" y="1" width="4" height="26" rx="3"
        fill="var(--teal)" />
    </svg>
  )
}
