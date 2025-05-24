import dotenv from "dotenv";
import inquirer from "inquirer";
import { ExitPromptError } from '@inquirer/core';
import simpleGit, { SimpleGit } from "simple-git";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

const CONFIG_PATH = path.resolve(
  process.env.HOME || process.env.USERPROFILE || ".",
  ".cli-config.json"
);

const PROJECTS = (process.env.PROJECTS || "")
  .split(",")
  .map((proj) => proj.trim())
  .filter((proj) => proj.length > 0);

if (PROJECTS.length === 0) {
  console.error("❌ Nenhum projeto definido. Configure a variável PROJECTS no .env ou no ambiente.");
  process.exit(1);
}

function loadConfig(): { mainBranch?: string } {
  if (fs.existsSync(CONFIG_PATH)) {
    const content = fs.readFileSync(CONFIG_PATH, "utf-8");
    return JSON.parse(content);
  }
  return {};
}

function saveConfig(config: { mainBranch?: string }) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function isGitRepository(directory: string): boolean {
  return fs.existsSync(path.join(directory, ".git"));
}

async function run() {
  try {
    const config = loadConfig();

    const { useCurrentBranch } = await inquirer.prompt<{ useCurrentBranch: boolean }>([
      {
        name: "useCurrentBranch",
        type: "confirm",
        message: config.mainBranch
          ? `A branch principal atual é '${config.mainBranch}'. Deseja manter?`
          : "Nenhuma branch principal definida. Deseja definir agora?",
        default: true,
      },
    ]);

    let mainBranch = config.mainBranch;

    if (!useCurrentBranch || !mainBranch) {
      const answer = await inquirer.prompt<{ mainBranch: string }>([
        {
          name: "mainBranch",
          type: "input",
          message: "Informe a branch principal (ex.: main, master, develop, etc):",
          default: mainBranch || "main",
        },
      ]);
      mainBranch = answer.mainBranch;
      config.mainBranch = mainBranch;
      saveConfig(config);
    }

    let projectsToCreate: string[] = [];

    if (PROJECTS.length === 1) {
      projectsToCreate = [...PROJECTS];
      console.log(`🔸 Apenas um projeto detectado: ${PROJECTS[0]}`);
    } else {
      const { allProjects } = await inquirer.prompt<{ allProjects: boolean }>([
        {
          name: "allProjects",
          type: "confirm",
          message: "Deseja criar a branch para todos os projetos?",
          default: true,
        },
      ]);

      if (allProjects) {
        projectsToCreate = [...PROJECTS];
      } else {
        const { selectedProject } = await inquirer.prompt<{ selectedProject: string }>([
          {
            name: "selectedProject",
            type: "list",
            message: "Selecione o projeto:",
            choices: PROJECTS,
          },
        ]);
        projectsToCreate = [selectedProject];
      }
    }

    const branches: Record<string, string> = {};

    for (const proj of projectsToCreate) {
      const { branchName } = await inquirer.prompt<{ branchName: string }>([
        {
          name: "branchName",
          type: "input",
          message: `🔧 Qual o nome da branch para o projeto '${proj}'?`,
        },
      ]);
      branches[proj] = branchName;
    }

    for (const proj of projectsToCreate) {
      const projectPath = path.resolve(".", proj);

      if (!fs.existsSync(projectPath)) {
        console.error(`❌ O caminho do projeto '${proj}' não existe: ${projectPath}`);
        continue;
      }

      if (!isGitRepository(projectPath)) {
        console.error(`❌ O diretório '${proj}' não é um repositório Git: ${projectPath}`);
        continue;
      }

      const git: SimpleGit = simpleGit(projectPath);

      try {
        console.log(`\n🚀 Operando no projeto '${proj}'`);

        await git.checkout(mainBranch);
        await git.pull("origin", mainBranch);
        await git.checkoutLocalBranch(branches[proj]);

        console.log(
          `✅ Branch '${branches[proj]}' criada a partir de '${mainBranch}' no projeto '${proj}'`
        );
      } catch (error) {
        console.error(`❌ Erro ao criar branch no projeto '${proj}':`, error);
      }
    }
  } catch (error) {
    if (error instanceof ExitPromptError) {
      console.log("\n⏹️ Execução interrompida pelo usuário (Ctrl+C). Saindo...");
      process.exit(0);
    }
    console.error("❌ Erro inesperado:", error);
    process.exit(1);
  }
}

run();
