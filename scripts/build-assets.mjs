// ─────────────────────────────────────────────────────────────
// Gera os SVGs de assets/ a partir dos design tokens do site
// (joaowehner.github.io → src/styles/tokens.css).
//
//   node scripts/build-assets.mjs
//
// O banner embute uma subfonte WOFF2 da Space Grotesk como data:
// URI, o que permite usar a tipografia real da marca mesmo quando
// o SVG é carregado dentro de <img> (modo em que o navegador
// bloqueia qualquer requisição externa). Se por algum motivo a
// fonte não for aplicada, o fallback sans-serif mantém o layout.
// ─────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const asset = (...p) => resolve(root, 'assets', ...p)

// Design tokens (espelho de src/styles/tokens.css)
const t = {
  bg: '#0a0d12',
  surface: '#0f141c',
  raised: '#0c1017',
  line: '#1c2634',
  lineStrong: '#2a3a50',
  text1: '#dce5ef',
  text2: '#93a4b8',
  text3: '#6e7f95',
  accent: '#3ecf8e',
  accentStrong: '#5ce0a6',
  cyan: '#6cb8d6',
  amber: '#d8b06a',
  dotRed: '#ff5f56',
  dotYellow: '#ffbd2e',
  dotGreen: '#27c93f',
}

const MONO = "ui-monospace,'SFMono-Regular','JetBrains Mono',Menlo,Consolas,'DejaVu Sans Mono',monospace"
const SANS = "'Space Grotesk','Segoe UI',system-ui,-apple-system,'Helvetica Neue',Arial,sans-serif"

const fontB64 = readFileSync(asset('fonts', 'space-grotesk-latin-var.woff2')).toString('base64')

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// ── Banner ────────────────────────────────────────────────────
// Composição em duas colunas: identidade à esquerda, log do
// pipeline real de CI/CD à direita (deploy.yml do site).
const W = 1200
const H = 340

const pipeline = [
  ['npm ci', 'ok'],
  ['eslint', 'ok'],
  ['tsc --build', 'ok'],
  ['vitest', 'ok'],
  ['vite build', 'ok'],
  ['deploy → pages', 'ok'],
]

const chips = ['React', 'TypeScript', 'Node.js', 'Supabase']

const logLines = pipeline
  .map(([step, res], i) => {
    const y = 148 + i * 26
    const dots = '.'.repeat(Math.max(2, 20 - step.length))
    const delay = (1.15 + i * 0.13).toFixed(2)
    return `      <g class="log" style="animation-delay:${delay}s">
        <text x="820" y="${y}" class="mono log-step">▸ ${esc(step)} <tspan fill="${t.line}">${dots}</tspan> <tspan fill="${t.accent}">${res}</tspan></text>
      </g>`
  })
  .join('\n')

// Largura de cada chip derivada do texto (mono ~7.85px por caractere
// em 13px) para que os espaçamentos fiquem uniformes.
let chipX = 64
const chipsSvg = chips
  .map((c, i) => {
    const w = Math.round(c.length * 7.85 + 26)
    const g = `      <g class="chip" style="animation-delay:${(1.5 + i * 0.09).toFixed(2)}s">
        <rect x="${chipX}" y="272" width="${w}" height="28" rx="6" fill="${t.surface}" stroke="${t.line}"/>
        <text x="${chipX + w / 2}" y="291" class="mono chip-t" text-anchor="middle">${esc(c)}</text>
      </g>`
    chipX += w + 12
    return g
  })
  .join('\n')

