// =====================================================
// COLETOR DE SALÁRIOS — V4 (FUNCIONA COM index.js)
// Fluxo:
// 1. Lê big_servidores.json (coleta BRUTA)
// 2. Coleta remuneração de cada CPF
// 3. Salva big_remuneracao.json
// 4. Gera salarios_final.json
// =====================================================

import fs from "fs";
import fetch from "node-fetch";

const BRUTO = "/home/folmdelima/transp_colletc/cache/bruto/big_servidores.json";
const OUT_PATH = "/home/folmdelima/transp_colletc/cache/salarios/";
const OUT_BIG_REMUN = OUT_PATH + "big_remuneracao.json";
const OUT_FINAL = OUT_PATH + "salarios_final.json";

const API_KEY = "f1e803bfc246b07e5bc099180d650815i";

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function buscarRemuneracao(cpf) {
  const url = `https://api.portaldatransparencia.gov.br/api-de-dados/servidores-remuneracao?cpf=${cpf}&pagina=1`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "chave-api-dados": API_KEY,
      },
    });

    if (!res.ok) return null;

    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) return null;

    return json[0];
  } catch (err) {
    console.log("❌ Erro remuneração:", err.message);
    return null;
  }
}

// =====================================================
// FUNÇÃO PRINCIPAL — export coletarSalarios()
// =====================================================

export async function coletarSalarios() {
  console.clear();
  console.log("💵 COLETANDO SALÁRIOS V4 (USANDO BRUTO)...\n");

  if (!fs.existsSync(BRUTO)) {
    console.log("❌ big_servidores.json não encontrado.");
    return;
  }

  if (!fs.existsSync(OUT_PATH)) {
    fs.mkdirSync(OUT_PATH, { recursive: true });
  }

  const base = JSON.parse(fs.readFileSync(BRUTO));

  const cpfs = Object.keys(base);
  const bigRemun = {};

  let i = 0;

  for (const cpf of cpfs) {
    i++;

    const servidor = base[cpf];
    console.log(`📌 ${i}/${cpfs.length} — ${servidor.nome}`);

    const remun = await buscarRemuneracao(cpf);

    bigRemun[cpf] = {
      ...servidor,
      remuneracao: remun
        ? {
            bruto: remun.remuneracaoBruta || null,
            liquido: remun.remuneracaoLiquida || null,
          }
        : null,
    };

    await delay(250);
  }

  fs.writeFileSync(OUT_BIG_REMUN, JSON.stringify(bigRemun, null, 2));

  console.log("\n💵 REMUNERAÇÃO COMPLETA SALVA EM:");
  console.log(OUT_BIG_REMUN);

  // Agora gerar salario_final.json — só um agrupado geral
  const final = Object.values(bigRemun).map((s) => ({
    nome: s.nome,
    cpf: s.cpf,
    orgao: s.orgao,
    bruto: s.remuneracao?.bruto || 0,
    liquido: s.remuneracao?.liquido || 0,
  }));

  fs.writeFileSync(OUT_FINAL, JSON.stringify(final, null, 2));

  console.log("\n💰 ARQUIVO FINAL GERADO:");
  console.log(OUT_FINAL);

  console.log("\n💵 COLETA DE SALÁRIOS FINALIZADA!");
}

// =====================================================
// FIM — coletarSalarios()
// =====================================================