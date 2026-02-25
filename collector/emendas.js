// =====================================================
// INÍCIO — COLETOR DE EMENDAS (SIGA — POST OFICIAL)
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

async function buscarEmendasAno(ano) {
  const xmlBody = `
    <Emendas>
      <Ano>${ano}</Ano>
    </Emendas>
  `;

  const url = "https://legis.senado.leg.br/dadosabertos/dados/ConsultarEmendas";

  try {
    const xml = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/xml",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64)",
      },
      body: xmlBody,
    }).then((r) => r.text());

    return xml;
  } catch (e) {
    console.log("❌ Erro ao consultar SIGA:", e.message);
    return null;
  }
}

export async function coletarEmendas(anos) {
  console.clear();
  console.log("🟩 Iniciando coleta de EMENDAS via SIGA (POST)...\n");

  // Carregar deputados
  const listaPath =
    "/home/folmdelima/transp_colletc/cache/deputados/lista.json";

  if (!fs.existsSync(listaPath)) {
    console.log("❌ Rode 'Atualizar Deputados' primeiro.");
    return;
  }

  const deputados = JSON.parse(fs.readFileSync(listaPath));

  const nomes = {};
  for (const d of deputados) {
    nomes[limparNome(d.nomeCivil)] = d.id;
    nomes[limparNome(d.nomeEleitoral)] = d.id;
  }

  for (const ano of anos) {
    console.log(`📘 Coletando EMENDAS ${ano}...`);

    const xml = await buscarEmendasAno(ano);
    if (!xml) {
      console.log(`❌ Falha ao buscar ano ${ano}`);
      continue;
    }

    const $ = cheerio.load(xml, { xmlMode: true });
    const resultadoAno = {};

    $("Emenda").each((_, el) => {
      const em = $(el);

      const autor = limparNome(em.find("Autor").text().trim());
      if (!autor) return;

      const depId = nomes[autor];
      if (!depId) return;

      if (!resultadoAno[depId]) resultadoAno[depId] = [];

      resultadoAno[depId].push({
        numero: em.find("Numero").text().trim(),
        tipo: em.find("Tipo").text().trim(),
        autor: em.find("Autor").text().trim(),
        funcao: em.find("Funcao").text().trim(),
        subfuncao: em.find("Subfuncao").text().trim(),
        programa: em.find("Programa").text().trim(),
        localidade: em.find("Localidade").text().trim(),
        valorAutorizado: em.find("ValorAutorizado").text().trim(),
        valorEmpenhado: em.find("ValorEmpenhado").text().trim(),
        valorPago: em.find("ValorPago").text().trim(),
      });
    });

    // salvar
    if (!fs.existsSync(BASE_PATH)) fs.mkdirSync(BASE_PATH, { recursive: true });

    fs.writeFileSync(
      `${BASE_PATH}${ano}.json`,
      JSON.stringify(resultadoAno, null, 2)
    );

    console.log(`✅ EMENDAS ${ano} salvas.\n`);
  }

  console.log("🟩 Coleta finalizada.\n");
}

// =====================================================
// FIM — COLETOR DE EMENDAS (SIGA — POST)
// =====================================================