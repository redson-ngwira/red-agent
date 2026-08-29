import type { IconProps } from './icons/props.ts'

/**
 * RED AGENT mark — replaces the DeepSeek whale. Kept as FishLogo for
 * API compatibility; renders a red R badge so existing imports keep working.
 * @param props.size - square edge in px (default 24).
 * @param props.className - extra class for layout placement.
 * @returns the RED AGENT R badge (aria-hidden).
 */
export function FishLogo({ size = 24, className }: IconProps) {
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: 4,
        background: '#E10600',
        color: 'white',
        fontWeight: 900,
        fontSize: size * 0.55,
        lineHeight: 1,
      }}
      aria-hidden="true"
    >
      R
    </span>
  )
}
