// =====================================================
// INÍCIO — COLETOR DE EMENDAS (PORTAL DA TRANSPARÊNCIA)
// MODELO C — MEGADATABASE
// =====================================================

import fs from "fs";
import fetch from "node-fetch";

const BASE_PATH = "/home/folmdelima/transp_colletc/cache/emendas/";
const BIG_DB_PATH = BASE_PATH + "big.json";

// SUA CHAVE
const API_KEY = "f1e803bfc246b07e5bc099180d650815";

// -----------------------------------------------------
// Função util para limpar nomes
// -----------------------------------------------------
function limparNome(nome) {
  return nome
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// -----------------------------------------------------
// Função: buscar uma página da API
// -----------------------------------------------------
async function buscarPagina(ano, pagina, nomeAutor) {
  const params = new URLSearchParams({
    ano: ano.toString(),
    pagina: pagina.toString(),
    nomeAutor: nomeAutor
  });

  const url = `https://api.portaldatransparencia.gov.br/api-de-dados/emendas?${params}`;

  try {
    const json = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "chave-api-dados": API_KEY
      }
    }).then(r => r.json());

    return Array.isArray(json) ? json : [];
  } catch (e) {
    console.log("❌ Erro na página:", e.message);
    return [];
  }
}

// -----------------------------------------------------
// INÍCIO — COLETAR EMENDAS (MODELO C)
// -----------------------------------------------------
export async function coletarEmendas(anos) {
  console.clear();
  console.log("🟩 Coletando EMENDAS (Portal da Transparência) — MODELO C...\n");

  // Carregar deputados
  const depPath = "/home/folmdelima/transp_colletc/cache/deputados/lista.json";
  const deputados = JSON.parse(fs.readFileSync(depPath));

  // Mapa para lookup rápido
  const nomes = {};
  for (const d of deputados) {
    nomes[limparNome(d.nomeCivil)] = d.id;
    nomes[limparNome(d.nomeEleitoral)] = d.id;
  }

  // Carregar bigDB atual
  let bigDB = {};
  if (fs.existsSync(BIG_DB_PATH)) {
    bigDB = JSON.parse(fs.readFileSync(BIG_DB_PATH));
  }

  // Loop dos anos solicitados
  for (const ano of anos) {
    console.log(`📘 Ano ${ano}`);
    if (!bigDB[ano]) bigDB[ano] = {};

    // Loop dos deputados
    for (const dep of deputados) {
      const nome = limparNome(dep.nomeCivil);
      const depId = dep.id;

      console.log(`🔎 Buscando: ${dep.nomeCivil}`);

      let pagina = 1;
      let acumulado = [];

      while (true) {
        const dados = await buscarPagina(ano, pagina, nome);
        if (dados.length === 0) break;

        acumulado = acumulado.concat(dados);
        pagina++;

        // Evitar rate limit
        await new Promise(r => setTimeout(r, 150));
      }

      if (acumulado.length > 0) {
        bigDB[ano][depId] = acumulado;
        console.log(`   ✔ ${acumulado.length} emendas encontradas`);
      } else {
        console.log("   ❌ Nenhuma emenda");
      }
    }

    console.log(`✅ Ano ${ano} finalizado.\n`);
  }

  // Salvar BigDatabase
  if (!fs.existsSync(BASE_PATH)) fs.mkdirSync(BASE_PATH, { recursive: true });

  fs.writeFileSync(BIG_DB_PATH, JSON.stringify(bigDB, null, 2));

  console.log("🟩 FINALIZADO — BigDatabase salvo em:\n" + BIG_DB_PATH);
}

// =====================================================
// FIM — COLETOR EMENDAS (MODELO C)
// =====================================================