const banner = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" role="img" aria-label="João Guilherme Wehner — Desenvolvedor Full-Stack e Co-CEO na TSW Soluções Inteligentes">
  <title>João Guilherme Wehner — Desenvolvedor Full-Stack e Co-CEO na TSW Soluções Inteligentes</title>
  <defs>
    <style type="text/css"><![CDATA[
      @font-face{
        font-family:'Space Grotesk';
        font-style:normal;
        font-weight:300 700;
        font-display:block;
        src:url(data:font/woff2;base64,${fontB64}) format('woff2');
      }
      .mono{font-family:${MONO};}
      .sans{font-family:${SANS};}

      .name{font-size:52px;font-weight:700;fill:${t.text1};letter-spacing:-1.4px;}
      .role{font-size:20px;font-weight:500;fill:${t.accent};letter-spacing:.2px;}
      .org{font-size:15px;fill:${t.text3};letter-spacing:.3px;}
      .prompt{font-size:17px;fill:${t.text3};letter-spacing:.5px;}
      .cmd{font-size:17px;fill:${t.accent};letter-spacing:.5px;}
      .bar-t{font-size:13px;fill:#5d6c80;letter-spacing:.6px;}
      .log-step{font-size:14px;fill:${t.text2};letter-spacing:.2px;}
      .chip-t{font-size:13px;fill:${t.text2};letter-spacing:.3px;}
      .live{font-size:13px;fill:${t.amber};letter-spacing:.4px;}

      @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      @keyframes typing{from{width:0}to{width:118px}}
      @keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}
      @keyframes pulse{0%,100%{opacity:.35;r:5}50%{opacity:.9;r:7}}
      @keyframes drift{0%,100%{opacity:.55}50%{opacity:.9}}

      .intro{opacity:0;animation:fadeUp .7s cubic-bezier(.4,0,.2,1) forwards;}
      .n1{animation-delay:.30s}
      .n2{animation-delay:.44s}
      .n3{animation-delay:.56s}
      .log{opacity:0;animation:fadeUp .5s cubic-bezier(.4,0,.2,1) forwards;}
      .chip{opacity:0;animation:fadeUp .5s cubic-bezier(.4,0,.2,1) forwards;}
      .reveal{animation:typing .55s steps(7,end) .12s both;}
      .caret{animation:blink 1.05s step-end infinite;}
      .beacon{animation:pulse 2.6s ease-in-out infinite;transform-origin:center;}
      .glow{animation:drift 7s ease-in-out infinite;}

      @media (prefers-reduced-motion: reduce){
        .intro,.log,.chip{opacity:1;animation:none;}
        .reveal{animation:none;width:118px;}
        .caret,.beacon,.glow{animation:none;}
      }
    ]]></style>

    <clipPath id="round"><rect width="${W}" height="${H}" rx="16"/></clipPath>
    <clipPath id="type"><rect class="reveal" x="104" y="80" width="118" height="26"/></clipPath>

    <radialGradient id="glowA" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(1035 26) rotate(132) scale(430 350)">
      <stop stop-color="${t.accent}" stop-opacity=".20"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowB" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(96 -18) rotate(64) scale(400 330)">
      <stop stop-color="${t.cyan}" stop-opacity=".14"/><stop offset="1" stop-color="${t.cyan}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="rule" x1="0" y1="0" x2="1" y2="0">
      <stop stop-color="${t.line}" stop-opacity="0"/><stop offset=".5" stop-color="${t.lineStrong}"/><stop offset="1" stop-color="${t.line}" stop-opacity="0"/>
    </linearGradient>
    <pattern id="grid" width="34" height="34" patternUnits="userSpaceOnUse">
      <path d="M34 0H0V34" stroke="${t.line}" stroke-width="1" fill="none" opacity=".5"/>
    </pattern>
  </defs>

  <g clip-path="url(#round)">
    <rect width="${W}" height="${H}" fill="${t.bg}"/>
    <rect width="${W}" height="${H}" fill="url(#grid)" opacity=".55"/>
    <rect class="glow" width="${W}" height="${H}" fill="url(#glowA)"/>
    <rect class="glow" width="${W}" height="${H}" fill="url(#glowB)" style="animation-delay:-3.5s"/>

    <!-- chrome do terminal -->
    <rect y="0" width="${W}" height="46" fill="${t.raised}" fill-opacity=".72"/>
    <line x1="0" y1="46" x2="${W}" y2="46" stroke="${t.line}"/>
    <circle cx="30" cy="23" r="6" fill="${t.dotRed}"/>
    <circle cx="52" cy="23" r="6" fill="${t.dotYellow}"/>
    <circle cx="74" cy="23" r="6" fill="${t.dotGreen}"/>
    <text x="100" y="28" class="mono bar-t">joaowehner@github — ~/perfil</text>
    <text x="${W - 32}" y="28" class="mono bar-t" text-anchor="end">main</text>

    <!-- coluna esquerda: identidade -->
    <g class="intro">
      <text x="64" y="99" class="mono prompt">~ $</text>
      <g clip-path="url(#type)">
        <text x="104" y="99" class="mono cmd">whoami</text>
      </g>
      <rect class="caret" x="200" y="84" width="9" height="18" fill="${t.accent}" opacity=".85"/>
    </g>

    <text x="64" y="176" class="sans name intro n1">João Guilherme Wehner</text>
    <text x="64" y="212" class="mono role intro n2">Desenvolvedor Full-Stack · Co-CEO</text>
    <text x="64" y="240" class="mono org intro n3">TSW Soluções Inteligentes — Campo Grande, MS · Brasil</text>

