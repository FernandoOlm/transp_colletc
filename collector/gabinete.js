// =====================================================
// INÍCIO — COLETOR DE GABINETE OFICIAL (CÂMARA)
// =====================================================

import fs from "fs";
import fetch from "node-fetch";

const DEP_PATH = "/home/folmdelima/transp_colletc/cache/deputados/";
const OUT_PATH = "/home/folmdelima/transp_colletc/cache/gabinete/";

const BASE_URL = "https://dadosabertos.camara.leg.br/api/v2";

// -----------------------------------------------------
// Busca assessores de um deputado
// -----------------------------------------------------
async function buscarGabinete(deputadoId) {
  const url = `${BASE_URL}/deputados/${deputadoId}/funcionarios`;

  try {
    const res = await fetch(url);
    const json = await res.json();

    if (!json?.dados) return [];

    return json.dados.map((f) => ({
      nomeGabinete: f.nome,
      cargoGabinete: f.cargo,
    }));
  } catch (err) {
    console.log(`❌ Erro gabinete ${deputadoId}:`, err.message);
    return [];
  }
}

// -----------------------------------------------------
// COLETOR PRINCIPAL
// -----------------------------------------------------
export async function coletarGabinete() {
  console.clear();
  console.log("🟦 Coletando GABINETES OFICIAIS...\n");

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

    const deputado = JSON.parse(fs.readFileSync(DEP_PATH + arq));

    if (!deputado.id || deputado.siglaPartido === null) continue;

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

    console.log(`   ✔ ${assessores.length} assessores salvos\n`);

    await new Promise((r) => setTimeout(r, 200));
  }

  console.log("🟦 TODOS OS GABINETES COLETADOS.");
}

// =====================================================
// FIM — COLETOR DE GABINETE
// =====================================================