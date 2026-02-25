// =====================================================
// INÍCIO — COLETOR DE EMENDAS (BRUTO TOTAL)
// Portal da Transparência
// =====================================================

import fs from "fs";
import fetch from "node-fetch";

const BASE_PATH = "/home/folmdelima/transp_colletc/cache/emendas/";
const BIG_DB_PATH = BASE_PATH + "big.json";
const API_KEY = "f1e803bfc246b07e5bc099180d650815";

async function buscarPagina(ano, pagina) {
  const url = `https://api.portaldatransparencia.gov.br/api-de-dados/emendas?ano=${ano}&pagina=${pagina}`;

  try {
    const json = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "chave-api-dados": API_KEY
      }
    }).then(r => r.json());

    return Array.isArray(json) ? json : [];
  } catch (e) {
    console.log("❌ Erro:", e.message);
    return [];
  }
}

export async function coletarEmendas(anos) {
  console.clear();
  console.log("🟩 Coletando TODAS as EMENDAS (modo bruto total)...\n");

  let bigDB = {};
  if (fs.existsSync(BIG_DB_PATH)) {
    bigDB = JSON.parse(fs.readFileSync(BIG_DB_PATH));
  }

  for (const ano of anos) {
    console.log(`📘 Ano ${ano}`);

    let pagina = 1;
    let acumulado = [];

    while (true) {
      const dados = await buscarPagina(ano, pagina);

      if (dados.length === 0) break;

      acumulado = acumulado.concat(dados);

      console.log(`   Página ${pagina} → ${dados.length} registros`);
      pagina++;

      await new Promise(r => setTimeout(r, 150));
    }

    bigDB[ano] = acumulado;
    console.log(`✅ Ano ${ano} finalizado → ${acumulado.length} registros\n`);
  }

  if (!fs.existsSync(BASE_PATH))
    fs.mkdirSync(BASE_PATH, { recursive: true });

  fs.writeFileSync(BIG_DB_PATH, JSON.stringify(bigDB, null, 2));

  console.log("🟩 FINALIZADO — BigDatabase atualizado.");
}

// =====================================================
// FIM — COLETOR DE EMENDAS
// =====================================================