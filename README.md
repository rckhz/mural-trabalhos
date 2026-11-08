# Mural de Trabalhos — ETEC Dra. Ruth Cardoso

Site onde os projetos das turmas ficam publicados durante o ano letivo. Qualquer pessoa pode ver o mural sem login. Os alunos enviam e atualizam os trabalhos da própria sala, e os professores administram as contas e o conteúdo.

---

## Como o site funciona

### Mural (público, sem login)

O mural é organizado em pastas:

```
Mural
└── 2026
    ├── 1º ano
    │   ├── MIL  → projetos do 1º MIL
    │   └── MIN  → projetos do 1º MIN
    ├── 2º ano
    └── 3º ano
```

Cada pasta mostra quantos projetos publicados há dentro dela. Ao abrir um projeto, a pessoa vê:

- o **documento** (PDF) na própria página;
- o botão **Abrir slide**, que leva ao link da apresentação;
- a **descrição** e as **fotos** do trabalho;
- no rodapé, **quem criou** e **quem editou por último**. Esses nomes são gravados pelo sistema e ninguém consegue alterá-los.

### Tipos de conta

| Conta | O que pode fazer |
|---|---|
| **Visitante** (sem login) | Ver o mural e os projetos publicados |
| **Aluno** | Criar e editar projetos **somente da própria sala**, enviar arquivos e fotos, publicar ou voltar para rascunho |
| **Professor** | Tudo: criar contas, administrar turmas e anos, editar, ocultar e excluir qualquer projeto |

Projetos em **rascunho** só são vistos pela própria sala e pelos professores. Projetos **ocultos** saem do mural e a sala não pode editá-los. Só um professor oculta ou devolve um projeto.

### Cada projeto

- Pertence a **uma turma** e a **um semestre** (1º ou 2º). Em geral, cada grupo tem um projeto e vai atualizando ao longo do ano.
- Precisa de **2 itens obrigatórios** para ser publicado:
  - **Documento em PDF** (até 5 MB): aparece na tela do mural;
  - **Link do slide** (Google Apresentações, Canva, OneDrive...). Como é só um link, **não ocupa espaço** no site. O slide precisa estar compartilhado como "qualquer pessoa com o link".
- Pode ter fotos. O próprio site reduz cada foto antes de enviar, para no máximo 1 MB.
- O PDF pode ser **substituído** a qualquer momento. A versão antiga é apagada para economizar espaço.

---

## Guia rápido para professores

Tudo fica em **Painel do professor**: na página inicial, clique em "Sou professor" e entre com sua conta.

### Começo do ano letivo

1. **Painel › Anos letivos:** digite o ano e clique em **"Criar ano com as 6 turmas"**. O ano aparece como pasta no mural, já com 1º, 2º e 3º ano (MIL e MIN) dentro.
2. **Painel › Alunos:** escolha o ano e a turma, cole a lista de alunos e clique em **Cadastrar**.

### Cadastrar contas

Uma linha por pessoa, no formato `Nome; e-mail`. Também dá para colar duas colunas de uma planilha:

```
Ana Souza; ana.souza@email.com
Bruno Lima; bruno.lima@email.com
```

- Escolha **Aluno**, e informe ano, turma e ano letivo, ou **Professor**. Conta de professor não fica em turma e tem acesso total.
- A **senha inicial** é o que vem antes do @ do e-mail. Ex.: `ana.souza@email.com` → `ana.souza`. Se tiver menos de 6 caracteres, o site completa com números: `ana@email.com` → `ana123`.
- No primeiro acesso, a pessoa é obrigada a criar uma senha própria.
- Depois de cadastrar, a tabela com as senhas pode ser **copiada** ou **impressa** para entregar à turma.
- O e-mail não precisa ser verificado. Basta estar num formato válido.

### Outras ações na tela Alunos

| Ação | Para quê |
|---|---|
| **Redefinir senha** | Aluno esqueceu a senha: ela volta a ser a inicial |
| **Desativar / Reativar** | Bloqueia o acesso sem apagar nada |
| **Interruptor de administrador** | Dá ou tira o acesso de professor de uma conta |
| **Remover** | Apaga a conta de vez. Os projetos continuam no mural. |

Ninguém consegue remover a própria conta nem tirar o próprio acesso de administrador. Isso garante que o site nunca fique sem professor.

### Armazenamento

Na página inicial do painel, o quadro **Armazenamento** mostra quanto do espaço gratuito já foi usado: 1 GB para arquivos e 500 MB para o banco. A barra fica **amarela** a partir de 70% e **vermelha** a partir de 90%.

Se aparecerem **arquivos soltos**, que são sobras de envios antigos que nenhum projeto usa mais, o botão **Limpar** apaga esses arquivos sem afetar nenhum projeto.

### Anos anteriores

Os anos antigos continuam como pastas no mural. Um ano só pode ser removido se estiver **vazio**, sem projetos e sem contas. Isso serve para corrigir um ano criado por engano.

---

## Parte técnica (para quem for manter o site)

### Tecnologias

