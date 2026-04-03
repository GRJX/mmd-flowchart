import { toPng, toSvg } from 'html-to-image'
import { getNodesBounds, getViewportForBounds } from '@xyflow/react'
import type { Node } from '@xyflow/react'

const PADDING = 32
const MIN_ZOOM = 0.5
const MAX_ZOOM = 2

function stripExtension(name: string): string {
  return name.replace(/\.mmd$/i, '')
}

function triggerDownload(dataUrl: string, filename: string): void {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export async function exportAsPng(
  nodes: Node[],
  diagramName: string,
  theme: 'light' | 'dark',
): Promise<void> {
  const viewport = document.querySelector('.react-flow__viewport') as HTMLElement | null
  if (!viewport || nodes.length === 0) return

  const bounds = getNodesBounds(nodes)
  const width = Math.max(bounds.width + PADDING * 2, 400)
  const height = Math.max(bounds.height + PADDING * 2, 300)
  const { x, y, zoom } = getViewportForBounds(bounds, width, height, MIN_ZOOM, MAX_ZOOM, PADDING)

  const dataUrl = await toPng(viewport, {
    width,
    height,
    backgroundColor: theme === 'dark' ? '#111111' : '#ffffff',
    style: {
      transform: `translate(${x}px, ${y}px) scale(${zoom})`,
      transformOrigin: '0 0',
      width: `${width}px`,
      height: `${height}px`,
    },
  })

  triggerDownload(dataUrl, `${stripExtension(diagramName)}.png`)
}

export async function exportAsSvg(nodes: Node[], diagramName: string): Promise<void> {
  const viewport = document.querySelector('.react-flow__viewport') as HTMLElement | null
  if (!viewport || nodes.length === 0) return

  const bounds = getNodesBounds(nodes)
  const width = Math.max(bounds.width + PADDING * 2, 400)
  const height = Math.max(bounds.height + PADDING * 2, 300)
  const { x, y, zoom } = getViewportForBounds(bounds, width, height, MIN_ZOOM, MAX_ZOOM, PADDING)

  const dataUrl = await toSvg(viewport, {
    width,
    height,
    style: {
      transform: `translate(${x}px, ${y}px) scale(${zoom})`,
      transformOrigin: '0 0',
      width: `${width}px`,
      height: `${height}px`,
    },
  })

  triggerDownload(dataUrl, `${stripExtension(diagramName)}.svg`)
}
