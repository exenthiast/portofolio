import { forwardRef, type ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant
  size?: ButtonSize
  href?: string
  target?: string
  rel?: string
  children: ReactNode
  className?: string
  icon?: ReactNode
  iconRight?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      href,
      target,
      rel,
      children,
      className = '',
      icon,
      iconRight,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium tracking-tight transition-colors duration-150 select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:opacity-50 disabled:pointer-events-none'

    const sizeStyles = {
      sm: 'text-xs px-3.5 py-1.5 rounded-full gap-1.5 h-8',
      md: 'text-sm px-5 py-2.5 rounded-full gap-2 h-10',
      lg: 'text-base px-6 py-3 rounded-full gap-2.5 h-12',
    }[size]

    const variantStyles = {
      primary:
        'bg-[#0c0d12] text-white hover:bg-[#1f2029] active:bg-black shadow-xs',
      secondary:
        'bg-[var(--surface-raised)] text-[var(--ink)] border border-slate-200/80 hover:bg-slate-200/60 active:bg-slate-200 shadow-2xs',
      outline:
        'bg-transparent text-[var(--ink)] border border-slate-300 hover:bg-[var(--surface-raised)] active:bg-slate-200',
      ghost:
        'bg-transparent text-[var(--ink-secondary)] hover:text-[var(--ink)] hover:bg-slate-100/70',
    }[variant]

    const combinedClassName = `${baseStyles} ${sizeStyles} ${variantStyles} ${className}`

    if (href) {
      return (
        <motion.a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          target={target}
          rel={target === '_blank' ? 'noopener noreferrer ' + (rel || '') : rel}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={combinedClassName}
        >
          {icon && <span className="shrink-0">{icon}</span>}
          <span>{children}</span>
          {iconRight && <span className="shrink-0">{iconRight}</span>}
        </motion.a>
      )
    }

    return (
      <motion.button
        ref={ref as React.Ref<HTMLButtonElement>}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={combinedClassName}
        {...props}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        <span>{children}</span>
        {iconRight && <span className="shrink-0">{iconRight}</span>}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'