- **Next.js 16** (App Router), **React 19** e **TypeScript**
- **Tailwind CSS 4** e componentes **shadcn/ui**, com tema claro e escuro
- **Supabase**: banco Postgres, login (Auth) e armazenamento de arquivos (Storage)
- **Vercel**: hospedagem, com deploy automático a cada `git push` na branch `main`

### Segurança

As permissões ficam no **próprio banco**, com Row Level Security (RLS), e não só nas telas. Mesmo que alguém chame a API direto, um aluno não consegue mexer em projetos de outra sala, e um visitante não consegue ver rascunhos. Os arquivos ficam em buckets **privados**, e o site gera links temporários (1 hora) para exibi-los.

A chave `SUPABASE_SERVICE_ROLE_KEY` dá acesso total ao banco. Ela é usada só no servidor, para criar e remover contas, e **nunca** deve:
- ter o prefixo `NEXT_PUBLIC_`, porque ele a expõe no navegador;
- ser enviada para o GitHub. O `.gitignore` já ignora os arquivos `.env*`.

### Variáveis de ambiente

Veja o arquivo [.env.example](.env.example).

| Variável | Onde achar | Tipo na Vercel |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase › Project Settings › API › Project URL | comum |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase › Project Settings › API › chave `anon` / publishable | comum |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase › Project Settings › API › chave `service_role` / secret | **Sensitive** |
| `CRON_SECRET` | Qualquer texto longo e aleatório, inventado por você | **Sensitive** |

Na Vercel, as variáveis precisam estar marcadas para **Production**. Depois de alterar alguma, é preciso fazer **Redeploy**.

### Banco de dados

Os arquivos em [supabase/migrations/](supabase/migrations/) devem ser rodados **na ordem do nome**, no **SQL Editor** do Supabase:

| Arquivo | O que faz |
|---|---|
| `20261107000000_esquema_inicial.sql` | Tabelas, permissões (RLS), buckets de arquivos e as turmas de 2026 |
| `20261108000000_projeto_por_bimestre.sql` | Cada projeto passa a pertencer a um bimestre |
| `20261108010000_autoria_publica.sql` | Grava quem criou e quem editou por último |
| `20261108020000_ano_2025.sql` | Cria o ano de 2025 com as 6 turmas |
| `20261108030000_documento_e_slide.sql` | Documento + slide por projeto (substituída pela próxima) |
| `20261108040000_semestre_link_medidor.sql` | Projeto por semestre, slide como link, 1 PDF por projeto e o medidor de armazenamento |
| `20261108050000_bucket_fotos.sql` | Garante que o bucket de fotos aceite WebP, o formato que o site usa |

**Primeiro professor** (só numa instalação nova):

1. Supabase › **Authentication › Users › Add user**, marcando **Auto Confirm User**.
2. No SQL Editor:
   ```sql
   insert into public.perfil (id, nome, funcao, deve_trocar_senha)
   select id, 'Nome do Professor', 'professora', false
   from auth.users where lower(email) = lower('email-do-professor@exemplo.com');
   ```

Os demais professores podem ser criados pelo próprio site, em **Painel › Alunos › Professor**.

### Rodar no computador

Requisito: Node.js 20 ou mais novo.

```bash
npm install
cp .env.example .env.local   # e preencha as variáveis
npm run dev                  # abre em http://localhost:3000
```

Antes de enviar mudanças, confira se o projeto compila:

```bash
npm run build
```

### Estrutura de pastas

```
app/
├── page.tsx               página inicial ("Sou aluno" / "Sou professor")
├── mural/                 mural público em pastas (ano › série › turma)
├── projeto/[id]/          página pública do projeto
│   └── editar/            edição: dados, arquivos, fotos e situação
├── entrar/, trocar-senha/ login e troca de senha no 1º acesso
├── sala/                  área do aluno (projetos da própria sala)
├── painel/                área do professor
│   ├── alunos/            contas (cadastro, senha, administrador, remover)
│   ├── projetos/          projetos de cada turma
│   └── anos/              anos letivos
└── api/
    ├── saude/             diagnóstico: variáveis configuradas e conexão com o banco
    └── cron/manter-ativo/ acesso diário para o Supabase gratuito não pausar
components/                componentes visuais (ui/ = shadcn)
lib/                       sessão, ações do servidor, clientes do Supabase
supabase/migrations/       scripts SQL do banco
proxy.ts                   renova a sessão de login a cada acesso
```

### Plano gratuito: limites importantes

| Limite (Supabase Free) | Como o site lida com isso |
|---|---|
| **1 GB** de arquivos | PDF até 5 MB, slide como link (0 MB), fotos reduzidas para até 1 MB; substituir um arquivo apaga o antigo; medidor no painel |
| **Pausa após 7 dias sem uso** | Um acesso automático diário (Vercel Cron em [vercel.json](vercel.json)) mantém o projeto ativo |
| Backups do plano gratuito não podem ser baixados | Recomenda-se guardar uma cópia do banco de tempos em tempos (por exemplo, com `pg_dump`) |

Para conferir se o site está bem configurado, acesse `/api/saude`. Ele mostra quais variáveis existem, **sem mostrar os valores**, e se o banco responde.
