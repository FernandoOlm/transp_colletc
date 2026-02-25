// =====================================================
// INÍCIO — COLETOR DE GABINETE OFICIAL (CÂMARA) — v2
// =====================================================

import fs from "fs";
import fetch from "node-fetch";

const DEP_PATH = "/home/folmdelima/transp_colletc/cache/deputados/";
const OUT_PATH = "/home/folmdelima/transp_colletc/cache/gabinete/";

const BASE_URL = "https://dadosabertos.camara.leg.br/api/v2";

// =====================================================
// INÍCIO — Funções Utilitárias
// =====================================================

function normalizarNome(nome) {
  return nome
    ?.toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =====================================================
// INÍCIO — Busca de assessores para um deputado
// =====================================================

async function buscarGabinete(deputadoId) {
  const url = `${BASE_URL}/deputados/${deputadoId}/funcionarios`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      console.log(`⚠ Erro API (gabinete) ${deputadoId}: HTTP ${res.status}`);
      return [];
    }

    const json = await res.json();

    if (!json?.dados || !Array.isArray(json.dados)) return [];

    return json.dados.map((f) => ({
      id: f.id || null,
      nomeGabinete: f.nome,
      nomeNormalizado: normalizarNome(f.nome),
      cargoGabinete: f.cargo || null,
      funcao: f.funcao || null,

      // Dados de lotação
      siglaOrgao: f.lotacao?.siglaOrgao || null,
      nomeOrgao: f.lotacao?.nomeOrgao || null,
      unidade: f.lotacao?.unidade || null,

      tipoVinculo: f.tipoVinculo || null,
    }));
  } catch (err) {
    console.log(`❌ Erro gabinete ${deputadoId}:`, err.message);
    return [];
  }
}

// =====================================================
// INÍCIO — COLETOR PRINCIPAL
// =====================================================

export async function coletarGabinete() {
  console.clear();
  console.log("🟦 Coletando GABINETES OFICIAIS (v2)...\n");

  if (!fs.existsSync(DEP_PATH)) {
    console.log("❌ Pasta deputados não encontrada.");
    return;
  }

  if (!fs.existsSync(OUT_PATH)) {
    fs.mkdirSync(OUT_PATH, { recursive: true });
  }

  const arquivos = fs.readdirSync(DEP_PATH);

  for (const arq of arquivos) {
    if (!arq.endsWith(".json")) continue;

    let deputado;
    try {
      deputado = JSON.parse(fs.readFileSync(DEP_PATH + arq));
    } catch (e) {
      console.log(`⚠ JSON inválido em ${arq}`);
      continue;
    }

    if (!deputado.id) continue;

    const depId = deputado.id;
    const depNome = deputado.nome;

    console.log(`🔎 Deputado: ${depNome} (${depId})`);

    const assessores = await buscarGabinete(depId);

    const resultado = {
      deputadoId: depId,
      deputadoNome: depNome,
      assessores,
    };

    fs.writeFileSync(
      OUT_PATH + depId + ".json",
      JSON.stringify(resultado, null, 2)
    );

    console.log(
      `   ✔ ${assessores.length} assessores salvos para ${depNome}\n`
    );

    await delay(200);
  }

  console.log("🟦 TODOS OS GABINETES COLETADOS (v2).");
}

// =====================================================
// FIM — COLETOR DE GABINETE
// =====================================================