${chipsSvg}

    <!-- divisor entre colunas -->
    <line x1="786" y1="86" x2="786" y2="300" stroke="${t.line}"/>

    <!-- coluna direita: pipeline real de CI/CD -->
    <text x="820" y="112" class="mono bar-t" fill="${t.text3}">$ git push origin main</text>
    <line x1="820" y1="126" x2="1136" y2="126" stroke="url(#rule)"/>
${logLines}

    <g class="log" style="animation-delay:2.05s">
      <circle class="beacon" cx="826" cy="${148 + pipeline.length * 26 + 4}" r="5" fill="${t.amber}"/>
      <text x="840" y="${148 + pipeline.length * 26 + 9}" class="mono live">joaowehner.github.io · live</text>
    </g>

    <rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="16" stroke="${t.line}" fill="none"/>
  </g>
</svg>
`

// ── Separador ─────────────────────────────────────────────────
// Fica entre o cabeçalho e o conteúdo. Precisa ser visível em fundo
// claro e escuro, então usa o verde da marca (legível nos dois) em vez
// dos cinzas de superfície.
const divider = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="16" viewBox="0 0 1200 16" fill="none" role="presentation">
  <defs>
    <linearGradient id="d" x1="0" y1="0" x2="1" y2="0">
      <stop stop-color="${t.accent}" stop-opacity="0"/>
      <stop offset=".18" stop-color="${t.accent}" stop-opacity=".38"/>
      <stop offset=".5" stop-color="${t.accentStrong}" stop-opacity=".9"/>
      <stop offset=".82" stop-color="${t.accent}" stop-opacity=".38"/>
      <stop offset="1" stop-color="${t.accent}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="halo" x1="0" y1="0" x2="1" y2="0">
      <stop stop-color="${t.accent}" stop-opacity="0"/>
      <stop offset=".5" stop-color="${t.accent}" stop-opacity=".22"/>
      <stop offset="1" stop-color="${t.accent}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect x="0" y="6" width="1200" height="4" fill="url(#halo)"/>
  <line x1="0" y1="8" x2="1200" y2="8" stroke="url(#d)" stroke-width="2"/>
  <path d="M600 2.6 605.4 8 600 13.4 594.6 8Z" fill="${t.accentStrong}"/>
</svg>
`

mkdirSync(asset(), { recursive: true })
writeFileSync(asset('banner.svg'), banner, 'utf8')
writeFileSync(asset('divider.svg'), divider, 'utf8')

const kb = (s) => (Buffer.byteLength(s, 'utf8') / 1024).toFixed(1)
console.log(`assets/banner.svg   ${kb(banner)} KB`)
console.log(`assets/divider.svg  ${kb(divider)} KB`)
