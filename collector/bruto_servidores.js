// =====================================================
// COLETOR BRUTO DE SERVIDORES — CÂMARA DOS DEPUTADOS
// v3 definitivo — usado automaticamente pelo salarios.js
// =====================================================

import fs from "fs";
import fetch from "node-fetch";

const OUT_PATH = "/home/folmdelima/transp_colletc/cache/bruto/";
const BIG_FILE = OUT_PATH + "big_servidores.json";

const API_KEY = "f1e803bfc246b07e5bc099180d650815i";

// Delay básico
function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// Normalização de nome (bate com salarios.js)
function normalizarNome(nome) {
  return nome
    ?.toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// =====================================================
// FUNÇÃO PRINCIPAL — export coletarServidoresBruto()
// =====================================================
export async function coletarServidoresBruto() {
  console.clear();
  console.log("🟪 COLETANDO SERVIDORES DA CÂMARA (BRUTO V3)...\n");

  // cria pasta se não existir
  if (!fs.existsSync(OUT_PATH)) {
    fs.mkdirSync(OUT_PATH, { recursive: true });
  }

  let pagina = 1;
  let total = 0;
  const big = {};

  while (true) {
    const url = `https://api.portaldatransparencia.gov.br/api-de-dados/servidores?orgaoServidor=Câmara%20dos%20Deputados&pagina=${pagina}`;

    console.log(`📄 Página ${pagina}...`);

    // chamada API
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "chave-api-dados": API_KEY,
      },
    });

    if (!res.ok) {
      console.log(`⚠ Erro HTTP ${res.status}. Tentando novamente...`);
      await delay(1500);
      continue;
    }

    let json;
    try {
      json = await res.json();
    } catch (err) {
      console.log("❌ Erro ao processar JSON. Indo para próxima página...");
      pagina++;
      continue;
    }

    // API terminou
    if (!Array.isArray(json) || json.length === 0) {
      console.log("🏁 Não há mais páginas. Finalizando...");
      break;
    }

    for (const s of json) {
      const cpf = s.cpfServidor;

      big[cpf] = {
        cpf,
        nome: s.nomeServidor,
        nomeNormalizado: normalizarNome(s.nomeServidor),
        cargo: s.cargo,
        orgao: s.orgaoServidor,
        unidade: s.unidade,
        tipoVinculo: s.tipoVinculo,
        situacao: s.situacao,
      };

      total++;
    }

    console.log(`   ✔ ${json.length} registros processados`);
    pagina++;

    await delay(250);
  }

  fs.writeFileSync(BIG_FILE, JSON.stringify(big, null, 2));

  console.log("\n🟪 COLETA BRUTA FINALIZADA!");
  console.log(`📦 Total de servidores coletados: ${total}`);
  console.log(`💾 Arquivo salvo em: ${BIG_FILE}`);
}

// =====================================================
// FIM DO ARQUIVO
// =====================================================