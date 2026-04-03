/** Miniature inline SVG previews for the block palette — ~40×24px each */

export function StartPreview() {
  return (
    <svg width="40" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="38" height="22" rx="11" ry="11"
        stroke="var(--teal)" strokeWidth="2" fill="var(--bg-canvas)" />
    </svg>
  )
}

export function EndPreview() {
  return (
    <svg width="40" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="38" height="22" rx="11" ry="11"
        stroke="var(--red)" strokeWidth="2" fill="var(--bg-canvas)" />
    </svg>
  )
}

export function ActionPreview() {
  return (
    <svg width="40" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="38" height="22" rx="3"
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
    <svg width="40" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="38" height="22" rx="3"
        stroke="var(--border-hi)" strokeWidth="2" fill="var(--bg-canvas)" />
      {/* Thick left accent border */}
      <rect x="1" y="1" width="4" height="22" rx="3"
        fill="var(--teal)" />
    </svg>
  )
}
