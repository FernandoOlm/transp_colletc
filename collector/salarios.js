// =====================================================
// COLETOR DE SALÁRIOS — V5 (AUTO-BRUTO, DEFINITIVO)
// =====================================================
// Fluxo inteligente:
// 1. Se big_servidores.json NÃO existe → cria automaticamente
// 2. Carrega os servidores
// 3. Coleta remuneração CPF a CPF
// 4. Gera big_remuneracao.json
// 5. Gera salarios_final.json
// =====================================================

import fs from "fs";
import fetch from "node-fetch";
import { coletarServidoresBruto } from "./bruto_servidores.js";

const BRUTO_PATH = "/home/folmdelima/transp_colletc/cache/bruto/";
const BRUTO_FILE = BRUTO_PATH + "big_servidores.json";

const OUT_PATH = "/home/folmdelima/transp_colletc/cache/salarios/";
const OUT_BIG_REMUN = OUT_PATH + "big_remuneracao.json";
const OUT_FINAL = OUT_PATH + "salarios_final.json";

const API_KEY = "f1e803bfc246b07e5bc099180d650815i";

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// =====================================================
// BUSCA REMUNERAÇÃO
// =====================================================
async function buscarRemuneracao(cpf) {
  const url =
    `https://api.portaldatransparencia.gov.br/api-de-dados/servidores-remuneracao?cpf=${cpf}&pagina=1`;

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
// FUNÇÃO PRINCIPAL
// =====================================================
export async function coletarSalarios() {
  console.clear();
  console.log("💵 COLETANDO SALÁRIOS — V5 (AUTO-BRUTO)...\n");

  // -------------------------------------------------
  // 1. SE O BRUTO NÃO EXISTE → GERAR AUTOMATICAMENTE
  // -------------------------------------------------
  if (!fs.existsSync(BRUTO_FILE)) {
    console.log("⚠ big_servidores.json não encontrado!");
    console.log("🔄 Iniciando coleta BRUTA automaticamente...\n");

    await coletarServidoresBruto();

    // Se ainda não existir → erro real
    if (!fs.existsSync(BRUTO_FILE)) {
      console.log("❌ ERRO FATAL: bruto não foi criado.");
      return;
    }
  }

  // Criar pasta de saída
  if (!fs.existsSync(OUT_PATH)) {
    fs.mkdirSync(OUT_PATH, { recursive: true });
  }

  // -------------------------------------------------
  // 2. CARREGAR BRUTO
  // -------------------------------------------------
  const base = JSON.parse(fs.readFileSync(BRUTO_FILE));
  const cpfs = Object.keys(base);
  const total = cpfs.length;

  console.log(`📦 Servidores carregados: ${total}\n`);

  const bigRemun = {};

  // -------------------------------------------------
  // 3. COLETA CPF POR CPF
  // -------------------------------------------------
  let i = 0;

  for (const cpf of cpfs) {
    i++;

    const servidor = base[cpf];
    console.log(`📌 (${i}/${total}) — ${servidor.nome}`);

    const remun = await buscarRemuneracao(cpf);

    bigRemun[cpf] = {
      ...servidor,
      remuneracao: remun
        ? {
            bruto: remun.remuneracaoBruta || 0,
            liquido: remun.remuneracaoLiquida || 0,
          }
        : null,
    };

    await delay(300);
  }

  // -------------------------------------------------
  // 4. SALVAR BIG DE REMUNERAÇÃO
  // -------------------------------------------------
  fs.writeFileSync(OUT_BIG_REMUN, JSON.stringify(bigRemun, null, 2));

  console.log("\n💾 big_remuneracao.json salvo em:");
  console.log(OUT_BIG_REMUN);

  // -------------------------------------------------
  // 5. GERAR ARQUIVO FINAL AGRUPADO
  // -------------------------------------------------
  const final = Object.values(bigRemun).map((s) => ({
    nome: s.nome,
    cpf: s.cpf,
    orgao: s.orgao,
    bruto: s.remuneracao?.bruto || 0,
    liquido: s.remuneracao?.liquido || 0,
  }));

  fs.writeFileSync(OUT_FINAL, JSON.stringify(final, null, 2));

  console.log("\n💰 salarios_final.json GERADO!");
  console.log(OUT_FINAL);

  console.log("\n✅ COLETA DE SALÁRIOS FINALIZADA!");
}

// =====================================================
// FIM DO ARQUIVO DEFINITIVO
// =====================================================