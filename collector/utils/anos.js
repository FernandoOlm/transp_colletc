// =====================================================
// INÍCIO — UTIL: SELETOR DE ANOS INTERATIVO
// =====================================================

import inquirer from "inquirer";

// Gera anos dos últimos 10 anos até o atual
function gerarAnosDisponiveis() {
  const atual = new Date().getFullYear();
  const anos = [];
  for (let a = atual; a >= atual - 10; a--) anos.push(a);
  return anos;
}

export async function selecionarAnos() {
  const anos = gerarAnosDisponiveis();

  const { selecionados } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "selecionados",
      message: "Selecione os ANOS desejados:",
      choices: anos
    }
  ]);

  if (!selecionados.length) {
    console.log("\n❌ Você não selecionou nenhum ano.");
    process.exit(0);
  }

  return selecionados;
}

// =====================================================
// FIM — UTIL: SELETOR DE ANOS INTERATIVO
// =====================================================