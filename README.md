# Git Branch Manager CLI

Ferramenta simples para criar branches em múltiplos projetos Git de forma rápida e configurável.

---

## Funcionalidades

- Pergunta qual a branch principal (main/master) a ser usada.
- Permite escolher se cria branches em todos os projetos ou só em um.
- Se só houver um projeto, não pergunta se quer todos, já cria direto.
- Cria a branch nova a partir da branch principal, atualizando antes.
- Salva a branch principal para não precisar perguntar toda vez.

---

## Configuração

- Defina uma env var chamada `PROJECTS` com os nomes dos diretórios dos seus projetos separados por vírgula, como: ```COMANDO_DO_OS_ = "projeto1,projeto2,projeto3" ```

- O script cria um arquivo `.cli-config.json` para salvar a branch principal usada.

---

## Como usar

Para rodar o script, use o comando:

```npx tsx easy-cli.ts```

## Fluxo de execução
1. O script pergunta qual é a branch principal (exemplo: main ou master).

2. Se houver mais de um projeto, ele pergunta se você quer criar a branch em todos os projetos ou apenas em um selecionado.

3. Para cada projeto escolhido, o script:
    - Faz checkout da branch principal.
    - Executa um git pull para atualizar.
    - Cria a nova branch conforme o nome informado.

