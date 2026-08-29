/**
 * @deepseek-ai/dsh-host-auth-simple — RED AGENT hosted login gate.
 * Serves GET /login (form), POST /login (check RED_AGENT_PASSWORD or
 * RED_AGENT_USERS JSON), and GET /logout (clear). On success it mints the
 * same `__Host-dsh-auth-*` HMAC cookie BrowserAuth uses (via the
 * `client-connection` credential secret) so `isAuthenticated` passes without
 * `?token=`. The form is accessible without auth; all other routes remain
 * gated by BrowserAuth's normal Host/Origin + cookie checks.
 * @module @deepseek-ai/dsh-host-auth-simple
 */
import { createHash, createHmac, randomBytes } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { Context, Service } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { credentialKey } from '@deepseek-ai/dsh-credentials'
import type { CredentialProvider } from '@deepseek-ai/dsh-credentials'
import type {} from '@deepseek-ai/dsh-host-webserver'

const AUTH_RECORD_KEY = credentialKey('client-connection', 'browser-session')
const COOKIE_PREFIX = 'dsh-auth-'
const COOKIE_PAYLOAD_VERSION = 1 as const
const STORED_SECRET_VERSION = 1 as const

function encodeBase64Url(v: Uint8Array): string {
  return Buffer.from(v).toString('base64').replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '')
}
function decodeBase64Url(v: string): Buffer | undefined {
  if (!/^[A-Za-z0-9_-]*$/u.test(v) || v.length % 4 === 1) return undefined
  const pad = '='.repeat((4 - v.length % 4) % 4)
  const d = Buffer.from(v.replaceAll('-', '+').replaceAll('_', '/') + pad, 'base64')
  return encodeBase64Url(d) === v ? d : undefined
}
function header(headers: IncomingMessage['headers'], name: string): string | undefined {
  const v = headers[name.toLowerCase()]
  return typeof v === 'string' ? v : Array.isArray(v) ? v[0] : undefined
}
function requestAuthority(headers: IncomingMessage['headers']): string | undefined {
  const h = header(headers, 'host')
  if (h === undefined) return undefined
  try { return new URL(`http://${h}`).host } catch { return undefined }
}
function cookieName(authority: string): string {
  return COOKIE_PREFIX + encodeBase64Url(createHash('sha256').update(authority).digest())
}
function sessionCookie(name: string, value: string, expiresAt: number, maxAgeSeconds: number, isSecure: boolean): string {
  const secureName = isSecure && !name.startsWith('__Host-') ? `__Host-${name}` : name
  const base = `${secureName}=${value}; Max-Age=${String(maxAgeSeconds)}; Path=/; Expires=${new Date(expiresAt).toUTCString()}; HttpOnly; SameSite=Strict`
  return isSecure ? `${base}; Secure` : base
}
function clearCookieHeader(authority: string): string {
  const base = cookieName(authority)
  const names = [base, `__Host-${base}`]
  // Clear both variants; Node's set-cookie can be string array — caller handles.
  return `${names[0]}=; Max-Age=0; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Strict`
}
function isHttpsForwarded(headers: IncomingMessage['headers']): boolean {
  const f = header(headers, 'x-forwarded-proto')
  if (f !== undefined) return f.toLowerCase() === 'https'
  return false
}
function signature(secret: Buffer, body: string): Buffer {
  return createHmac('sha256', secret).update(body).digest()
}
function encodeCookie(payload: unknown, secret: Buffer): string {
  const body = encodeBase64Url(Buffer.from(JSON.stringify(payload), 'utf8'))
  return `v1.${body}.${encodeBase64Url(signature(secret, body))}`
}
function parseBody(req: IncomingMessage): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => chunks.push(c))
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      const ct = header(req.headers, 'content-type') ?? ''
      if (ct.includes('application/json')) {
        try { resolve(JSON.parse(raw || '{}')) } catch { resolve({}) }
      } else {
        const p = new URLSearchParams(raw)
        const out: Record<string, string> = {}
        for (const [k, v] of p) out[k] = v
        resolve(out)
      }
    })
    req.on('error', reject)
  })
}
function loginHtml(error?: string, next?: string): string {
  const err = error ? `<p style="color:#E10600;background:#fff1f1;border:1px solid #E1060022;padding:10px 12px;border-radius:8px;font-size:14px">${error}</p>` : ''
  const nxt = next ? `<input type="hidden" name="next" value="${next.replaceAll('"', '&quot;')}">` : ''
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RED AGENT — Login</title>
<style>body{font-family:ui-sans,system-ui,Arial;margin:0;background:#0a0a0a;color:#fff;display:grid;place-items:center;min-height:100vh}
.card{width:360px;background:#111;border:1px solid #222;border-radius:16px;padding:28px;box-shadow:0 10px 40px #0008}
h1{margin:0 0 6px;font-size:22px;letter-spacing:0.06em;font-weight:900;color:#E10600}
p.sub{margin:0 0 18px;color:#888;font-size:13px}
label{font-size:13px;color:#aaa;display:block;margin:12px 0 6px}
input{width:100%;box-sizing:border-box;padding:11px 12px;border-radius:10px;border:1px solid #222;background:#0c0c0c;color:#fff;outline:none}
input:focus{border-color:#E10600}
button{width:100%;margin-top:18px;padding:11px;border-radius:10px;border:0;background:#E10600;color:#fff;font-weight:800;letter-spacing:0.04em;cursor:pointer}
a{color:#888;font-size:13px}</style></head><body><div class="card">
<h1>RED AGENT</h1><p class="sub">Hosted harness — sign in to continue</p>
${err}
<form method="post" action="/login">
${nxt}
<label>Password</label><input type="password" name="password" placeholder="••••••••" required autofocus>
<button type="submit">Sign in</button>
</form>
<p style="margin:14px 0 0;color:#555;font-size:12px">Set <code>RED_AGENT_PASSWORD</code> in Render env. Default demo password is <code>red</code> when unset.</p>
</div></body></html>`
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    authSimple: AuthSimple
  }
}

export interface Config {
  /** Cookie lifetime days; default 7. */
  cookieMaxAgeDays?: number
  /** Demo password when RED_AGENT_PASSWORD env is unset; default "red". */
  demoPassword?: string
}
export const Config: z<Config> = z.object({
  cookieMaxAgeDays: z.number().min(1).max(365).default(7),
  demoPassword: z.string().default('red'),
})

export class AuthSimple extends Service {
  static inject = ['webServer', 'credentials']
  static Config = Config

  constructor(ctx: Context, private config: Config) {
    super(ctx, 'authSimple')
  }

  async [Service.init](): Promise<void> {
    const webServer = (this.ctx as unknown as { webServer: { register: (route: { kind: 'exact' | 'prefix'; path: string; handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void> }) => () => void } }).webServer
    const credentials = this.ctx.get('credentials') as unknown as CredentialProvider | undefined
    if (credentials === undefined) {
      this.ctx.logger.warn('auth-simple: credentials provider missing — login will not mint cookies')
      return
    }

    const getSecret = async (): Promise<Buffer | undefined> => {
      const rec = await (credentials as unknown as { readRecord: (k: unknown) => Promise<import('@deepseek-ai/dsh-credentials').CredentialRecord | undefined> }).readRecord(AUTH_RECORD_KEY)
      if (rec === undefined) {
        const secretB64 = encodeBase64Url(randomBytes(32))
        const created = await (credentials as unknown as { modifyRecord: (k: unknown, fn: (cur: unknown) => Promise<unknown>) => Promise<unknown> }).modifyRecord(AUTH_RECORD_KEY, (cur) => {
          if (cur !== undefined) return Promise.resolve(undefined)
          return Promise.resolve({ kind: 'grant', payload: { version: STORED_SECRET_VERSION, secret: secretB64 } })
        })
        const s = ((created as unknown as { payload?: unknown })?.payload as Record<string, unknown> | undefined)?.secret as string | undefined
        const dec = s ? decodeBase64Url(s) : undefined
        return dec ?? undefined
      }
      if (rec.kind !== 'grant') return undefined
      const sec = (rec as unknown as { payload: unknown }).payload as Record<string, unknown> | undefined
      const secStr = sec?.secret as string | undefined
      if (typeof secStr !== 'string') return undefined
      return decodeBase64Url(secStr) ?? undefined
    }

    const checkPassword = (candidate: string): boolean => {
      const envPwd = process.env.RED_AGENT_PASSWORD
      const expected = envPwd !== undefined && envPwd.length > 0 ? envPwd : this.config.demoPassword ?? 'red'
      const usersRaw = process.env.RED_AGENT_USERS
      if (usersRaw) {
        try {
          const arr = JSON.parse(usersRaw) as unknown
          if (Array.isArray(arr)) {
            for (const u of arr as Array<Record<string, unknown>>) {
              if (typeof u.password === 'string' && candidate === u.password) return true
            }
          }
        } catch { /* ignore malformed */ }
      }
      return candidate === expected
    }

    const handleLoginGet = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
      if (req.method !== 'GET') { res.writeHead(405); res.end(); return }
      const url = new URL(req.url ?? '/login', 'http://x')
      const next = url.searchParams.get('next') ?? '/'
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
      res.end(loginHtml(undefined, next))
    }

    const handleLoginPost = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
      if (req.method !== 'POST') { res.writeHead(405); res.end(); return }
      const body = await parseBody(req)
      const password = body.password ?? ''
      const nextRaw = body.next ?? '/'
      const next = nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : '/'
      if (!checkPassword(password)) {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
        res.end(loginHtml('Wrong password', next))
        return
      }
      const authority = requestAuthority(req.headers)
      if (authority === undefined) { res.writeHead(400); res.end('missing Host'); return }
      const secret = await getSecret()
      if (secret === undefined) { res.writeHead(500); res.end('auth not ready'); return }
      const isSecure = isHttpsForwarded(req.headers) || process.env.RENDER !== undefined
      const maxAgeDays = this.config.cookieMaxAgeDays ?? 7
      const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000
      const issuedAt = Date.now()
      const expiresAt = issuedAt + maxAgeMs
      const value = encodeCookie({ version: COOKIE_PAYLOAD_VERSION, authority, issuedAt, expiresAt }, secret)
      const maxAgeSec = Math.floor(maxAgeMs / 1000)
      const cookie = sessionCookie(cookieName(authority), value, expiresAt, maxAgeSec, isSecure)
      res.writeHead(303, {
        'set-cookie': cookie,
        'location': next,
        'cache-control': 'no-store',
        'referrer-policy': 'no-referrer',
      })
      res.end()
    }

    const handleLogout = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
      const authority = requestAuthority(req.headers)
      if (authority !== undefined) {
        const c1 = clearCookieHeader(authority)
        // Also clear __Host- variant
        const c2 = clearCookieHeader(authority).replace('dsh-auth-', '__Host-dsh-auth-')
        res.writeHead(303, {
          'set-cookie': [c1, c2] as unknown as string,
          'location': '/login',
          'cache-control': 'no-store',
        } as unknown as Record<string, string>)
        res.end()
        return
      }
      res.writeHead(303, { 'location': '/login', 'cache-control': 'no-store' })
      res.end()
    }

    this.ctx.effect(() => {
      const d1 = webServer.register({ kind: 'exact', path: '/login', handler: async (req, res) => {
        if (req.method === 'GET') await handleLoginGet(req, res)
        else if (req.method === 'POST') await handleLoginPost(req, res)
        else { res.writeHead(405); res.end() }
      }})
      const d2 = webServer.register({ kind: 'exact', path: '/logout', handler: handleLogout as unknown as (req: IncomingMessage, res: ServerResponse) => void | Promise<void> })
      return () => { d1(); d2() }
    }, 'auth-simple: routes')
  }
}

export default AuthSimple
