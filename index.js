// =====================================================
// INÍCIO — MENU PRINCIPAL BR TRANSPARENTE
// =====================================================

import inquirer from "inquirer";

// Importando os módulos de coleta
import { coletarDeputados } from "./collector/deputados.js";
import { coletarCEAP } from "./collector/ceap.js";
import { coletarEmendas } from "./collector/emendas.js";
import { coletarGabinete } from "./collector/gabinete.js";
import { coletarSalarios } from "./collector/salarios.js";
import { selecionarAnos } from "./collector/utils/anos.js";

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
        "Atualizar TUDO",
        "Sair"
      ]
    }
  ]);

  console.log("\nVocê escolheu:", resposta.opcao, "\n");

  // ================================
  // ROTAS DO MENU
  // ================================

  if (resposta.opcao === "Atualizar Deputados") {
    await coletarDeputados();
    return voltarMenu();
  }

  if (resposta.opcao === "Atualizar CEAP") {
    const anos = await selecionarAnos();
    await coletarCEAP(anos);
    return voltarMenu();
  }

  if (resposta.opcao === "Atualizar Emendas") {
    const anos = await selecionarAnos();
    await coletarEmendas(anos);
    return voltarMenu();
  }

  if (resposta.opcao === "Atualizar Gabinete") {
    await coletarGabinete();
    return voltarMenu();
  }

  if (resposta.opcao === "Atualizar Salários") {
    await coletarSalarios();
    return voltarMenu();
  }

  if (resposta.opcao === "Atualizar TUDO") {
    const anos = await selecionarAnos();
    await coletarDeputados();
    await coletarCEAP(anos);
    await coletarEmendas(anos);
    await coletarGabinete();
    await coletarSalarios();
    return voltarMenu();
  }

  if (resposta.opcao === "Sair") {
    console.log("Até mais, Sr Fernando!");
    process.exit(0);
  }
}

// Função auxiliar pra voltar ao menu
async function voltarMenu() {
  await inquirer.prompt([
    {
      type: "input",
      name: "cont",
      message: "Pressione ENTER para voltar ao menu."
    }
  ]);

  menu();
}

menu();

// =====================================================
// FIM — MENU PRINCIPAL BR TRANSPARENTE
// =====================================================