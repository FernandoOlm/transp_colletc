// =====================================================
// INÍCIO — COLETOR DE SALÁRIOS (ROBUSTO + BIG DATA v2)
// =====================================================

import fs from "fs";
import fetch from "node-fetch";

const GAB_PATH = "/home/folmdelima/transp_colletc/cache/gabinete/";
const OUT_PATH = "/home/folmdelima/transp_colletc/cache/salarios/";
const BIG_PATH = OUT_PATH + "big_salarios.json";

const API_KEY = "f1e803bfc246b07e5bc099180d650815i";

// =====================================================
// INÍCIO — Utils
// =====================================================

function limparNome(nome) {
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

function salvarBigSeguro(caminho, db) {
  const conteudo =
    Object.keys(db).length === 0
      ? {
          status: "vazio",
          motivo: "Nenhum gabinete retornou salários",
          timestamp: new Date().toISOString(),
        }
      : db;

  fs.writeFileSync(caminho, JSON.stringify(conteudo, null, 2));
}

// FIM — Utils
// =====================================================


// =====================================================
// INÍCIO — API PORTAL TRANSPARÊNCIA
// =====================================================

async function buscarServidor(nome) {
  try {
    const url = `https://api.portaldatransparencia.gov.br/api-de-dados/servidores?nomeServidor=${encodeURIComponent(
      nome
    )}&pagina=1`;

    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "chave-api-dados": API_KEY,
      },
    });

    if (!res.ok) {
      console.log(`⚠ Erro servidor API (${res.status})`);
      return null;
    }

    const json = await res.json();
    if (!Array.isArray(json)) return null;

    return json.find((s) =>
      s.orgaoLotacao?.toUpperCase().includes("CAMARA")
    );

  } catch (err) {
    console.log("❌ Erro buscarServidor:", err.message);
    return null;
  }
}

async function buscarRemuneracao(cpf) {
  try {
    const url = `https://api.portaldatransparencia.gov.br/api-de-dados/servidores-remuneracao?cpf=${cpf}&pagina=1`;

    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "chave-api-dados": API_KEY,
      },
    });

    if (!res.ok) {
      console.log(`⚠ Erro remuneração API (${res.status})`);
      return null;
    }

    const json = await res.json();
    return Array.isArray(json) && json.length > 0 ? json[0] : null;

  } catch (err) {
    console.log("❌ Erro buscarRemuneracao:", err.message);
    return null;
  }
}

// FIM — API
// =====================================================


// =====================================================
// INÍCIO — COLETA PRINCIPAL
// =====================================================

export async function coletarSalarios() {
  console.clear();
  console.log("🟩 Coletando SALÁRIOS (modo robusto + big v2)...\n");

  if (!fs.existsSync(GAB_PATH)) {
    console.log("❌ Pasta gabinete não encontrada.");
    return;
  }

  if (!fs.existsSync(OUT_PATH)) {
    fs.mkdirSync(OUT_PATH, { recursive: true });
  }

  let bigDB = {};
  const arquivos = fs.readdirSync(GAB_PATH);

  for (const arq of arquivos) {
    if (!arq.endsWith(".json")) continue;

    let raw;

    try {
      raw = JSON.parse(fs.readFileSync(GAB_PATH + arq));
    } catch (err) {
      console.log(`⚠ JSON inválido em ${arq}`);
      continue;
    }

    if (!raw.assessores || !Array.isArray(raw.assessores)) {
      console.log(`⚠ Ignorando ${arq} (estrutura inválida)`);
      continue;
    }

    const depId = raw.deputadoId ?? arq.replace(".json", "");
    const depNome = raw.deputadoNome ?? "Desconhecido";

    console.log(`🔎 Deputado: ${depNome} (${depId})`);

    let totalBruto = 0;
    let totalLiquido = 0;
    let encontrados = 0;
    const assessoresProcessados = [];

    for (const ass of raw.assessores) {
      const nome = limparNome(ass.nomeGabinete);
      console.log(`   👤 ${nome}`);

      const servidor = await buscarServidor(nome);

      if (!servidor) {
        assessoresProcessados.push({
          ...ass,
          portalTransparencia: null,
        });
        continue;
      }

      const remun = await buscarRemuneracao(servidor.cpfServidor);

      const bruto = parseFloat(
        (remun?.remuneracaoBruta || "0").replace(/\./g, "").replace(",", ".")
      );

      const liquido = parseFloat(
        (remun?.remuneracaoLiquida || "0")
          .replace(/\./g, "")
          .replace(",", ".")
      );

      totalBruto += bruto;
      totalLiquido += liquido;
      encontrados++;

      assessoresProcessados.push({
        ...ass,
        portalTransparencia: {
          cpf: servidor.cpfServidor,
          cargo: servidor.cargo,
          orgao: servidor.orgaoLotacao,
          remuneracaoBruta: remun?.remuneracaoBruta ?? null,
          remuneracaoLiquida: remun?.remuneracaoLiquida ?? null,
        },
      });

      await delay(200); // proteção rate limit
    }

    const resultado = {
      deputadoId: depId,
      deputadoNome: depNome,
      totalBruto,
      totalLiquido,
      quantidadeComSalarioEncontrado: encontrados,
      assessores: assessoresProcessados,
    };

    fs.writeFileSync(
      OUT_PATH + depId + ".json",
      JSON.stringify(resultado, null, 2)
    );

    bigDB[depId] = {
      deputadoNome: depNome,
      totalBruto,
      totalLiquido,
      quantidadeComSalarioEncontrado: encontrados,
    };

    console.log(`   💰 Total Bruto: ${totalBruto}`);
    console.log(`   💵 Total Líquido: ${totalLiquido}\n`);
  }

  salvarBigSeguro(BIG_PATH, bigDB);

  console.log("🟩 BIG SALARIOS atualizado.");
}

// =====================================================
// FIM — COLETOR
// =====================================================