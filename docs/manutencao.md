# Manutenção do perfil

Este repositório é especial: por chamar-se `joaowehner` (igual ao usuário),
o GitHub renderiza o `README.md` dele no topo de <https://github.com/joaowehner>.

## Estrutura

```text
README.md                        # o perfil em si
assets/banner.svg                # banner animado (gerado)
assets/divider.svg               # separador (gerado)
assets/fonts/                    # Space Grotesk embutida no banner
scripts/build-assets.mjs         # gera os SVGs de assets/
scripts/preview.mjs              # renderiza e audita o README
.github/workflows/               # checagem semanal de links
```

## Comandos

```bash
npm install
npx playwright install chromium

npm run assets    # regera assets/banner.svg e assets/divider.svg
npm run preview   # screenshots + auditoria em .preview/
npm run check     # os dois em sequência
```

O `preview` usa a API de markdown do GitHub (via `gh`), então o resultado é o
mesmo renderizador do site — não uma aproximação. Ele falha com código 1 se
encontrar imagem quebrada ou estouro horizontal.

## Não religue o "perfil privado"

Em **Settings → Public profile → Contributions & activity**, a opção
`Make profile private and hide activity` precisa ficar **desmarcada**.

Enquanto esteve marcada (até 07/08/2026), `github.com/joaowehner` renderizava
apenas o card `@joaowehner's activity is private`: sem README, sem
repositórios populares e com o gráfico de contribuições zerado. A
documentação do GitHub afirma que o README continua visível em perfis
privados, mas o comportamento observado deslogado era o oposto — o overview
inteiro era substituído pelo card.

Ao desmarcar, o perfil passou de 0 para 34 contribuições no último ano, com os
repositórios privados contabilizados (a opção
`Include private contributions on my profile` já estava ligada).

## Decisões que valem lembrar

**A tipografia do banner vai embutida.** Um SVG carregado dentro de `<img>` —
que é como o GitHub embute imagens — não pode buscar nada na rede. Por isso o
`build-assets.mjs` converte a Space Grotesk (a mesma fonte do site) em base64
e injeta como `@font-face` no próprio SVG. Se a fonte falhar, o fallback
sans-serif mantém o layout de pé.

**As cores saem dos design tokens do site.** O objeto `t` em
`scripts/build-assets.mjs` espelha `src/styles/tokens.css` do repositório
`joaowehner.github.io`. Mudou a paleta lá, atualize aqui e rode `npm run assets`.

**Os cards de estatística estão comentados no fim do README, de propósito.**
Enquanto o contador de contribuições do GitHub estiver em zero, eles exibiriam
zeros. O próprio comentário explica o que ligar para que passem a fazer sentido.

**Nada de linha com mais de ~72 caracteres nos blocos de código.** Acima disso
o bloco ganha barra de rolagem horizontal e corta a leitura no celular.

## Antes de publicar uma mudança

```bash
npm run check
```

Confira os três screenshots em `.preview/` — desktop claro, desktop escuro e
mobile. O perfil precisa funcionar nos dois temas do GitHub.
