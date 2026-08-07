// ─────────────────────────────────────────────────────────────
// Renderiza o README pelo renderizador oficial do GitHub e tira
// screenshots em desktop (claro e escuro) e mobile, auditando
// imagens quebradas e estouro horizontal.
//
//   npm install
//   npx playwright install chromium
//   node scripts/preview.mjs
//
// Saída em .preview/
// Requer a GitHub CLI (`gh`) autenticada — é ela que chama a API
// de markdown, garantindo que o preview use o mesmo renderizador
// do site em vez de uma aproximação local.
// ─────────────────────────────────────────────────────────────
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs'
import { dirname, extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, '.preview')
rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })

const md = readFileSync(join(root, 'README.md'), 'utf8')

// 'markdown' é o modo que o GitHub usa para ARQUIVOS. O modo 'gfm'
// é o de comentários e força quebra de linha rígida a cada \n, o
// que não corresponde ao README.
const payload = join(out, 'payload.json')
writeFileSync(payload, JSON.stringify({ text: md, mode: 'markdown' }), 'utf8')
const body = execFileSync('gh', ['api', '/markdown', '--method', 'POST', '--input', payload], {
  encoding: 'utf8',
  maxBuffer: 20 * 1024 * 1024,
})

const page = (theme, width) => `<!doctype html><html data-theme="${theme}"><head><meta charset="utf-8"><style>
  :root{--bg:#0d1117;--fg:#e6edf3;--muted:#8b949e;--border:#30363d;--code:#161b22;--link:#4493f7}
  html[data-theme=light]{--bg:#fff;--fg:#1f2328;--muted:#59636e;--border:#d1d9e0;--code:#f6f8fa;--link:#0969da}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--fg);
    font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Noto Sans,Helvetica,Arial,sans-serif}
  .wrap{max-width:${width}px;margin:0 auto;padding:24px}
  h1,h2,h3{line-height:1.25;margin:24px 0 16px;font-weight:600}
  h2{padding-bottom:.3em;border-bottom:1px solid var(--border);font-size:1.5em}
  h3{font-size:1.15em}
  p{margin:0 0 16px}
  img{max-width:100%;vertical-align:middle}
  a{color:var(--link);text-decoration:none}
  code{background:color-mix(in srgb,var(--muted) 22%,transparent);padding:.2em .4em;border-radius:6px;
    font:85%/1.45 ui-monospace,SFMono-Regular,Consolas,monospace}
  pre{background:var(--code);border:1px solid var(--border);padding:16px;border-radius:6px;overflow:auto}
  pre code{background:none;padding:0;font-size:85%;line-height:1.5}
  table{border-collapse:collapse;display:block;max-width:100%;overflow:auto;margin-bottom:16px}
  td,th{border:1px solid var(--border);padding:6px 13px;vertical-align:top}
  sub{font-size:.85em;color:var(--muted)}
</style></head><body><div class="wrap">${body}</div></body></html>`

const types = { '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' }
const server = createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0])
  const m = /^\/(dark|light|mobile)$/.exec(p)
  if (m) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    return res.end(page(m[1] === 'light' ? 'light' : 'dark', m[1] === 'mobile' ? 390 : 890))
  }
  const file = normalize(join(root, p))
  if (!file.startsWith(normalize(root)) || !existsSync(file)) return res.writeHead(404).end('404')
  res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' })
  res.end(readFileSync(file))
})
await new Promise((r) => server.listen(4599, r))

const browser = await chromium.launch()
let problemas = 0

for (const [nome, rota, largura] of [
  ['desktop-escuro', 'dark', 1012],
  ['desktop-claro', 'light', 1012],
  ['mobile-escuro', 'mobile', 390],
]) {
  const tab = await browser.newPage({ viewport: { width: largura, height: 1200 }, deviceScaleFactor: 2 })
  const rede = []
  tab.on('response', (r) => r.status() >= 400 && rede.push(`HTTP ${r.status()} ${r.url()}`))
  tab.on('requestfailed', (r) => rede.push(`falhou ${r.url()}`))

  await tab.goto(`http://127.0.0.1:4599/${rota}`, { waitUntil: 'networkidle' })
  await tab.waitForTimeout(4000) // deixa as animações assentarem

  const audit = await tab.evaluate(() => {
    const imgs = [...document.images]
    const doc = document.documentElement
    return {
      imagens: imgs.length,
      quebradas: imgs.filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.src),
      semAlt: imgs.filter((i) => !i.getAttribute('alt') && i.getAttribute('alt') !== '').length,
      estouro: doc.scrollWidth > doc.clientWidth ? `${doc.scrollWidth}px > ${doc.clientWidth}px` : null,
    }
  })
  await tab.screenshot({ path: join(out, `${nome}.png`), fullPage: true })

  const erros = [...audit.quebradas, ...rede, audit.estouro && `estouro horizontal: ${audit.estouro}`].filter(Boolean)
  problemas += erros.length
  console.log(
    `${nome.padEnd(16)} ${audit.imagens} imagens · ${audit.quebradas.length} quebradas · ` +
      `${audit.semAlt} sem alt · ${audit.estouro ? 'ESTOURO' : 'sem estouro'}`,
  )
  erros.forEach((e) => console.log(`  ✗ ${e}`))
  await tab.close()
}

await browser.close()
server.close()
console.log(problemas ? `\n${problemas} problema(s). Screenshots em .preview/` : '\nTudo certo. Screenshots em .preview/')
process.exit(problemas ? 1 : 0)
