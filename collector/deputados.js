// =====================================================
// INÍCIO — COLETOR: LISTA OFICIAL DE DEPUTADOS
// =====================================================

import fs from "fs";
import fetch from "node-fetch";

const PATH_SAIDA = "/home/folmdelima/transp_colletc/cache/deputados/lista.json";

export async function coletarDeputados() {
  console.clear();
  console.log("🔵 Iniciando coleta da lista oficial de deputados...\n");

  // INÍCIO — Buscar lista básica
  const url =
    "https://dadosabertos.camara.leg.br/api/v2/deputados?itens=600&ordem=ASC&ordenarPor=nome";

  let resposta;
  try {
    resposta = await fetch(url).then((r) => r.json());
  } catch (e) {
    console.log("❌ Erro ao buscar lista de deputados:", e.message);
    return;
  }

  if (!resposta?.dados?.length) {
    console.log("❌ Não foi possível obter a lista de deputados.");
    return;
  }

  const lista = resposta.dados;
  // FIM — Buscar lista básica

  console.log(`📋 Deputados encontrados: ${lista.length}`);
  console.log("🔍 Coletando detalhes individuais...\n");

  // INÍCIO — Normalizar e coletar detalhes
  const saida = [];
  let atual = 1;
  const total = lista.length;

  for (const dep of lista) {
    const pct = ((atual / total) * 100).toFixed(1);
    process.stdout.write(`📦 ${atual}/${total} (${pct}%) — ID: ${dep.id}\r`);

    // buscar detalhes
    const detalheURL = `https://dadosabertos.camara.leg.br/api/v2/deputados/${dep.id}`;

    let detalheJson;
    try {
      detalheJson = await fetch(detalheURL).then((r) => r.json());
    } catch {
      detalheJson = null;
    }

    const info = detalheJson?.dados || {};
    const status = info?.ultimoStatus || {};

    // montar objeto final
    saida.push({
      id: dep.id,
      nomeCivil: info.nomeCivil || null,
      nomeEleitoral: status.nomeEleitoral || dep.nome,
      partido: status.siglaPartido || null,
      uf: status.siglaUf || null,
      situacao: status.situacao || null,
      urlFoto: status.urlFoto || dep.urlFoto,
      email: status.email || null,
      redes: info.redeSocial || [],
      gabinete: {
        numero: status.gabinete?.numero || null,
        andar: status.gabinete?.andar || null,
        predio: status.gabinete?.predio || null,
        sala: status.gabinete?.sala || null,
        telefone: status.gabinete?.telefone || null,
      },
    });

    atual++;
    await new Promise((r) => setTimeout(r, 120)); // anti-rate-limit
  }
  // FIM — Normalizar e coletar detalhes

  // INÍCIO — Salvar arquivo
  try {
    fs.writeFileSync(PATH_SAIDA, JSON.stringify(saida, null, 2));
  } catch (e) {
    console.log("\n❌ Erro ao salvar arquivo:", e.message);
    return;
  }
  // FIM — Salvar arquivo

  console.log(`\n\n✅ Coleta concluída! Arquivo salvo em:`);
  console.log(PATH_SAIDA + "\n");
}

// =====================================================
// FIM — COLETOR: LISTA OFICIAL DE DEPUTADOS
// =====================================================