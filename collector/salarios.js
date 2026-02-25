// =====================================================
// INÍCIO — COLETOR DE SALÁRIOS (Portal da Transparência)
// =====================================================

import fs from "fs";
import fetch from "node-fetch";

const BASE = "/home/folmdelima/transp_colletc/cache/salarios/";
const DEP_DB = "/home/folmdelima/transp_colletc/cache/gabinete/";
const API_KEY = "f1e803bfc246b07e5bc099180d650815i";

// Limpa nome para busca
function limparNome(nome) {
  return nome
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ------------------------------------------------------
// Busca servidores pelo nome
// ------------------------------------------------------
async function buscarServidor(nome) {
  const url = `https://api.portaldatransparencia.gov.br/api-de-dados/servidores?nomeServidor=${encodeURIComponent(
    nome
  )}&pagina=1`;

  try {
    const dados = await fetch(url, {
      headers: {
        Accept: "application/json",
        "chave-api-dados": API_KEY,
      },
    }).then((r) => r.json());

    if (!Array.isArray(dados)) return null;

    // Filtra apenas servidores da Câmara dos Deputados
    return dados.filter((s) =>
      s.orgaoLotacao?.toUpperCase().includes("CÂMARA DOS DEPUTADOS")
    );
  } catch (e) {
    console.log("❌ Erro ao buscar servidor:", e.message);
    return null;
  }
}

// ------------------------------------------------------
// Busca salários pelo CPF mascarado
// ------------------------------------------------------
async function buscarSalario(cpf) {
  const url = `https://api.portaldatransparencia.gov.br/api-de-dados/servidores-remuneracao?cpf=${cpf}&pagina=1`;

  try {
    const json = await fetch(url, {
      headers: {
        Accept: "application/json",
        "chave-api-dados": API_KEY,
      },
    }).then((r) => r.json());

    return Array.isArray(json) && json.length > 0 ? json[0] : null;
  } catch (e) {
    console.log("❌ Erro remuneração:", e.message);
    return null;
  }
}

// ------------------------------------------------------
// COLETOR PRINCIPAL
// ------------------------------------------------------
export async function coletarSalarios() {
  console.clear();
  console.log("🟩 Coletando SALÁRIOS de assessores...\n");

  const deputados = fs.readdirSync(DEP_DB);

  for (const arquivo of deputados) {
    if (!arquivo.endsWith(".json")) continue;

    const caminho = DEP_DB + arquivo;
    const gabinete = JSON.parse(fs.readFileSync(caminho));

    const depId = gabinete.deputadoId;
    const depNome = gabinete.deputadoNome;

    console.log(`🔎 Deputado: ${depNome} (${depId})`);

    const resultado = {
      deputadoId: depId,
      deputadoNome: depNome,
      assessores: [],
    };

    for (const ass of gabinete.assessores) {
      const nome = limparNome(ass.nomeGabinete);
      console.log(`   👤 ${nome}`);

      // 1 — BUSCA SERVIDOR
      const servidores = await buscarServidor(nome);

      if (!servidores || servidores.length === 0) {
        console.log("      ❌ Não encontrado no Portal");
        resultado.assessores.push({
          ...ass,
          portalTransparencia: null,
        });
        continue;
      }

      // Usa o primeiro servidor encontrado
      const serv = servidores[0];
      const cpf = serv.cpfServidor;

      // 2 — BUSCA SALÁRIO
      const salario = await buscarSalario(cpf);

      const info = {
        cpf: cpf,
        cargo: serv.cargo,
        orgao: serv.orgaoLotacao,
        remuneracaoBruta: salario?.remuneracaoBruta ?? null,
        remuneracaoLiquida: salario?.remuneracaoLiquida ?? null,
        totalGeral: salario?.totalGeral ?? null,
      };

      console.log(
        `      ✔ OK → bruto: ${info.remuneracaoBruta} | líquido: ${info.remuneracaoLiquida}`
      );

      resultado.assessores.push({
        ...ass,
        portalTransparencia: info,
      });

      await new Promise((r) => setTimeout(r, 150)); // evitar rate limit
    }

    // SALVA RESULTADO
    if (!fs.existsSync(BASE)) fs.mkdirSync(BASE, { recursive: true });

    const outPath = `${BASE}${depId}.json`;
    fs.writeFileSync(outPath, JSON.stringify(resultado, null, 2));

    console.log(`💾 Salvo → ${outPath}\n`);
  }

  console.log("🟩 FINALIZADO — todos os salários coletados.");
}

// =====================================================
// FIM — COLETOR DE SALÁRIOS
// =====================================================