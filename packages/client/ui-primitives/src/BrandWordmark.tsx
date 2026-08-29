import type { IconProps } from './icons/props.ts'

/** Display options for the official brand wordmark. */
export interface BrandWordmarkProps extends IconProps {
  /** Whether to include the leading mark; defaults to true. */
  includeMark?: boolean | undefined
}

/**
 * RED AGENT wordmark — replaces DeepSeek whale wordmark.
 * @param props.size - height in px (default 24).
 * @param props.className - extra class for layout placement.
 * @param props.includeMark - whether to include the leading R badge.
 * @returns the RED AGENT wordmark (aria-hidden).
 */
export function BrandWordmark({ size = 24, className, includeMark = true }: BrandWordmarkProps) {
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontWeight: 900,
        letterSpacing: '0.06em',
        fontSize: size * 0.7,
        color: '#E10600',
        lineHeight: 1,
      }}
      aria-hidden="true"
    >
      {includeMark ? (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: size,
            height: size,
            borderRadius: 4,
            background: '#E10600',
            color: 'white',
            fontSize: size * 0.55,
          }}
        >
          R
        </span>
      ) : null}
      RED AGENT
    </span>
  )
}
