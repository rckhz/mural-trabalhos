# Mural de Trabalhos — ETEC Dra. Ruth Cardoso

Site onde os projetos das turmas ficam publicados durante o ano letivo. Qualquer pessoa pode ver o mural sem fazer login. Os alunos enviam e atualizam os trabalhos da própria sala, e os professores administram contas, anos letivos e conteúdo.

Este documento tem duas partes:

- **Parte 1 — Para quem usa** (professores e alunos): o que o site faz e como usar.
- **Parte 2 — Para quem mantém** (técnico): arquitetura, banco de dados, segurança, instalação e solução de problemas.

## Índice

**Parte 1 — Uso**
1. [Visão geral](#1-visão-geral)
2. [Mural público](#2-mural-público)
3. [Tipos de conta e permissões](#3-tipos-de-conta-e-permissões)
4. [Como é um projeto](#4-como-é-um-projeto)
5. [Guia do aluno](#5-guia-do-aluno)
6. [Guia do professor](#6-guia-do-professor)

**Parte 2 — Manutenção**
7. [Tecnologias](#7-tecnologias)
8. [Arquitetura](#8-arquitetura)
9. [Banco de dados](#9-banco-de-dados)
10. [Segurança e privacidade](#10-segurança-e-privacidade)
11. [Armazenamento de arquivos](#11-armazenamento-de-arquivos)
12. [Instalação do zero](#12-instalação-do-zero)
13. [Rodar no computador](#13-rodar-no-computador)
14. [Mapa do código](#14-mapa-do-código)
15. [Plano gratuito: limites e cuidados](#15-plano-gratuito-limites-e-cuidados)
16. [Solução de problemas](#16-solução-de-problemas)
17. [Decisões de projeto](#17-decisões-de-projeto)
18. [Limitações conhecidas](#18-limitações-conhecidas)

---

# Parte 1 — Para quem usa

## 1. Visão geral

| | |
|---|---|
| **Escola** | ETEC Dra. Ruth Cardoso |
| **Turmas** | 1º, 2º e 3º ano, cada um com duas turmas: **MIL** e **MIN** (6 turmas por ano letivo) |
| **Quem vê** | Qualquer pessoa, sem login, vê os projetos publicados |
| **Quem envia** | Alunos (só da própria sala) e professores (de qualquer sala) |
| **O que cada projeto tem** | Título, semestre, disciplina, descrição, **documento em PDF**, **link do slide** e **fotos** |
| **Ao longo do ano** | Os projetos podem ser atualizados e os arquivos substituídos |

## 2. Mural público

O mural é organizado em pastas, como no computador. A pessoa vai descendo até chegar nos projetos:

```
Mural
├── 2026
│   ├── 1º ano
│   │   ├── 1º MIL  →  projetos do 1º MIL
│   │   └── 1º MIN  →  projetos do 1º MIN
│   ├── 2º ano  (MIL e MIN)
│   └── 3º ano  (MIL e MIN)
└── 2025
    └── ...
```

- Cada pasta mostra **quantos projetos publicados** existem dentro dela.
- No alto da página há o **caminho** (ex.: *Mural › 2026 › 1º ano › MIL*). Cada parte dele é clicável, e o botão **Voltar** sobe uma pasta.
- Dentro da turma, os projetos aparecem em **cards**, ordenados por semestre e, dentro do semestre, do mais novo para o mais antigo.
- Cada card mostra o semestre, o título, a disciplina e, no rodapé, quem criou e quem editou.

### Página de um projeto

Ao clicar num card, a pessoa vê:

1. **Cabeçalho:** turma, ano letivo, semestre e disciplina.
2. **Abrir slide:** botão que abre o link da apresentação (Google Apresentações, Canva etc.) em outra aba.
3. **Documento:** o PDF aparece dentro da própria página, com um link para abrir em tela cheia.
4. **Sobre o trabalho:** descrição e galeria de fotos (clicar na foto abre em tamanho maior).
5. **Rodapé de autoria:** *"Criado por X em dd/mm/aaaa"* e *"Última edição por Y em dd/mm/aaaa"*. Esses nomes são gravados pelo próprio banco de dados e **ninguém consegue editá-los**.

## 3. Tipos de conta e permissões

| | Visitante (sem login) | Aluno | Professor |
|---|:-:|:-:|:-:|
| Ver mural e projetos **publicados** | ✅ | ✅ | ✅ |
| Ver **rascunhos** | ❌ | só da própria sala | ✅ todos |
| Criar projeto | ❌ | só na própria sala | ✅ em qualquer turma |
| Editar projeto, enviar PDF, link e fotos | ❌ | só da própria sala | ✅ qualquer |
| Publicar / voltar para rascunho | ❌ | ✅ (própria sala) | ✅ |
| **Ocultar** projeto | ❌ | ❌ | ✅ |
| **Excluir** projeto | ❌ | ❌ | ✅ |
| Criar / remover / desativar contas | ❌ | ❌ | ✅ |
| Criar anos letivos | ❌ | ❌ | ✅ |
| Ver o medidor de armazenamento | ❌ | ❌ | ✅ |

**Situação do projeto:**

| Situação | Quem vê | O que significa |
|---|---|---|
| **Rascunho** | A própria sala e os professores | Em construção. Todo projeto nasce assim. |
| **Publicado** | Todo mundo | Aparece no mural. Exige PDF + link do slide. |
| **Oculto** | Só professores | Saiu do mural, e a sala **não consegue mais editar**. Só o professor desfaz. |

> Um aluno vê os colegas da própria sala no sistema, mas **nunca** os alunos de outras salas. O público não vê nenhuma lista de contas.

## 4. Como é um projeto

| Campo | Regras |
|---|---|
| **Título** | Obrigatório, de 3 a 120 caracteres |
| **Semestre** | 1º ou 2º semestre |
| **Disciplina** | Opcional. É gravada sempre em **MAIÚSCULAS** e sem espaços repetidos (`ea`, `Ea ` e `EA` viram `EA`) |
| **Descrição** | Opcional, até 3000 caracteres |
| **Documento (PDF)** | Até **5 MB**, só PDF. Aparece na página. |
| **Slide (link)** | Endereço do Google Apresentações, Canva, OneDrive etc. **Não ocupa espaço no site.** |
| **Fotos** | Quantas quiser. Cada uma é reduzida no navegador antes de enviar (veja a [seção 11](#11-armazenamento-de-arquivos)). |

**Para publicar, o projeto precisa de PDF e link do slide.** Se faltar algo, o site avisa o que falta.

**Depois de publicado**, o PDF e o link só podem ser **substituídos**, não removidos (para o projeto nunca ficar publicado incompleto). Para remover, volte o projeto para rascunho.

**Atualizar ao longo do ano:** trocar o PDF apaga o arquivo antigo automaticamente. O link do slide é só trocado.

## 5. Guia do aluno

1. Na página inicial, clique em **"Sou aluno"** e depois em **"Entrar para enviar trabalho"**.
2. **Primeiro acesso:** entre com o e-mail e a **senha inicial**, que é o que vem antes do `@` do e-mail (ex.: `ana.souza@email.com` → senha `ana.souza`). O site pede para você criar uma senha nova, com **no mínimo 8 caracteres**.
3. Você cai em **Minha sala**, onde aparecem os projetos da sua turma e o formulário **Novo projeto**.
4. **Criar projeto:** informe título, semestre e (se quiser) disciplina, e clique em **Criar projeto**. A tela de edição abre sozinha.
5. Na tela de edição:
   - **Sobre o projeto:** ajuste título, semestre, disciplina e escreva a descrição. Clique em **Salvar**.
   - **Documento e slide:** envie o **PDF** (clicando no botão ou arrastando o arquivo) e cole o **link do slide**, clicando em **Salvar link**.
   - **Fotos:** clique em **Adicionar fotos** (pode escolher várias).
   - **Situação:** quando estiver pronto, clique em **Publicar no mural**.
6. **Ver como ficou:** o botão **Ver como no mural** mostra a página igual ao público.
7. Para atualizar depois, entre de novo, abra o projeto na lista da sala e edite.

**Dicas**
- O slide precisa estar compartilhado como **"qualquer pessoa com o link"**, senão o público não consegue abrir.
- Esqueceu a senha? Peça ao professor para **redefinir**. Ela volta a ser a inicial.
- Foto de iPhone em formato **HEIC** não funciona. Envie em JPG ou PNG.

## 6. Guia do professor

Entre por **"Sou professor"**. A tela inicial é o **Painel**, com quatro áreas: **Alunos**, **Projetos**, **Anos letivos** e **Armazenamento**.

### 6.1 Começo do ano letivo

1. **Painel › Anos letivos:** digite o ano (o campo já sugere o próximo) e clique em **"Criar ano com as 6 turmas"**. O ano vira uma pasta no mural, já com 1º, 2º e 3º ano (MIL e MIN) dentro.
2. **Painel › Alunos:** escolha o **ano letivo** e a **turma** nas abas, cole a lista de alunos e clique em **Cadastrar**.

### 6.2 Cadastrar contas

Uma linha por pessoa, no formato `Nome; e-mail`. Também dá para colar duas colunas de uma planilha (separadas por tabulação) ou usar vírgula:

```
Ana Souza; ana.souza@email.com
Bruno Lima; bruno.lima@email.com
```

| Regra | Detalhe |
|---|---|
| **Tipo de conta** | **Aluno** (informa Ano, Turma e Ano letivo) ou **Professor** (sem turma, acesso total) |
| **Máximo** | 60 contas por vez |
| **Senha inicial** | A parte do e-mail antes do `@`, em minúsculas. `ana.souza@email.com` → `ana.souza` |
| **Senha curta** | O Supabase exige **mínimo de 6 caracteres**. Se faltar, o site completa com números: `ana@email.com` → `ana123` |
| **E-mail** | Só o **formato** é checado. Não é enviado e-mail nenhum, nem precisa existir. |
| **1º acesso** | A pessoa é obrigada a criar uma senha própria (mínimo 8 caracteres) antes de usar o site |
| **Erros** | A tabela de resultado mostra linha por linha o que deu errado (e-mail repetido, formato inválido etc.) |

Depois de cadastrar, aparece a tabela **Nome / E-mail / Senha**. Use **Copiar** (cola numa planilha) ou **Imprimir** para entregar à turma.

### 6.3 Gerenciar contas (Painel › Alunos)

Escolha o ano e a turma. A lista mostra cada conta com selos (*administrador*, *desativado*, *aguardando 1º acesso*).

| Ação | O que faz |
|---|---|
| **Redefinir senha** | Volta a senha para a inicial e exige nova troca no próximo acesso. A senha antiga deixa de funcionar. |
| **Desativar / Reativar** | Bloqueia ou libera o login, sem apagar nada |
| **Interruptor "administrador"** | Dá ou tira o acesso de professor. Uma conta sem turma não pode virar aluno. |
| **Remover** | Apaga a conta de vez (login e perfil). **Os projetos continuam no mural** e os nomes de autoria continuam escritos neles. |

**Redefinir senha** e **Desativar / Reativar** aparecem só para contas de **aluno**. Conta de professor se gerencia pelo interruptor de administrador e pelo botão Remover.

Segurança embutida: ninguém consegue **remover a própria conta** nem **tirar o próprio acesso de administrador**, para o site nunca ficar sem professor.

O quadro **"Professores e administradores"**, no fim da página, lista todas as contas com acesso total.

### 6.4 Gerenciar projetos (Painel › Projetos)

- Escolha ano e turma. A lista mostra os projetos com semestre, disciplina e situação.
- **Novo projeto:** escolha **Ano**, **Turma** e **Ano letivo**, depois título, semestre e disciplina.
- Clique num projeto para editar. Além de tudo que o aluno faz, o professor pode **Ocultar** e **Excluir projeto**.
- **Excluir apaga tudo** (projeto, PDF e fotos) e **não tem como desfazer**. O site pede confirmação.

### 6.5 Anos letivos (Painel › Anos letivos)

- Lista os anos com a quantidade de turmas, projetos e contas.
- **Remover um ano** só é permitido quando ele está **vazio** (sem projetos e sem contas). Serve para corrigir um ano criado por engano.
- Anos antigos continuam como pastas no mural para consulta.

### 6.6 Armazenamento (Painel, página inicial)

Mostra duas barras:

| Barra | Limite (plano gratuito) |
|---|---|
| **Arquivos** (PDFs + fotos) | 1 GB |
| **Banco de dados** (textos, contas) | 500 MB |

A barra fica **amarela a partir de 70%** e **vermelha a partir de 90%**, com um aviso por escrito. Abaixo dela aparece o total de cada tipo de arquivo.

**Arquivos soltos** são sobras no armazenamento que nenhum projeto usa mais (por exemplo, um envio interrompido). Quando existem, aparece o botão **Limpar**, que apaga só essas sobras. Arquivos enviados há menos de 1 hora nunca entram nessa conta, para não apagar um envio em andamento.

### 6.7 Primeiro acesso do site

O primeiro professor é criado à mão (veja a [seção 12](#12-instalação-do-zero)). Todos os demais professores podem ser criados pelo próprio site, em **Painel › Alunos › Cadastrar contas › Professor**.

### 6.8 Tema claro e escuro

O botão de sol/lua, no canto inferior direito de todas as telas, alterna o tema. A escolha fica salva no navegador. Se nunca foi escolhida, vale a preferência do computador. O tema claro usa tons de **bege, branco e verde-sálvia**.

---

# Parte 2 — Para quem mantém

## 7. Tecnologias

| Camada | Tecnologia | Para quê |
|---|---|---|
| Framework | **Next.js 16** (App Router, Turbopack) | Páginas, rotas, Server Actions |
| Interface | **React 19** + **TypeScript** | Telas e formulários |
| Estilo | **Tailwind CSS 4** + **shadcn/ui** (base **Base UI**) + ícones **lucide-react** | Componentes e tema claro/escuro |
| Banco e login | **Supabase** (Postgres + Auth) | Dados, contas e permissões (RLS) |
| Arquivos | **Supabase Storage** (buckets privados) | PDFs e fotos |
| Hospedagem | **Vercel** | Deploy automático a cada `git push` na `main` |
| Tarefa agendada | **Vercel Cron** | Mantém o Supabase gratuito ativo |

> **Atenção, Next.js 16:** esta versão tem mudanças em relação às anteriores. O arquivo `proxy.ts` substitui o antigo `middleware.ts`, e `params` e `searchParams` são assíncronos (`await`). O arquivo [AGENTS.md](AGENTS.md) é gerado pelo Next e orienta a ler a documentação em `node_modules/next/dist/docs/` antes de alterar código.

## 8. Arquitetura

```
 Navegador ──────────────► Vercel (Next.js) ───────────► Supabase
   │   páginas e ações do servidor        │                  ├─ Auth      (login)
   │                                      │                  ├─ Postgres  (dados + RLS)
   └── upload direto de PDF e fotos ──────┼──────────────►   └─ Storage   (arquivos)
                                          │
                    Vercel Cron ──► /api/cron/manter-ativo (1x por dia)
```

### Dois clientes do Supabase, três "papéis"

| Cliente | Arquivo | Onde roda | Identidade |
|---|---|---|---|
| **Servidor** | `lib/supabase/servidor.ts` | Páginas e Server Actions | A **sessão de quem está logado** (via cookies). Quem decide o que pode é o **RLS** do banco. |
| **Navegador** | `lib/supabase/navegador.ts` | Só no envio de arquivos | A mesma sessão. Envia PDF e fotos **direto para o Storage**. |
| **Admin** | `lib/supabase/admin.ts` | **Só no servidor** | Chave `service_role`, **ignora o RLS**. Usado apenas para criar/remover contas, redefinir senhas e limpar arquivos soltos. |

### Por que o upload vai direto do navegador ao Storage

As funções da Vercel aceitam corpo de requisição de cerca de **4,5 MB**. Um PDF de 5 MB não passaria por uma Server Action. Por isso o navegador envia o arquivo diretamente ao Supabase e, **depois**, avisa o servidor com o caminho (`salvarDocumento`, `adicionarFoto`) para registrar no banco. Se o registro falhar, o arquivo enviado é apagado em seguida (para não deixar sobras).

### Sessão de login

- `proxy.ts` roda em quase toda requisição e **renova o cookie de sessão** do Supabase. Ele não bloqueia nada. Se as variáveis de ambiente faltarem, apenas deixa a página passar.
- `lib/sessao.ts → sessaoAtual()` devolve usuário + perfil, **ou `null` se não houver perfil ativo**. Uma conta que existe no Supabase mas não tem linha em `perfil`, ou está desativada, não entra.
- `exigir("professora" | "aluno")` protege páginas: sem sessão manda para `/entrar`, e com a função errada manda para a área certa.
- `destino(perfil)`: `deve_trocar_senha` → `/trocar-senha`, professor → `/painel`, aluno → `/sala`.

### Rotas

| Rota | Quem acessa | O que é |
|---|---|---|
| `/` | todos | Página inicial: "Sou aluno" / "Sou professor" |
| `/mural` | todos | Pastas ano › série › turma, e projetos. Parâmetros: `?ano=2026&serie=1&turma=MIL` |
| `/projeto/[id]` | todos* | Página pública do projeto (*rascunho só para sala e professores) |
| `/entrar` | todos | Login |
| `/trocar-senha` | logados | Troca obrigatória no 1º acesso |
| `/sala` | aluno | Projetos da própria sala + novo projeto |
| `/projeto/[id]/editar` | aluno (sala) e professor | Dados, PDF, link do slide, fotos e situação |
| `/painel` | professor | Gestão + medidor de armazenamento |
| `/painel/alunos` | professor | Contas |
| `/painel/projetos` | professor | Projetos por turma |
| `/painel/anos` | professor | Anos letivos |
| `/api/saude` | todos | Diagnóstico (sem revelar valores) |
| `/api/cron/manter-ativo` | só a Vercel | Exige `Authorization: Bearer <CRON_SECRET>` |

### Server Actions (o "back-end" do site)

| Arquivo | Ações |
|---|---|
| `lib/acoes-sessao.ts` | `entrar`, `trocarSenha`, `sair` |
| `lib/acoes-projeto.ts` | `criarProjeto`, `salvarDados`, `salvarLinkSlide`, `definirStatus`, `excluirProjeto`, `salvarDocumento`, `removerDocumento`, `adicionarFoto`, `removerFoto` |
| `app/painel/alunos/acoes.ts` | `cadastrarAlunos`, `novaSenha`, `definirAtivo`, `definirAdmin`, `removerConta` |
| `app/painel/anos/acoes.ts` | `criarAno`, `removerAno` |
| `app/painel/acoes.ts` | `limparSoltos` |

As ações de **projeto** usam a sessão do usuário, então o RLS barra qualquer coisa fora da permissão. As ações de **conta** (`painel/alunos`) usam a chave admin, e por isso **toda ação começa conferindo se quem chamou é professor** (`garantirProfessora`).

## 9. Banco de dados

### Tabelas

```
ano_letivo ──< turma ──< projeto ──< documento
                 │          └──────< foto
                 └──< perfil >── auth.users (Supabase Auth)
```

**`ano_letivo`**: `ano` (2020–2100), `atual`.

**`turma`**: `id`, `ano_letivo`, `serie` (1–3), `nome` (`MIL` ou `MIN`). Única por (ano, série, nome).

**`perfil`**: um por conta de login. A chave é o `id` do `auth.users` (apagar o login apaga o perfil).

| Coluna | Descrição |
|---|---|
| `nome` | 2 a 120 caracteres |
| `funcao` | `professora` ou `aluno` (o nome do valor no banco é no feminino, mas vale para qualquer professor) |
| `turma_id` | Obrigatória para aluno. Professor não tem turma. |
| `ativo` | `false` = conta desativada |
| `deve_trocar_senha` | `true` até a pessoa criar a própria senha |

**`projeto`**

| Coluna | Descrição |
|---|---|
| `turma_id`, `semestre` (1–2), `titulo`, `descricao`, `disciplina` | Dados do projeto |
| `link_slide` | Só aceita `http://` ou `https://`, até 500 caracteres |
| `status` | `rascunho`, `publicado` ou `oculto` |
| `criado_por`, `criado_em`, `atualizado_por`, `atualizado_em` | Autoria (preenchida por gatilho) |
| `criado_por_nome`, `atualizado_por_nome` | **Cópia do nome em texto**, para o rodapé público. Continua certo mesmo se a conta for removida. |
| `busca` | Índice de busca em português (gerado). Hoje não é usado pela interface. |
| `bimestre`, `tipo` | **Legado.** O bimestre foi substituído pelo semestre e `tipo` nunca foi usado. Podem ficar. |

**`documento`**: o PDF do projeto. `projeto_id`, `formato` (hoje só `pdf`), `arquivo` (caminho no Storage), `status`. Há **um por projeto** (única por `projeto_id + formato`). A coluna `bimestre` é legado.

**`foto`**: `projeto_id`, `arquivo`, `legenda` (existe, mas a interface ainda não tem como preencher).

### Funções e gatilhos

| Função | Para quê |
|---|---|
| `eh_professora()` | A pessoa logada é professor ativo? |
| `minha_turma()` | Turma do aluno logado (ou `null`) |
| `da_minha_turma(p)` / `projeto_publicado(p)` | Auxiliares das regras de leitura |
| `pode_editar_projeto(p)` | Professor: qualquer projeto. Aluno: da própria turma e não oculto. |
| `pasta_projeto(caminho)` | Extrai o `projeto_id` da primeira pasta de um caminho do Storage |
| `marcar_senha_trocada()` | Chamada após a troca de senha |
| `marca_autoria()` (gatilho) | Grava quem criou e quem editou, a partir da sessão. **Só mudar a situação (publicar/ocultar) não conta como edição.** |
| `uso_armazenamento()` | Medidor do painel (só professor) |
| `arquivos_soltos()` | Lista de sobras no Storage (só professor) |

As funções de apoio usam `security definer`, o que evita recursão infinita nas regras de segurança.

### Migrações (rodar nesta ordem)

Os arquivos ficam em [supabase/migrations/](supabase/migrations/). Cole cada um no **SQL Editor** do Supabase e clique em *Run*.

| # | Arquivo | O que faz | Pode rodar de novo? |
|---|---|---|:-:|
| 1 | `20261107000000_esquema_inicial.sql` | Tabelas, tipos, regras (RLS), buckets, ano 2026 e as 6 turmas | ❌ dá erro (`type ... already exists`) |
| 2 | `20261108000000_projeto_por_bimestre.sql` | Projeto passa a ter bimestre (depois substituído pelo semestre) | ❌ |
| 3 | `20261108010000_autoria_publica.sql` | Nomes de autoria visíveis no mural | ❌ |
| 4 | `20261108020000_ano_2025.sql` | Cria o ano de 2025 com as 6 turmas | ✅ |
| 5 | `20261108030000_documento_e_slide.sql` | Documento + slide como arquivos (**substituída pela nº 6**) | ✅ |
| 6 | `20261108040000_semestre_link_medidor.sql` | Semestre, slide como link, 1 PDF por projeto, medidor de armazenamento | ✅ |
| 7 | `20261108050000_bucket_fotos.sql` | Bucket de fotos aceita WebP, JPEG e PNG, até 1 MB | ✅ |
| 8 | `20261108060000_disciplina_maiuscula.sql` | Passa as disciplinas já cadastradas para maiúsculas | ✅ |

> Numa instalação nova, rode **todas, na ordem**. O resultado final é o mesmo, já que as últimas corrigem as anteriores.

## 10. Segurança e privacidade

### Camadas de proteção

1. **RLS no banco (a principal).** As permissões da [seção 3](#3-tipos-de-conta-e-permissões) estão nas regras do Postgres, e não só nas telas. Se alguém chamar a API direto, com a chave pública, as regras continuam valendo: aluno não mexe em outra sala, visitante não vê rascunho nem a tabela `perfil`.
2. **Buckets privados.** Os arquivos não têm endereço público fixo. O site gera **links temporários de 1 hora** para exibir PDF e fotos.
3. **Regras no Storage.** O primeiro nível de cada caminho é o `id` do projeto, e a permissão de enviar, ler e apagar é a mesma do projeto. Arquivo de rascunho não vaza.
4. **Links do slide só `http(s)`.** Validado no servidor, no banco (`check`) e de novo ao montar a página, o que bloqueia esquemas perigosos como `javascript:`.
5. **Autoria à prova de edição.** Os nomes no rodapé são preenchidos por um gatilho `security definer`, e não pelo que o usuário digita.
6. **Conta sem perfil não entra.** Mesmo que alguém crie um login no Supabase, sem linha em `perfil` o site não o reconhece e o RLS não libera nada.
7. **Proteções de conta.** Ninguém se remove nem se rebaixa. Só o professor pode redefinir senha, desativar ou remover.

### Chaves secretas

A `SUPABASE_SERVICE_ROLE_KEY` ignora todas as regras de segurança. Ela:

- é usada **apenas no servidor** (`lib/supabase/admin.ts`);
- **nunca** pode ter o prefixo `NEXT_PUBLIC_`, que a exporia no navegador;
- **nunca** deve ir para o GitHub (o `.gitignore` já ignora `.env*`);
- deve ser cadastrada na Vercel como **Sensitive**.

Se ela vazar: Supabase › Project Settings › API → gerar nova chave, atualizar na Vercel e fazer **Redeploy**.

### Recomendações de endurecimento (Supabase › Authentication)

- **Desligar o cadastro aberto** (*Allow new users to sign up*). As contas são criadas só pelo professor, e a criação pelo painel continua funcionando com essa opção desligada.
- Manter o tamanho mínimo de senha em **6** (o site exige 8 na troca do 1º acesso).

### Privacidade (importante para a escola)

- **Nomes públicos:** o rodapé do mural mostra o **nome completo** de quem criou e editou o projeto. Como os autores são alunos (possivelmente menores de idade), a escola deve avaliar se quer mostrar só o **primeiro nome** ou apelido. Isso exige uma pequena mudança no código.
- **Fotos e documentos são públicos** depois de publicados. Oriente os alunos a não publicar dados pessoais (telefone, endereço, documentos) nem fotos de terceiros sem autorização.
- **E-mails dos alunos** ficam só no Supabase Auth e **não aparecem no site público**. Só professores os veem, no painel.
- Como o site trata dados de menores, vale alinhar com a direção a base legal e o aviso de privacidade (LGPD).

## 11. Armazenamento de arquivos

| Bucket | Conteúdo | Tipos aceitos | Limite | Caminho |
|---|---|---|---|---|
| `documentos` | PDF do projeto | `application/pdf` | 5 MB | `documentos/{projeto_id}/doc-{timestamp}.pdf` |
| `fotos` | Fotos do projeto | `image/webp`, `image/jpeg`, `image/png` | 1 MB | `fotos/{projeto_id}/{uuid}.webp` |

### Fotos: redução automática (`lib/imagem.ts`)

Antes de enviar, o **navegador** reduz cada foto:

1. Lado maior limitado a **1600 px**.
2. Converte para **WebP** (no Safari, que não gera WebP, usa JPEG).
3. Tenta qualidade 0,8 → 0,65 → 0,5 → 0,35 até caber em **1 MB**.

Uma foto de celular de 4 MB costuma ficar com 150 a 400 KB. Formatos que o navegador não abre (como **HEIC** do iPhone) falham, e o site mostra uma mensagem indicando a etapa e o motivo.

### Quanto espaço isso consome

Estimativa (não medida em arquivos reais): cerca de **2 MB por projeto** (PDF ~1 MB + fotos ~1 MB). Com ~42 projetos por ano (6 turmas × ~7 grupos), são ~**85 MB por ano**. O 1 GB gratuito dura vários anos, **contando os anos antigos** que forem cadastrados. O **medidor** do painel serve para acompanhar.

Economia embutida: o slide é só um link, substituir o PDF apaga o antigo, excluir um projeto apaga seus arquivos, e o botão **Limpar** remove sobras.

### Se o espaço acabar

Opções, da mais simples à mais trabalhosa: apagar arquivos de projetos antigos; migrar para o plano Pro do Supabase (cerca de US$ 25 por mês, 100 GB); ou mover os arquivos para outro serviço, como o Cloudflare R2. O código de envio e leitura de arquivos fica concentrado em `app/projeto/[id]/editar/` e `lib/acoes-projeto.ts`, mas é preciso refazer as regras de acesso, que hoje são do Supabase.

## 12. Instalação do zero

### 1. Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No **SQL Editor**, rode as [8 migrações](#migrações-rodar-nesta-ordem) em ordem.
3. Em **Authentication › Users › Add user**, crie o **primeiro professor** marcando **Auto Confirm User**.
4. No SQL Editor, dê a ele o perfil de professor:

   ```sql
   insert into public.perfil (id, nome, funcao, deve_trocar_senha)
   select id, 'Nome do Professor', 'professora', false
   from auth.users where lower(email) = lower('email-do-professor@exemplo.com');
   ```

5. Em **Project Settings › API**, anote a **Project URL**, a chave **anon/publishable** e a chave **service_role/secret**.

### 2. Vercel

1. Em [vercel.com](https://vercel.com) › **Add New › Project**, importe este repositório do GitHub.
2. Deixe **Framework Preset = Next.js** e **Root Directory vazio**. O `vercel.json` já define `"framework": "nextjs"`.
3. Cadastre as [variáveis de ambiente](#variáveis-de-ambiente) com **Production** marcado.
4. Clique em **Deploy**. Depois de qualquer mudança nas variáveis, faça **Redeploy**.

### 3. Conferir

- Abra `/api/saude`: todas as variáveis necessárias devem aparecer `true` e o banco `ok (N turmas)`.
- Entre como o professor em **Sou professor** e crie o ano atual em **Painel › Anos letivos**.

### Variáveis de ambiente

Modelo em [.env.example](.env.example).

| Variável | Onde achar | Tipo na Vercel |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase › Project Settings › API › Project URL | Config (comum) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase › API › chave `anon` / publishable | Config (comum) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase › API › chave `service_role` / secret | **Sensitive** |
| `CRON_SECRET` | Qualquer texto longo e aleatório, inventado por você | **Sensitive** |

O código também aceita os nomes alternativos `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_SECRET_KEY`, usados nos painéis mais novos do Supabase.

## 13. Rodar no computador

Requisito: **Node.js 20.9 ou mais novo**.

```bash
npm install
cp .env.example .env.local     # no Windows (PowerShell): copy .env.example .env.local
# preencha as variáveis em .env.local
npm run dev                    # abre em http://localhost:3000
```

| Comando | Para quê |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Compila para produção. **Rode antes de enviar mudanças** para pegar erros de TypeScript. |
| `npm run start` | Roda a versão compilada |

O computador local fala com o **mesmo** banco do Supabase configurado no `.env.local`. Use um projeto Supabase de teste para não mexer nos dados reais.

**Fluxo de trabalho:** alterou o código → `npm run build` → `git commit` → `git push` na `main` → a Vercel publica sozinha em cerca de 1 minuto. Mudanças que dependem de SQL novo exigem rodar o SQL no Supabase **antes** de publicar o código.

## 14. Mapa do código

```
app/
├── layout.tsx                  estrutura geral, script do tema, botão de tema
├── globals.css                 cores (tema claro/escuro) e estilos globais
├── page.tsx                    página inicial
├── entrar/                     login
├── trocar-senha/               troca obrigatória no 1º acesso
├── mural/page.tsx              pastas e cards do mural público
├── projeto/[id]/
│   ├── page.tsx                página pública do projeto
│   └── editar/
│       ├── page.tsx            tela de edição (busca dados e links temporários)
│       ├── status.tsx          publicar / rascunho / ocultar / excluir
│       ├── form-dados.tsx      título, semestre, disciplina, descrição
│       ├── documentos.tsx      caixa do PDF e caixa do link do slide
│       └── fotos.tsx           envio, galeria e remoção de fotos
├── sala/page.tsx               área do aluno
├── painel/
│   ├── page.tsx                gestão + medidor de armazenamento
│   ├── medidor.tsx, acoes.ts   botão "Limpar" arquivos soltos
│   ├── alunos/                 contas: página, cadastro, ações, interruptor, remover
│   ├── projetos/page.tsx       projetos por turma
│   └── anos/                   anos letivos: página, formulários, ações
└── api/
    ├── saude/route.ts          diagnóstico
    └── cron/manter-ativo/      acesso diário ao banco

components/
├── ui/                         shadcn: button, card, input, label, badge, switch, alert-dialog
├── campos-turma.tsx            3 campos: Ano, Turma e Ano letivo
├── seletor-turma.tsx           abas do painel: ano e turmas
├── confirmar.tsx               diálogo de confirmação (no lugar do confirm() do navegador)
├── formulario-acao.tsx         formulário de login/troca de senha, com o "olhinho" da senha
├── novo-projeto.tsx            formulário de novo projeto
├── lista-projetos.tsx          lista de projetos (sala e painel)
├── botao-tema.tsx              alternar claro/escuro
├── cabecalho-area.tsx          topo das áreas logadas
└── voltar.tsx                  link "Voltar"

lib/
├── sessao.ts                   sessão, perfil, redirecionamentos
├── acoes-sessao.ts             entrar, trocar senha, sair
├── acoes-projeto.ts            ações de projeto, PDF, link e fotos
├── projetos.ts                 regra "pode editar", texto de autoria, estilo de campo
├── turmas.ts                   tipo Turma e busca de turmas
├── imagem.ts                   redução de fotos
├── tema.ts                     script que aplica o tema antes de pintar a tela
└── supabase/                   config.ts, servidor.ts, navegador.ts, admin.ts

proxy.ts                        renova a sessão de login (substitui o middleware)
supabase/migrations/            SQL do banco
vercel.json                     framework e agendamento do cron
```

### Tema claro/escuro

O tema é o atributo `data-theme` (`light` ou `dark`) no `<html>`, definido por um script minúsculo no `<head>` (`lib/tema.ts`) antes da página aparecer, o que evita o "piscar". A escolha do usuário fica no `localStorage` (chave `tema`, valores `claro` ou `escuro`). Sem escolha salva, vale a preferência do sistema. As cores estão como variáveis CSS em `app/globals.css` (`:root` para o claro e `:root[data-theme="dark"]` para o escuro). Para mudar a paleta, edite só esse arquivo.

### Formatação e idioma

Todo o texto da interface, as mensagens de erro e os comentários do código estão em **português do Brasil**. Datas usam o fuso `America/Sao_Paulo`.

## 15. Plano gratuito: limites e cuidados

| Limite | Como o site lida com isso |
|---|---|
| **Supabase: 1 GB de arquivos** | Slide como link, fotos reduzidas, PDF limitado a 5 MB, substituir apaga o antigo, medidor no painel |
| **Supabase: 500 MB de banco** | O banco guarda só texto e é minúsculo perto disso. O medidor mostra o uso. |
| **Supabase pausa o projeto após cerca de 1 semana sem uso** | O **Vercel Cron** chama `/api/cron/manter-ativo` todo dia às 09:00 UTC, e o site consulta o banco. Isso mantém o projeto ativo nas férias. |
| **Vercel: corpo de requisição de cerca de 4,5 MB** | Os arquivos vão direto do navegador ao Supabase |
| **Tamanho mínimo de senha do Supabase: 6** | A senha inicial é completada com números quando o e-mail é curto |

### Backup

O site **ainda não tem** botão de backup. Não conte com backups automáticos no plano gratuito. Recomendação: de tempos em tempos, guarde uma cópia do banco com `pg_dump` (a *connection string* está em Supabase › Project Settings › Database). Atenção: o `pg_dump` cobre os **dados do banco**, mas **não os arquivos** (PDFs e fotos), que ficam no Storage e precisam ser baixados à parte.

## 16. Solução de problemas

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| **Internal Server Error** na Vercel | Variáveis de ambiente ausentes ou sem **Production** marcado | Abra `/api/saude`, corrija as variáveis e faça **Redeploy** |
| Build da Vercel: *No Output Directory named "public"* | Framework não detectado | Confirme `"framework": "nextjs"` no `vercel.json` e **Root Directory vazio** |
| *Esta conta ainda não tem perfil no site* | Login existe no Supabase, mas sem linha em `perfil` | Rode o SQL do primeiro professor (seção 12), ou cadastre a conta pelo painel |
| *Esta conta está desativada* | Conta desativada no painel | **Reativar** em Painel › Alunos |
| Aluno diz que a senha "não funciona" | A senha inicial é só a parte antes do `@`, completada com números se tiver menos de 6 caracteres | Confira na tabela de cadastro, ou use **Redefinir senha** |
| Foto: *mime type image/webp is not supported* | O bucket `fotos` não aceita WebP | Rode `20261108050000_bucket_fotos.sql` |
| Foto de iPhone não envia | Formato **HEIC** | Enviar como JPG ou PNG (no iPhone: Ajustes › Câmera › Formatos › Mais compatível) |
| *Para publicar, envie o documento em PDF e o link do slide* | Falta PDF ou link | Preencher o que faltou na tela de edição |
| Slide não abre para o público | Compartilhamento do slide está restrito | Compartilhar como **"qualquer pessoa com o link"** |
| Medidor mostra *"Não foi possível medir o armazenamento agora"* | A migração nº 6 não foi rodada (falta a função `uso_armazenamento`) | Rodar `20261108040000_semestre_link_medidor.sql` |
| Mural mostra um ano sem projetos | O ano existe, mas está vazio | Normal. Remova em **Anos letivos** se foi engano. |
| Mudou variável na Vercel e nada mudou | A Vercel só lê as variáveis em um novo deploy | **Redeploy** |
| Supabase "pausado" | Ficou muito tempo sem uso | Em supabase.com, clique em **Restore**. Confira se o cron está ativo na Vercel (Settings › Cron Jobs). |

**Ferramentas de diagnóstico**
- `/api/saude` mostra quais variáveis existem (sem valores) e se o banco responde.
- Vercel › projeto › **Logs** mostra erros do servidor.
- Console do navegador (F12) mostra erros do envio de fotos e de PDF, com a etapa em que falhou.

## 17. Decisões de projeto

Para quem for evoluir o site, o porquê de algumas escolhas:

| Decisão | Motivo |
|---|---|
| **Sem login para ver o mural** | O site é para a escola mostrar os trabalhos |
| **Contas criadas só pelo professor** | A escola controla quem escreve. Não há cadastro aberto. |
| **Senha inicial = parte do e-mail antes do `@`** | Facilita a entrega e o primeiro acesso numa sala inteira. Por isso a **troca é obrigatória** logo no 1º acesso. |
| **Sem verificação de e-mail** | Pedido da escola: só o formato precisa ser válido. Nenhum e-mail é enviado. |
| **Sem revisão do professor antes de publicar** | Os documentos são melhorados ao longo do ano, e o professor pode ocultar depois |
| **Rascunhos só para a sala e professores** | Trabalho em andamento não vira público sem querer |
| **Aluno edita qualquer projeto da própria sala** | Trabalho em grupo: qualquer colega pode continuar. O rodapé mostra quem editou por último. |
| **Semestre em vez de bimestre** | Cada grupo tem um projeto que vai sendo atualizado ao longo do ano. O bimestre não fazia mais sentido. |
| **Slide como link** | O slide era o arquivo mais pesado (~70% do espaço). Como link, não consome nada do armazenamento. |
| **Pastas por ano › série › turma** | Facilita a navegação e comporta os anos anteriores sem poluir a tela |
| **RLS no banco** | Segurança que não depende da interface: vale mesmo se alguém chamar a API direto |
| **Upload direto ao Storage** | Contorna o limite de ~4,5 MB das funções da Vercel |
| **Compressão de foto no navegador** | O servidor nunca recebe a foto grande, e o espaço de 1 GB rende |
| **Vercel + Supabase (plano gratuito)** | Custo zero e já conhecidos pela equipe em projetos anteriores |

## 18. Limitações conhecidas

- **Sem backup automático** nem botão de "baixar cópia de segurança".
- **Sem recuperação de senha por e-mail.** O professor redefine a senha pelo painel.
- **Sem comentários e sem prazos de entrega** (deixados para uma fase futura).
- **Sem legenda de foto na interface**, embora a coluna exista no banco.
- **Sem busca no mural** (a busca existe no banco, mas a tela atual navega só por pastas).
- **Nomes completos** de autores aparecem no rodapé público (veja a [seção 10](#10-segurança-e-privacidade)).
- **Colunas legadas** (`projeto.bimestre`, `projeto.tipo`, `documento.bimestre`) continuam no banco sem uso.
- O medidor mede o que está no Storage e no banco. Não mede o tráfego mensal de saída do Supabase.
