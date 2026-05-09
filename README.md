<div align="center">

# 💸 fluxPay

### Controle financeiro pessoal — futurista, gratuito e open

[![Vue](https://img.shields.io/badge/Vue-3.5-42b883?logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Vuetify](https://img.shields.io/badge/Vuetify-3-1867C0?logo=vuetify&logoColor=white)](https://vuetifyjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![PWA](https://img.shields.io/badge/PWA-ready-5A0FC8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![License: MIT](https://img.shields.io/badge/License-MIT-00BAB4.svg)](LICENSE)

App de finanças pessoais com visual cyberpunk, score de saúde financeira, sugestões automáticas e tudo dentro do plano gratuito do Firebase.

</div>

---

## ✨ O que ele faz

### 📊 Dashboard

- **Resumo do mês** com 4 cards (a pagar, a receber, saldo, vencidas) com **mini sparklines** dos próximos 6 meses
- **Dinheiro do mês vigente** — saldo somado das contas correntes
- **Patrimônio guardado** — total investido (CDB, Tesouro, Poupança, Ações, Cripto, etc.)
- **Mini score de saúde financeira** — 0–100 num gauge, clicável pra ver o detalhe
- **Gráfico de fluxo** dos próximos 6 meses (linha com gradient + glow + crosshair) com animação progressiva
- **Donut futurista** de pago vs pendente vs vencido
- **Top 5 orçamentos** com progresso e status
- **Próximos vencimentos** dos próximos 6 meses

### 🧠 Análise (nova)

Página dedicada `/analise` com:

- **Score de saúde financeira** num gauge SVG circular grande, com breakdown dos 5 fatores avaliados:
  - Reserva de emergência (até 25 pts)
  - Saldo do mês (até 20 pts)
  - Pagamentos em dia (até 15 pts)
  - Orçamentos respeitados (até 20 pts)
  - Tendência do patrimônio (até 20 pts)
  - Classificação: **Crítico** (0-30) → **Atenção** (31-60) → **Bom** (61-80) → **Excelente** (81-100)
- **Comparativo mês a mês** — receber, pagar, gastos e saldo com seta de tendência e % de variação (cor inteligente: receita subindo = verde, gastos subindo = vermelho)
- **Top 5 maiores gastos do mês** — une gastos avulsos + contas a pagar, ranqueado por valor
- **Sugestões e alertas** baseados em padrões:
  - "Categoria X disparou" se aumentou ≥25% vs mês passado
  - "Maior fatia: Y" quando uma categoria pega ≥30% dos gastos
  - "Orçamento estourado" com diferença em R$
  - "Está gastando menos" se gastos caíram ≥10%
  - "Saldo do mês negativo" com valor exato
  - "Construa sua reserva" se reserva de emergência baixa

### 💰 Contas a pagar e a receber

- CRUD completo com filtro por status
- Categorias customizáveis ou predefinidas
- Vinculação opcional a uma meta
- **Recorrência automática**: cria 1 a 60 ocorrências (semanal, mensal, anual) num clique, com indicador 🔁 na lista e opção "excluir série inteira"
- **Tags livres** além de categoria — combobox com chips, exibidas como `#tag` na lista
- **Detecção de duplicidade**: alerta ao salvar lançamento idêntico criado nos últimos 5 min (descrição + valor + data)
- Marcar como pago/recebido com 1 toque
- Indicadores visuais de status com chips coloridos
- Importação e exportação Excel (.xlsx) ou CSV com filtro de período

### 🛒 Gastos avulsos

- Registro rápido de despesas do dia a dia (almoço, Uber, mercado, etc.)
- 3 cards de stats: gasto do mês, hoje, média diária
- **Hero da conta corrente** com saldo + estimativa após gastos
- 11 categorias predefinidas com cores próprias (Alimentação, Mercado, Transporte, Saúde, Educação, etc.)
- Tags livres + detecção de duplicidade

### 🏦 Patrimônio

- Cadastro de aplicações por tipo: Conta Corrente, Poupança, CDB/RDB/LCI, Tesouro, Fundos, Ações, Cripto, Espécie
- Hero com total investido em gradient + barra de distribuição por tipo
- Rendimento (% a.a.) opcional por aplicação
- **Gráfico de evolução** mês a mês — snapshots automáticos do patrimônio (criados na primeira visita do mês)

### 🎯 Metas de projetos

- Cadastre objetivos (viagem, reserva, troca de carro) com valor alvo + prazo
- Vincule transações à meta — o progresso é calculado automaticamente
- Trilho de progresso glow com bolinha pulsante
- Customize cor + ícone

### 📈 Orçamento por categoria

- Limite mensal por categoria (gastos avulsos, contas a pagar ou ambos)
- Indicador visual: 0–70% verde, 70–100% laranja, >100% vermelho
- **Toast de alerta** ao registrar lançamento que ultrapassa o limite
- Widget no Dashboard com top 5 mais consumidos

### ⚙ Outras features

- 🌗 **Tema claro / escuro / sistema** (segue preferência do SO)
- 👁 **Modo privacidade** — botão olho borra todos os valores monetários
- 📅 **Dia de início do mês personalizável** (alinha com salário)
- 📥 **Exportar tudo em Excel** (.xlsx multi-aba) ou ZIP de CSVs com filtro de período
- 📤 **Importar CSV** com preview de validação
- 🏷 **Categorias customizadas** (cor + ícone próprios)
- 🗑 **Limpar dados** ou **excluir conta** com confirmação dupla + re-auth
- 📱 **PWA instalável** com service worker e funcionamento offline
- 📲 **FAB de "novo"** flutuante em mobile, contextual à tela atual
- 🔔 **Toast notifications** pra todas as ações
- 💀 **Skeleton loaders** durante carregamento

---

## 🛠 Stack

| Camada | Tecnologia |
|---|---|
| **Framework** | Vue 3 + Composition API + `<script setup>` |
| **Build** | Vite + TypeScript |
| **UI** | Vuetify 3 (Material Design 3) |
| **State** | Pinia (setup stores) |
| **Router** | Vue Router 4 |
| **Auth** | Firebase Authentication (Google Sign-In) |
| **Database** | Cloud Firestore (subcoleções por usuário) |
| **Hosting** | Firebase Hosting |
| **Charts** | Chart.js + vue-chartjs (linhas, donut, sparklines SVG, gauge) |
| **Datas** | date-fns |
| **Export** | ExcelJS + JSZip (lazy-load) |
| **PWA** | vite-plugin-pwa (Workbox) |
| **Tipografia** | Inter (corpo) + Space Grotesk (títulos/números) |

---

## 🎨 Design

Tema "flux" inspirado em dashboards cyberpunk:

| Função | Cor |
|---|---|
| Background | `#0F1023` (azul-noite profundo) |
| Surface | `#2D2E47` translúcido (glassmorphism) |
| Primary (CTAs, ativos) | `#00BAB4` (turquesa) |
| Success (recebido / pago) | `#069E6E` (esmeralda) |
| Accent | `#3E7996` / `#2F6C82` (azul aço / petróleo) |
| Warning | `#F4A261` (âmbar) |
| Error / despesa | `#FF4D6D` (rosa coral) |

Efeitos visuais: glassmorphism com `backdrop-filter`, gradientes radiais ambientes nos cantos, glow nos cards e charts, números em monoespaçada Space Grotesk com `font-feature-settings: 'tnum'`.

---

## 🚀 Como rodar localmente

### Pré-requisitos

- **Node.js** 20+ ([download](https://nodejs.org/))
- **Conta Google** (pra autenticar)
- **Projeto Firebase** próprio (gratuito — plano Spark)

### 1. Clone e instale

```bash
git clone https://github.com/Lilarodrigues85/fluxPay.git
cd fluxPay
npm install
```

### 2. Crie o projeto Firebase

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Crie um novo projeto
3. Em **Build → Authentication → Sign-in method**, habilite **Google**
4. Em **Build → Firestore Database**, crie em modo `production` (região recomendada: `southamerica-east1`)
5. Em **Project Settings → General**, registre um app **Web** e copie o `firebaseConfig`

### 3. Configure as variáveis de ambiente

Copie o exemplo e cole as chaves do seu projeto:

```bash
cp .env.example .env.local
```

Edite `.env.local` com seus valores:

```bash
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:xxxxxxxxxxxx
```

### 4. Rode o servidor de desenvolvimento

```bash
npm run dev
```

Abra `http://localhost:5173` e faça login com sua conta Google.

---

## ☁️ Deploy no Firebase Hosting

### Setup (uma vez)

```bash
npm install -g firebase-tools
firebase login
firebase use --add  # selecione seu projeto
```

Edite `.firebaserc` com o ID do seu projeto:

```json
{
  "projects": {
    "default": "seu-projeto-id"
  }
}
```

### Build e deploy

```bash
npm run deploy
```

Esse comando faz `npm run build` e em seguida `firebase deploy`, publicando:

- `dist/` no **Firebase Hosting**
- `firestore.rules` (regras de segurança) no **Firestore**

Pra deployar só uma parte:

```bash
firebase deploy --only hosting
firebase deploy --only firestore:rules
```

Após o deploy, o app fica disponível em `https://seu-projeto.web.app`.

---

## 📂 Estrutura do projeto

```text
fluxPay/
├── public/                        # ícones PWA + favicon
├── src/
│   ├── components/
│   │   ├── common/                # AppToast, ExportDialog, ImportDialog, Sparkline
│   │   ├── layout/                # AppLayout (AppBar + NavigationDrawer + FAB mobile)
│   │   ├── dashboard/             # SummaryCards, CashflowChart, BudgetsCard, NetWorthCard,
│   │   │                          # CheckingCard, PaymentStatusDonut, UpcomingList
│   │   ├── insights/              # HealthScoreCard, HealthScoreMini,
│   │   │                          # MonthComparisonCard, TopExpensesCard, SuggestionsCard
│   │   ├── transactions/          # TransactionDialog (com recorrência + tags + duplicidade),
│   │   │                          # TransactionTable
│   │   ├── expenses/              # ExpenseDialog, ExpenseTable
│   │   ├── savings/               # SavingsDialog, SavingsCard, NetWorthHistory
│   │   ├── projects/              # ProjectDialog, ProjectCard
│   │   └── settings/              # CategoriesManager, BudgetsManager
│   ├── views/                     # Login, Dashboard, Payable, Receivable, Expenses,
│   │                              # Savings, Projects, Insights, Settings
│   ├── stores/                    # auth, transactions, expenses, savings, projects,
│   │                              # categories, budgets, snapshots, preferences, toast
│   ├── services/                  # firebase config + Firestore CRUD por entidade
│   ├── types/                     # interfaces TypeScript
│   ├── utils/                     # currency, dates, savings, exportExcel, importCsv,
│   │                              # duplicates, insights
│   ├── plugins/                   # vuetify (tema flux + flux-light)
│   ├── router/                    # rotas + guard de auth
│   ├── App.vue                    # raiz: monta v-app, AppToast, watchers de auth e tema
│   ├── main.ts                    # bootstrap (aguarda auth resolver antes de mountar)
│   └── style.css                  # CSS vars + glassmorphism + privacy mode
├── firestore.rules                # regras de segurança Firestore
├── firestore.indexes.json
├── firebase.json                  # hosting + firestore + headers COOP
├── .firebaserc
├── .env.example                   # template (sem chaves reais)
├── .gitignore
├── vite.config.ts                 # plugins Vue, Vuetify, PWA + headers dev
├── tsconfig*.json
└── package.json
```

---

## 🔐 Modelo de dados (Firestore)

Tudo é **single-tenant por usuário**: cada usuário só lê/escreve embaixo da própria subárvore.

```text
users/{uid}                        # perfil: displayName, email, photoURL, settings
├── transactions/{id}              # contas a pagar e receber (campo `type`, `recurring`, `tags`)
├── expenses/{id}                  # gastos avulsos (campo `tags`)
├── savings/{id}                   # patrimônio (conta corrente, CDB, etc.)
├── projects/{id}                  # metas
├── categories/{id}                # categorias customizadas
├── budgets/{id}                   # orçamentos por categoria
└── networthSnapshots/{yyyy-mm}    # histórico mensal do patrimônio
```

### Regras de segurança

```text
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
  match /{document=**} {
    allow read, write: if request.auth != null && request.auth.uid == userId;
  }
}
```

---

## 🧪 Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (porta 5173) |
| `npm run build` | Type-check + build de produção em `dist/` |
| `npm run preview` | Preview local do build (porta 4173) |
| `npm run type-check` | Apenas verificação TypeScript |
| `npm run deploy` | Build + deploy no Firebase |

---

## 💡 Compatível com plano Spark (gratuito)

Tudo funciona dentro do plano gratuito do Firebase:

- ✅ Authentication (Google Sign-In)
- ✅ Cloud Firestore (1 GB armazenamento, 50k leituras/dia)
- ✅ Hosting (10 GB armazenamento, 360 MB/dia transferência)

**O que NÃO usa:** Cloud Storage (anexos de comprovante), Cloud Functions, Cloud Messaging.
Por isso o app não tem upload de imagens/PDFs nem push notifications nativas — é uma escolha consciente de continuar gratuito.

---

## 🔒 Segurança & privacidade

- **Single-user**: o app foi pensado pra uso pessoal individual. As regras do Firestore travam tudo em `request.auth.uid == userId` — ninguém vê dados de outro usuário.
- **`.env.local` nunca commitado**: o `.gitignore` exclui qualquer arquivo `.env*` exceto o `.env.example`.
- **API key do Firebase é pública por design** (vai pro bundle do client de qualquer jeito) — o que protege o acesso são as regras do Firestore + restrições de domínio no Console.
- **Modo privacidade**: borra todos os valores quando você compartilha tela / faz screenshot.
- **Service accounts e credenciais administrativas** são bloqueadas no `.gitignore` (`*serviceAccount*.json`, `firebase-adminsdk-*.json`).
- **Detecção de duplicidade**: protege contra cliques acidentais que criariam o mesmo lançamento duas vezes.

---

## 🗺 Roadmap

Ideias futuras (não implementadas):

- [ ] Importar OFX (extratos bancários)
- [ ] Transferência entre contas (sair de uma savings, entrar em outra)
- [ ] Calendar feed (.ics) com vencimentos no Google Agenda
- [ ] Parcelamento automático (1/12, 2/12, ...)
- [ ] Notificações push (FCM) — exige plano Blaze
- [ ] Conta familiar / compartilhada (multi-usuário)
- [ ] Atalhos de teclado + comando palette (Ctrl+K)
- [ ] Multi-moeda com cotação automática
- [ ] Reconciliação de extrato bancário

---

## 📄 Licença

Distribuído sob a [Licença MIT](LICENSE). Sinta-se livre pra fazer fork, adaptar à sua realidade
e usar como referência — só mantenha o crédito.

---

<div align="center">

Feito com ☕ e Vue 3.

</div>
