// =====================================================
// INÍCIO — COLETOR DE GABINETE (SCRAPER HTML)
// =====================================================

import fs from "fs";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const BASE_PATH = "/home/folmdelima/transp_colletc/cache/gabinete/";

export async function coletarGabinete() {
  console.clear();
  console.log("🟥 Iniciando coleta de GABINETES...\n");

  const listaPath =
    "/home/folmdelima/transp_colletc/cache/deputados/lista.json";

  if (!fs.existsSync(listaPath)) {
    console.log("❌ Precisa coletar deputados primeiro.");
    return;
  }

  const deputados = JSON.parse(fs.readFileSync(listaPath));

  let atual = 1;
  const total = deputados.length;

  for (const dep of deputados) {
    const pct = ((atual / total) * 100).toFixed(1);
    process.stdout.write(
      `📦 ${atual}/${total} (${pct}%) — ID: ${dep.id}\r`
    );

    const url = `https://www.camara.leg.br/deputados/${dep.id}/pessoal-gabinete`;

    let lista = [];

    try {
      const html = await fetch(url).then((r) => r.text());
      const $ = cheerio.load(html);

      $("table tbody tr").each((_, el) => {
        const tds = $(el).find("td");

        lista.push({
          nome: $(tds[0]).text().trim(),
          cargo: $(tds[1]).text().trim(),
          remuneracao: $(tds[2]).text().trim(),
          data: $(tds[3]).text().trim()
        });
      });
    } catch {}

    if (!fs.existsSync(BASE_PATH))
      fs.mkdirSync(BASE_PATH, { recursive: true });

    const savePath = `${BASE_PATH}${dep.id}.json`;

    fs.writeFileSync(savePath, JSON.stringify(lista, null, 2));

    atual++;
    await new Promise((r) => setTimeout(r, 80)); // scraper rápido, mas com delay pra não travar
  }

  console.log("\n\n🟥 Coleta de GABINETES finalizada!\n");
}

// =====================================================
// FIM — COLETOR DE GABINETE
// =====================================================