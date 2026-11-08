import { useEffect, useRef } from 'react'

const CELL_SIZE = 14
const CELL_GAP = 4
const STEP = CELL_SIZE + CELL_GAP // 18px
const FADE_DURATION = 1200 // ms

// Authentic GitHub Contribution Graph Palette
const GITHUB_GREENS = [
  { fill: '#9be9a8', border: '#7bc98a' }, // Level 1 (Light Green)
  { fill: '#40c463', border: '#339e4f' }, // Level 2 (Medium Green)
  { fill: '#30a14e', border: '#26813e' }, // Level 3 (Vibrant Green)
  { fill: '#216e39', border: '#19532b' }, // Level 4 (Darkest Green)
  { fill: '#059669', border: '#047857' }, // Signature Accent Emerald
]

interface ActiveCell {
  x: number
  y: number
  color: { fill: string; border: string }
  startTime: number
}

export function GithubGridBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Offscreen canvas for fast pre-rendered resting grid
    let offscreenCanvas: HTMLCanvasElement | null = document.createElement('canvas')
    let offscreenCtx = offscreenCanvas.getContext('2d')

    const activeCells = new Map<string, ActiveCell>()
    let animationFrameId: number | null = null
    let lastMousePos: { x: number; y: number } | null = null

    let width = window.innerWidth
    let height = window.innerHeight
    let dpr = Math.min(window.devicePixelRatio || 1, 2)

    // Render static resting GitHub cells to offscreen canvas
    const updateOffscreenGrid = () => {
      if (!offscreenCanvas || !offscreenCtx) return

      offscreenCanvas.width = width * dpr
      offscreenCanvas.height = height * dpr
      offscreenCtx.scale(dpr, dpr)

      // Background ground: #fafbff
      offscreenCtx.fillStyle = '#fafbff'
      offscreenCtx.fillRect(0, 0, width, height)

      // Calculate grid offset so squares are neatly centered
      const cols = Math.ceil(width / STEP) + 1
      const rows = Math.ceil(height / STEP) + 1
      const offsetX = (width % STEP) / 2
      const offsetY = (height % STEP) / 2

      // Draw resting GitHub contribution cells (Level 0)
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const x = c * STEP + offsetX
          const y = r * STEP + offsetY

          offscreenCtx.fillStyle = '#f1f3f8'
          offscreenCtx.strokeStyle = 'rgba(226, 232, 240, 0.75)'
          offscreenCtx.lineWidth = 1

          offscreenCtx.beginPath()
          offscreenCtx.roundRect(x, y, CELL_SIZE, CELL_SIZE, 2.5)
          offscreenCtx.fill()
          offscreenCtx.stroke()
        }
      }
    }

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      dpr = Math.min(window.devicePixelRatio || 1, 2)

      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)

      offscreenCanvas = document.createElement('canvas')
      offscreenCtx = offscreenCanvas.getContext('2d')
      updateOffscreenGrid()
      render()
    }

    const render = () => {
      if (!ctx || !offscreenCanvas) return

      const now = performance.now()

      // 1. Draw cached resting grid
      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(offscreenCanvas, 0, 0, width, height)

      // 2. Draw active green cells with fade decay
      let hasActive = false

      activeCells.forEach((cell, key) => {
        const elapsed = now - cell.startTime
        const progress = elapsed / FADE_DURATION

        if (progress >= 1) {
          activeCells.delete(key)
        } else {
          hasActive = true
          const alpha = 1 - progress

          ctx.save()
          ctx.globalAlpha = alpha
          ctx.fillStyle = cell.color.fill
          ctx.strokeStyle = cell.color.border
          ctx.lineWidth = 1

          ctx.beginPath()
          ctx.roundRect(cell.x, cell.y, CELL_SIZE, CELL_SIZE, 2.5)
          ctx.fill()
          ctx.stroke()
          ctx.restore()
        }
      })

      if (hasActive && !prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render)
      } else {
        animationFrameId = null
      }
    }

    const startAnimation = () => {
      if (animationFrameId === null && !prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render)
      }
    }

    const activateCellAt = (clientX: number, clientY: number) => {
      const offsetX = (width % STEP) / 2
      const offsetY = (height % STEP) / 2

      const col = Math.floor((clientX - offsetX) / STEP)
      const row = Math.floor((clientY - offsetY) / STEP)

      if (col < 0 || row < 0) return

      const cellX = col * STEP + offsetX
      const cellY = row * STEP + offsetY
      const key = `${col},${row}`

      const randomGreen = GITHUB_GREENS[Math.floor(Math.random() * GITHUB_GREENS.length)]

      activeCells.set(key, {
        x: cellX,
        y: cellY,
        color: randomGreen,
        startTime: performance.now(),
      })

      startAnimation()
    }

    const handleMouseMove = (e: MouseEvent) => {
      const currentPos = { x: e.clientX, y: e.clientY }

      if (lastMousePos) {
        // Interpolate points between previous and current mouse move to prevent gaps
        const dx = currentPos.x - lastMousePos.x
        const dy = currentPos.y - lastMousePos.y
        const distance = Math.hypot(dx, dy)
        const steps = Math.min(Math.ceil(distance / (STEP / 2)), 8)

        for (let i = 0; i <= steps; i++) {
          const interpX = lastMousePos.x + dx * (i / steps)
          const interpY = lastMousePos.y + dy * (i / steps)
          activateCellAt(interpX, interpY)
        }
      } else {
        activateCellAt(currentPos.x, currentPos.y)
      }

      lastMousePos = currentPos
    }

    const handleMouseLeave = () => {
      lastMousePos = null
    }

    resize()
    window.addEventListener('resize', resize, { passive: true })
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      offscreenCanvas = null
      offscreenCtx = null
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 w-full h-full select-none"
    />
  )
}
