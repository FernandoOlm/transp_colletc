// =====================================================
// INÍCIO — COLETOR CEAP (GASTOS PARLAMENTARES)
// =====================================================

import fs from "fs";
import fetch from "node-fetch";

// Caminho onde vamos salvar os anos do CEAP
const BASE_PATH = "/home/folmdelima/transp_colletc/cache/ceap/";

export async function coletarCEAP(anos) {
  console.clear();
  console.log("🟧 Iniciando coleta CEAP...");
  console.log("📅 Anos selecionados:", anos.join(", "), "\n");

  // Carregar lista de deputados primeiro
  const listaPath =
    "/home/folmdelima/transp_colletc/cache/deputados/lista.json";

  if (!fs.existsSync(listaPath)) {
    console.log("❌ Lista de deputados não encontrada.");
    console.log("Execute: Atualizar Deputados primeiro.");
    return;
  }

  const deputados = JSON.parse(fs.readFileSync(listaPath));

  for (const ano of anos) {
    console.log(`\n📘 Coletando CEAP do ano ${ano}...\n`);

    const resultadoAno = {};
    let atual = 1;
    const total = deputados.length;

    for (const dep of deputados) {
      const pct = ((atual / total) * 100).toFixed(1);
      process.stdout.write(
        `📦 ${atual}/${total} (${pct}%) — ID: ${dep.id}\r`
      );

      const url = `https://dadosabertos.camara.leg.br/api/v2/deputados/${dep.id}/despesas?ano=${ano}&itens=1000`;

      let dados = [];
      try {
        const req = await fetch(url).then((r) => r.json());
        dados = req?.dados || [];
      } catch (e) {
        console.log(`\n❌ Erro CEAP ID ${dep.id}:`, e.message);
      }

      resultadoAno[dep.id] = dados;

      atual++;
      await new Promise((r) => setTimeout(r, 120)); // Anti rate-limit
    }

    // Garantir pasta
    if (!fs.existsSync(BASE_PATH)) {
      fs.mkdirSync(BASE_PATH, { recursive: true });
    }

    // Salvar o ano
    const pathAno = `${BASE_PATH}${ano}.json`;
    fs.writeFileSync(pathAno, JSON.stringify(resultadoAno, null, 2));

    console.log(`\n\n✅ CEAP ${ano} salvo em: ${pathAno}`);
  }

  console.log("\n🟧 Coleta CEAP finalizada!\n");
}

// =====================================================
// FIM — COLETOR CEAP (GASTOS PARLAMENTARES)
// =====================================================