export const MOCK_RUNS = [
  { id: 1, staging: "https://staging.acme.io/home", live: "https://acme.io/home", status: "diff", diffs: 4, time: "2 hrs ago" },
  { id: 2, staging: "https://staging.acme.io/pricing", live: "https://acme.io/pricing", status: "pass", diffs: 0, time: "5 hrs ago" },
  { id: 3, staging: "https://staging.acme.io/login", live: "https://acme.io/login", status: "diff", diffs: 2, time: "Yesterday" },
  { id: 4, staging: "https://staging.acme.io/dashboard", live: "https://acme.io/dashboard", status: "fail", diffs: 0, time: "2 days ago" },
];

export const MOCK_CHANGES = [
  { badge: "ct-visual", label: "VISUAL", desc: "Hero banner image replaced", detail: "img.hero-banner — size changed 1200×400 → 1200×480" },
  { badge: "ct-layout", label: "LAYOUT", desc: "Navigation bar height differs by 12px", detail: "nav#main — height: 64px → 76px" },
  { badge: "ct-content", label: "CONTENT", desc: "CTA button text updated", detail: "button.cta-primary — 'Get Started' → 'Try for Free'" },
  { badge: "ct-missing", label: "MISSING", desc: "Promotional banner absent in production", detail: "div.promo-banner — present in staging, missing in live" },
];

export function makeSvg(env, accentColor, hasBanner) {
  const navH = hasBanner ? 80 : 64;
  const bannerEl = hasBanner
    ? `<rect x="0" y="64" width="800" height="24" fill="%23fffbeb"/><rect x="240" y="73" width="320" height="8" rx="2" fill="%23fcd34d"/>`
    : "";
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="460" viewBox="0 0 800 460">
  <rect width="800" height="460" fill="#f5f7fa"/>
  <rect width="800" height="${navH}" fill="#fff" stroke="#dde3ec" stroke-width="1"/>
  <rect x="18" y="18" width="26" height="26" rx="5" fill="${accentColor}"/>
  <rect x="52" y="23" width="60" height="9" rx="2" fill="#ccc"/>
  <rect x="140" y="23" width="50" height="9" rx="2" fill="#e5e7eb"/>
  <rect x="200" y="23" width="50" height="9" rx="2" fill="#e5e7eb"/>
  <rect x="260" y="23" width="50" height="9" rx="2" fill="#e5e7eb"/>
  <rect x="660" y="17" width="120" height="30" rx="5" fill="${accentColor}"/>
  ${bannerEl}
  <rect x="120" y="${navH + 28}" width="560" height="34" rx="4" fill="#1a1a2e"/>
  <rect x="200" y="${navH + 76}" width="400" height="12" rx="3" fill="#d1d5db"/>
  <rect x="290" y="${navH + 104}" width="220" height="36" rx="6" fill="${accentColor}"/>
  <rect x="20" y="${navH + 170}" width="234" height="140" rx="8" fill="#fff" stroke="#dde3ec" stroke-width="1"/>
  <rect x="283" y="${navH + 170}" width="234" height="140" rx="8" fill="#fff" stroke="#dde3ec" stroke-width="1"/>
  <rect x="546" y="${navH + 170}" width="234" height="140" rx="8" fill="#fff" stroke="#dde3ec" stroke-width="1"/>
  <text x="400" y="450" text-anchor="middle" font-family="monospace" font-size="11" fill="#9ca3af">${env}</text>
</svg>`)}`;
}

export const IMG_STAGING = makeSvg("staging.acme.io", "#d97706", true);
export const IMG_LIVE    = makeSvg("acme.io",         "#c0392b", false);

/* ── Section-level SVG generators ── */
function makeSectionSvg(title, env, accent, content) {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="200" viewBox="0 0 800 200">
  <rect width="800" height="200" fill="#f5f7fa"/>
  <rect x="0" y="0" width="800" height="200" rx="0" fill="#fff" stroke="#dde3ec" stroke-width="1"/>
  ${content}
  <text x="400" y="190" text-anchor="middle" font-family="monospace" font-size="10" fill="#9ca3af">${env} — ${title}</text>
</svg>`)}`;
}

function makeNavbarSvg(env, accent, hasBanner) {
  const bannerEl = hasBanner
    ? `<rect x="0" y="56" width="800" height="22" fill="#fffbeb"/><rect x="240" y="63" width="320" height="8" rx="2" fill="#fcd34d"/>`
    : "";
  return makeSectionSvg("Navbar", env, accent, `
    <rect x="18" y="16" width="26" height="26" rx="5" fill="${accent}"/>
    <rect x="52" y="22" width="60" height="9" rx="2" fill="#ccc"/>
    <rect x="140" y="22" width="50" height="9" rx="2" fill="#e5e7eb"/>
    <rect x="200" y="22" width="50" height="9" rx="2" fill="#e5e7eb"/>
    <rect x="260" y="22" width="50" height="9" rx="2" fill="#e5e7eb"/>
    <rect x="660" y="14" width="120" height="30" rx="5" fill="${accent}"/>
    ${bannerEl}
  `);
}

