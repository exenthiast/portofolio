interface TrafficLightDotsProps {
  className?: string
  size?: 'sm' | 'md'
}

export function TrafficLightDots({ className = '', size = 'sm' }: TrafficLightDotsProps) {
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5'

  return (
    <div className={`flex items-center gap-1.5 ${className}`} aria-hidden="true">
      <span className={`${dotSize} rounded-full bg-[var(--mac-close,#ff5f56)] inline-block shadow-xs`} />
      <span className={`${dotSize} rounded-full bg-[var(--mac-minimize,#ffbd2e)] inline-block shadow-xs`} />
      <span className={`${dotSize} rounded-full bg-[var(--mac-maximize,#27c93f)] inline-block shadow-xs`} />
    </div>
  )
}
