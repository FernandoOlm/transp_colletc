// =====================================================
// INÍCIO — COLETOR DE EMENDAS (SIGA BRASIL)
// =====================================================

import fs from "fs";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const BASE_PATH = "/home/folmdelima/transp_colletc/cache/emendas/";

function limparNome(nome) {
  return nome
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function coletarEmendas(anos) {
  console.clear();
  console.log("🟩 Iniciando coleta de EMENDAS via SIGA Brasil...\n");

  // Carregar lista de deputados
  const listaPath =
    "/home/folmdelima/transp_colletc/cache/deputados/lista.json";

  if (!fs.existsSync(listaPath)) {
    console.log("❌ Rode 'Atualizar Deputados' primeiro.");
    return;
  }

  const deputados = JSON.parse(fs.readFileSync(listaPath));

  // índice para lookup rápido por nome
  const mapaNomes = {};
  for (const d of deputados) {
    mapaNomes[limparNome(d.nomeCivil)] = d.id;
    mapaNomes[limparNome(d.nomeEleitoral)] = d.id;
  }

  for (const ano of anos) {
    console.log(`📘 Baixando XML de EMENDAS ${ano} do SIGA Brasil...`);

    const url = `https://legis.senado.leg.br/dadosabertos/emendas/ano/${ano}`;

    let xml = "";
    try {
      xml = await fetch(url).then((r) => r.text());
    } catch (e) {
      console.log(`❌ Erro baixando XML ${ano}:`, e.message);
      continue;
    }

    const $ = cheerio.load(xml, { xmlMode: true });

    const resultadoAno = {};

    $("Emenda").each((_, el) => {
      const em = $(el);

      const autor = limparNome(em.find("Autor").text().trim());
      if (!autor) return;

      const depId = mapaNomes[autor];
      if (!depId) return; // autor não é deputado federal atual

      if (!resultadoAno[depId]) resultadoAno[depId] = [];

      resultadoAno[depId].push({
        numero: em.find("Numero").text().trim(),
        autor: em.find("Autor").text().trim(),
        tipo: em.find("Tipo").text().trim(),
        uf: em.find("UF").text().trim(),
        partido: em.find("Partido").text().trim(),
        programa: em.find("Programa").text().trim(),
        funcao: em.find("Funcao").text().trim(),
        subfuncao: em.find("Subfuncao").text().trim(),
        localidade: em.find("Localidade").text().trim(),
        valorAutorizado: em.find("ValorAutorizado").text().trim(),
        valorEmpenhado: em.find("ValorEmpenhado").text().trim(),
        valorPago: em.find("ValorPago").text().trim(),
      });
    });

    // salvar
    if (!fs.existsSync(BASE_PATH))
      fs.mkdirSync(BASE_PATH, { recursive: true });

    fs.writeFileSync(
      `${BASE_PATH}${ano}.json`,
      JSON.stringify(resultadoAno, null, 2)
    );

    console.log(`✅ EMENDAS ${ano} salvas: ${BASE_PATH}${ano}.json\n`);
  }

  console.log("🟩 Coleta SIGA Brasil finalizada.\n");
}

// =====================================================
// FIM — COLETOR DE EMENDAS (SIGA BRASIL)
// =====================================================