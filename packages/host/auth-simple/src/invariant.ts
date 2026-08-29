/**
 * Package-owned invariant companion for `@deepseek-ai/dsh-host-auth-simple`.
 * @module @deepseek-ai/dsh-host-auth-simple/invariant
 */

import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = '@deepseek-ai/dsh-host-auth-simple'

/** Cordis companion plugin name. */
export const name = 'host-auth-simple-invariant'
/** Service required before the companion can register. */
export const inject = ['invariants']

/**
 * No runtime invariant: the login routes are registry-disposed with the fiber
 * and the cookie HMAC uses the same secret BrowserAuth owns; the package holds
 * no mutable state of its own to audit.
 */
const install: InvariantInstaller = () => {}

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
