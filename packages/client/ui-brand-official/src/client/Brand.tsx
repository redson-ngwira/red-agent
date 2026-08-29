import type { HeroBrandMarkOwnerProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { SidebarBrandMarkOwnerProps } from '@deepseek-ai/dsh-client-ui-sidebar/client'

type OfficialBrandMarkProps = HeroBrandMarkOwnerProps & SidebarBrandMarkOwnerProps

/**
 * RED AGENT — fork of DeepSeek Harness. Replaces the DeepSeek whale wordmark
 * with a minimal RED AGENT lockup so the hosted SaaS has its own identity
 * without forking 265 packages' scopes.
 * @param props - Host-supplied mark presentation.
 * @returns the RED AGENT mark.
 */
export function OfficialBrandMark({ size, className }: OfficialBrandMarkProps) {
  const dim = size
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: dim,
        height: dim,
        borderRadius: 4,
        background: '#E10600',
        color: 'white',
        fontWeight: 900,
        fontSize: dim * 0.55,
        lineHeight: 1,
        letterSpacing: '-0.02em',
      }}
      aria-label="RED AGENT"
    >
      R
    </span>
  )
}

/**
 * Render the RED AGENT name artwork without its independently slotted mark.
 * @returns the RED AGENT wordmark.
 */
export function OfficialBrandName() {
  return (
    <span style={{ color: '#E10600', fontWeight: 900, letterSpacing: '0.06em', fontSize: '1.05em' }}>
      RED AGENT
    </span>
  )
}
