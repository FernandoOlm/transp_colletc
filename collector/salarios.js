// =====================================================
// INÍCIO — COLETOR DE SALÁRIOS (MODO FULL)
// =====================================================

import fs from "fs";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const BASE_PATH = "/home/folmdelima/transp_colletc/cache/";
const GAB_PATH = BASE_PATH + "gabinete/";
const SAL_PATH = BASE_PATH + "salarios/";

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function buscarServidorPorNome(nome) {
  const url = `https://www.portaltransparencia.gov.br/busca/servidores?termo=${encodeURIComponent(nome)}`;

  try {
    const html = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    }).then(r => r.text());

    const $ = cheerio.load(html);

    const linha = $("table tbody tr").first();
    if (!linha.length) return null;

    const colunas = linha.find("td");

    return {
      nome: $(colunas[0]).text().trim(),
      cargo: $(colunas[1]).text().trim(),
      orgao: $(colunas[2]).text().trim(),
      remuneracaoBruta: $(colunas[3]).text().trim(),
      remuneracaoLiquida: $(colunas[4]).text().trim()
    };

  } catch {
    return null;
  }
}

export async function coletarSalarios() {
  console.clear();
  console.log("🟨 Coletando TODOS os salários possíveis (Modo FULL)\n");

  const listaPath = BASE_PATH + "deputados/lista.json";
  if (!fs.existsSync(listaPath)) {
    console.log("❌ Rode 'Atualizar Deputados' primeiro.");
    return;
  }

  const deputados = JSON.parse(fs.readFileSync(listaPath));
  let atual = 1;

  for (const dep of deputados) {
    const pct = ((atual / deputados.length) * 100).toFixed(1);
    process.stdout.write(`📦 ${atual}/${deputados.length} (${pct}%) — Deputado ${dep.id}\r`);

    const gabinetePath = `${GAB_PATH}${dep.id}.json`;
    if (!fs.existsSync(gabinetePath)) {
      atual++;
      continue;
    }

    const equipe = JSON.parse(fs.readFileSync(gabinetePath));
    const resultado = [];

    for (const assessor of equipe) {
      const servidor = await buscarServidorPorNome(assessor.nome);

      resultado.push({
        nomeGabinete: assessor.nome,
        cargoGabinete: assessor.cargo,
        portalTransparencia: servidor
      });

      await delay(200);
    }

    if (!fs.existsSync(SAL_PATH)) {
      fs.mkdirSync(SAL_PATH, { recursive: true });
    }

    fs.writeFileSync(
      `${SAL_PATH}${dep.id}.json`,
      JSON.stringify({
        deputadoId: dep.id,
        deputadoNome: dep.nomeCivil,
        assessores: resultado
      }, null, 2)
    );

    atual++;
    await delay(300);
  }

  console.log("\n\n🟨 Salários coletados com sucesso!\n");
}

// =====================================================
// FIM — COLETOR DE SALÁRIOS
// =====================================================