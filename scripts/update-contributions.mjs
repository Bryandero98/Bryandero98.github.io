// Genera data/contributions.json y assets/activity.svg a partir de los PRs
// mergeados reales de Bryandero98 (GitHub Search API). Pensado para correr
// tanto localmente (para sembrar los archivos iniciales) como dentro del
// GitHub Action programado (.github/workflows/update-contributions.yml),
// que lo ejecuta y commitea los resultados automáticamente.
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const USERNAME = "Bryandero98";
const ROOT = path.resolve(import.meta.dirname, "..");

// Agrupa varios repos de un mismo "ecosistema" bajo una sola etiqueta, igual
// a como ya se muestran las tarjetas de contribuciones en el sitio.
const GROUPS = [
  { key: "portos", label: "PortOS", match: (repo) => repo === "atomantic/PortOS" },
  { key: "hedgehog", label: "hedgehog + ecosistema", match: (repo) => repo.startsWith("skyf0xx/hedgehog") },
  { key: "athlead", label: "AthLead", match: (repo) => repo === "Harsh-vardhan09/AthLead" },
  { key: "huihui", label: "huihui.dev-beta", match: (repo) => repo === "chiffon-0504/huihui.dev-beta" },
  { key: "gridcraft", label: "gridcraft", match: (repo) => repo === "Rohan-Shridhar/gridcraft" },
  { key: "classhub", label: "ClassHub", match: (repo) => repo === "Hanu2908/ClassHub" },
  { key: "maka", label: "maka", match: (repo) => repo === "apache/maka" },
  { key: "nodered", label: "node-red + ecosistema", match: (repo) => repo.startsWith("node-red/") },
  { key: "drawora", label: "drawora", match: (repo) => repo === "pradipNP/drawora" },
];

async function fetchAllMergedPRs(token) {
  const items = [];
  let page = 1;
  for (;;) {
    const res = await fetch(
      `https://api.github.com/search/issues?q=${encodeURIComponent(
        `is:pr is:merged author:${USERNAME}`
      )}&per_page=100&page=${page}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: token ? `Bearer ${token}` : undefined,
          "User-Agent": USERNAME,
        },
      }
    );
    if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
    const data = await res.json();
    items.push(...data.items);
    if (data.items.length < 100) break;
    page += 1;
  }
  return items;
}

function repoFromUrl(repositoryUrl) {
  return repositoryUrl.split("/").slice(-2).join("/");
}

function buildContributions(items) {
  const byGroup = new Map();
  for (const group of GROUPS) {
    byGroup.set(group.key, { key: group.key, label: group.label, count: 0, latest: null });
  }

  for (const item of items) {
    const repo = repoFromUrl(item.repository_url);
    const group = GROUPS.find((g) => g.match(repo));
    if (!group) continue; // repo fuera de las categorías mostradas en el sitio

    const entry = byGroup.get(group.key);
    entry.count += 1;

    const mergedAt = item.pull_request && item.pull_request.merged_at;
    if (mergedAt && (!entry.latest || mergedAt > entry.latest.mergedAt)) {
      entry.latest = {
        title: item.title,
        url: item.html_url,
        number: item.number,
        repo,
        mergedAt,
      };
    }
  }

  const repos = GROUPS.map((g) => byGroup.get(g.key)).filter((e) => e.count > 0);
  const total = repos.reduce((sum, e) => sum + e.count, 0);

  // Actividad mensual (últimos 12 meses) para el gráfico de barras.
  const monthly = new Map();
  for (const item of items) {
    const mergedAt = item.pull_request && item.pull_request.merged_at;
    if (!mergedAt) continue;
    const month = mergedAt.slice(0, 7); // "YYYY-MM"
    monthly.set(month, (monthly.get(month) || 0) + 1);
  }
  const now = new Date();
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push({ month: key, count: monthly.get(key) || 0 });
  }

  return {
    total,
    updatedAt: new Date().toISOString(),
    repos,
    monthly: months,
  };
}

// Se generan dos variantes con los mismos tokens de color que ya usa
// styles.css, porque es una imagen estática (no puede leer variables CSS
// del tema en tiempo real) - script.js elige cuál <img> mostrar según el
// tema activo, para que el texto/ejes tengan contraste correcto en ambos.
const SVG_THEMES = {
  dark: { accent: "#3fb950", axis: "#30363d", text: "#8b949e" },
  light: { accent: "#1a7f37", axis: "#d0d7de", text: "#57606a" },
};

function renderActivitySvg(monthly, theme) {
  const { accent, axis, text } = SVG_THEMES[theme];
  const width = 720;
  const height = 160;
  const padding = { top: 12, right: 12, bottom: 24, left: 12 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const max = Math.max(1, ...monthly.map((m) => m.count));
  const barGap = 8;
  const barW = (chartW - barGap * (monthly.length - 1)) / monthly.length;

  const bars = monthly
    .map((m, i) => {
      const barH = (m.count / max) * chartH;
      const x = padding.left + i * (barW + barGap);
      const y = padding.top + (chartH - barH);
      const label = m.month.slice(5); // "MM"
      return `
    <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(barH, 1).toFixed(1)}" rx="2" fill="${accent}" fill-opacity="${m.count > 0 ? 0.9 : 0.35}"><title>${m.month}: ${m.count} PR${m.count === 1 ? "" : "s"}</title></rect>
    <text x="${(x + barW / 2).toFixed(1)}" y="${height - 6}" font-size="9" fill="${text}" text-anchor="middle" font-family="monospace">${label}</text>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="PRs mergeados por mes, últimos 12 meses">
  <title>PRs mergeados por mes (últimos 12 meses)</title>
  <line x1="${padding.left}" y1="${padding.top + chartH}" x2="${width - padding.right}" y2="${padding.top + chartH}" stroke="${axis}" stroke-width="1" />${bars}
</svg>
`;
}

async function main() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const items = await fetchAllMergedPRs(token);
  const contributions = buildContributions(items);

  await mkdir(path.join(ROOT, "data"), { recursive: true });
  await mkdir(path.join(ROOT, "assets"), { recursive: true });
  await writeFile(
    path.join(ROOT, "data", "contributions.json"),
    JSON.stringify(contributions, null, 2) + "\n"
  );
  await writeFile(
    path.join(ROOT, "assets", "activity-dark.svg"),
    renderActivitySvg(contributions.monthly, "dark")
  );
  await writeFile(
    path.join(ROOT, "assets", "activity-light.svg"),
    renderActivitySvg(contributions.monthly, "light")
  );

  console.log(`total=${contributions.total} repos=${contributions.repos.length} meses=${contributions.monthly.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
