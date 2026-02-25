// =====================================================
// INÍCIO — COLETOR DE EMENDAS (CÂMARA + SENADO)
// =====================================================

import fs from "fs";
import fetch from "node-fetch";

const BASE_PATH = "/home/folmdelima/transp_colletc/cache/emendas/";

export async function coletarEmendas(anos) {
  console.clear();
  console.log("🟩 Iniciando coleta de EMENDAS...");
  console.log("📅 Anos selecionados:", anos.join(", "), "\n");

  const listaPath =
    "/home/folmdelima/transp_colletc/cache/deputados/lista.json";

  if (!fs.existsSync(listaPath)) {
    console.log("❌ Lista de deputados não encontrada. Rode 'Atualizar Deputados' antes.");
    return;
  }

  const deputados = JSON.parse(fs.readFileSync(listaPath));

  for (const ano of anos) {
    console.log(`\n📘 Coletando EMENDAS do ano ${ano}...\n`);

    const resultadoAno = {};
    let atual = 1;
    const total = deputados.length;

    for (const dep of deputados) {
      const pct = ((atual / total) * 100).toFixed(1);
      process.stdout.write(
        `📦 ${atual}/${total} (${pct}%) — ID: ${dep.id}\r`
      );

      // --- Câmara ---
      const urlCamara =
        `https://dadosabertos.camara.leg.br/api/v2/orcamento/emendas?ano=${ano}&autor=${dep.id}`;
      let camara = [];
      try {
        const r = await fetch(urlCamara).then((s) => s.json());
        camara = r?.dados || [];
      } catch {}

      // --- Senado ---
      const urlSenado =
        `https://legis.senado.leg.br/dadosabertos/emendas/autor/${encodeURIComponent(
          dep.nomeCivil
        )}?ano=${ano}`;

      let senado = [];
      try {
        const r = await fetch(urlSenado).then((s) => s.text());
        if (r.includes("<Emenda>")) {
          const regex = /<Emenda>([\s\S]*?)<\/Emenda>/g;
          let m;
          while ((m = regex.exec(r))) {
            senado.push({ xml: m[1] });
          }
        }
      } catch {}

      resultadoAno[dep.id] = {
        camara,
        senado
      };

      atual++;
      await new Promise((r) => setTimeout(r, 120));
    }

    if (!fs.existsSync(BASE_PATH))
      fs.mkdirSync(BASE_PATH, { recursive: true });

    const pathAno = `${BASE_PATH}${ano}.json`;
    fs.writeFileSync(pathAno, JSON.stringify(resultadoAno, null, 2));

    console.log(`\n\n✅ EMENDAS ${ano} salvas em: ${pathAno}`);
  }

  console.log("\n🟩 Coleta de EMENDAS finalizada!\n");
}

// =====================================================
// FIM — COLETOR DE EMENDAS
// =====================================================