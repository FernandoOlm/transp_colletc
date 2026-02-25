// =====================================================
// INÍCIO — MENU PRINCIPAL BR TRANSPARENTE
// =====================================================

import inquirer from "inquirer";

async function menu() {
  console.clear();
  console.log("=======================================");
  console.log("     BR TRANSPARENTE COLLECTOR");
  console.log("=======================================\n");

  const resposta = await inquirer.prompt([
    {
      type: "list",
      name: "opcao",
      message: "Selecione uma opção:",
      choices: [
        "Atualizar Deputados",
        "Atualizar CEAP",
        "Atualizar Emendas",
        "Atualizar Gabinete",
        "Atualizar Salários",
        "Sair"
      ]
    }
  ]);

  console.log("\nVocê escolheu:", resposta.opcao, "\n");

  if (resposta.opcao === "Sair") {
    process.exit(0);
  }

  console.log("🚧 Módulo ainda não implementado.");
  process.exit(0);
}

menu();

// =====================================================
// FIM — MENU PRINCIPAL BR TRANSPARENTE
// =====================================================