function makeHeroSvg(env, accent, ctaText) {
  return makeSectionSvg("Hero", env, accent, `
    <rect x="120" y="24" width="560" height="30" rx="4" fill="#1a1a2e"/>
    <rect x="200" y="68" width="400" height="12" rx="3" fill="#d1d5db"/>
    <rect x="220" y="90" width="360" height="10" rx="3" fill="#e5e7eb"/>
    <rect x="290" y="116" width="220" height="36" rx="6" fill="${accent}"/>
    <text x="400" y="140" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#fff" font-weight="600">${ctaText}</text>
  `);
}

function makeFeaturesSvg(env, accent, cardCount) {
  const cards = Array.from({ length: cardCount }, (_, i) => {
    const x = 20 + i * 263;
    return `<rect x="${x}" y="42" width="234" height="120" rx="8" fill="#fff" stroke="#dde3ec" stroke-width="1"/>
    <rect x="${x + 16}" y="58" width="80" height="8" rx="2" fill="${accent}" opacity="0.6"/>
    <rect x="${x + 16}" y="78" width="200" height="6" rx="2" fill="#e5e7eb"/>
    <rect x="${x + 16}" y="94" width="160" height="6" rx="2" fill="#e5e7eb"/>
    <rect x="${x + 16}" y="110" width="180" height="6" rx="2" fill="#e5e7eb"/>
    <rect x="${x + 16}" y="132" width="70" height="20" rx="4" fill="${accent}" opacity="0.15"/>`;
  }).join("\n");
  return makeSectionSvg("Features", env, accent, `
    <rect x="280" y="14" width="240" height="14" rx="3" fill="#1a1a2e"/>
    ${cards}
  `);
}

function makeFooterSvg(env, accent) {
  return makeSectionSvg("Footer", env, accent, `
    <rect x="0" y="0" width="800" height="200" fill="#1e2330"/>
    <rect x="30" y="24" width="100" height="10" rx="2" fill="#fff" opacity="0.8"/>
    <rect x="30" y="46" width="200" height="6" rx="2" fill="#8892a4"/>
    <rect x="30" y="60" width="180" height="6" rx="2" fill="#8892a4"/>
    <rect x="350" y="24" width="60" height="8" rx="2" fill="#fff" opacity="0.6"/>
    <rect x="350" y="44" width="80" height="6" rx="2" fill="#8892a4"/>
    <rect x="350" y="58" width="70" height="6" rx="2" fill="#8892a4"/>
    <rect x="350" y="72" width="90" height="6" rx="2" fill="#8892a4"/>
    <rect x="550" y="24" width="60" height="8" rx="2" fill="#fff" opacity="0.6"/>
    <rect x="550" y="44" width="80" height="6" rx="2" fill="#8892a4"/>
    <rect x="550" y="58" width="70" height="6" rx="2" fill="#8892a4"/>
    <rect x="30" y="160" width="740" height="1" fill="#2a3040"/>
    <rect x="300" y="172" width="200" height="6" rx="2" fill="#4a5568"/>
  `);
}

export const MOCK_SECTIONS = [
  {
    id: "navbar",
    name: "Navbar",
    staging: makeNavbarSvg("staging.acme.io", "#d97706", true),
    live:    makeNavbarSvg("acme.io",         "#c0392b", false),
    hasDiff: true,
    diffNote: "Promotional banner present in staging, missing in production",
  },
  {
    id: "hero",
    name: "Hero Section",
    staging: makeHeroSvg("staging.acme.io", "#d97706", "Try for Free"),
    live:    makeHeroSvg("acme.io",         "#c0392b", "Get Started"),
    hasDiff: true,
    diffNote: "CTA button text changed: 'Get Started' → 'Try for Free'",
  },
  {
    id: "features",
    name: "Features Grid",
    staging: makeFeaturesSvg("staging.acme.io", "#d97706", 3),
    live:    makeFeaturesSvg("acme.io",         "#c0392b", 3),
    hasDiff: false,
    diffNote: null,
  },
  {
    id: "footer",
    name: "Footer",
    staging: makeFooterSvg("staging.acme.io", "#d97706"),
    live:    makeFooterSvg("acme.io",         "#c0392b"),
    hasDiff: false,
    diffNote: null,
  },
];
