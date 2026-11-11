interface TrafficLightDotsProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function TrafficLightDots({ className = '', size = 'sm' }: TrafficLightDotsProps) {
  const dotSize =
    size === 'xl'
      ? 'w-3.5 h-3.5'
      : size === 'lg'
        ? 'w-3 h-3'
        : size === 'md'
          ? 'w-2.5 h-2.5'
          : 'w-2 h-2'
  const gap = size === 'xl' ? 'gap-2.5' : 'gap-2'

  return (
    <div className={`flex items-center ${gap} ${className}`} aria-hidden="true">
      <span className={`${dotSize} rounded-full bg-[var(--mac-close,#ff5f56)] inline-block shadow-2xs hover:opacity-80 transition-opacity`} />
      <span className={`${dotSize} rounded-full bg-[var(--mac-minimize,#ffbd2e)] inline-block shadow-2xs hover:opacity-80 transition-opacity`} />
      <span className={`${dotSize} rounded-full bg-[var(--mac-maximize,#27c93f)] inline-block shadow-2xs hover:opacity-80 transition-opacity`} />
    </div>
  )
}
