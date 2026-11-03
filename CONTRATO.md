# Contrato entre o front e o back-end

Para quem vai integrar o `ecosync-frontend` à API. A primeira parte lista os endpoints, e a segunda, o que precisa mudar no front, arquivo por arquivo.

## Regras gerais

- **Base:** `/api`, na mesma origem do front. Não há CORS.
- **Sessão:** cookie HttpOnly `ecosync_sessao`, gravado pelo login. O JavaScript não o lê, e o `fetch` o envia sozinho na mesma origem.
- **Dono dos dados:** vem sempre da sessão. Enviar `usuario_id` ou `usuarioId` retorna 400. Recurso de outro usuário retorna 404.
- **Campos desconhecidos** no corpo ou na query retornam 400.
- **Datas:** ISO 8601 em UTC. O "dia" é calculado em America/Sao_Paulo.

### Formato de erro

Todo erro tem este formato, com mensagem em pt-BR que pode ser mostrada ao usuário:

```json
{ "erro": { "codigo": "VALIDACAO", "mensagem": "O nome é obrigatório." } }
```

| Status | Quando | `codigo` |
| --- | --- | --- |
| 400 | Dados inválidos | `VALIDACAO`, `REQUISICAO_INVALIDA`, `SENHA_INCORRETA` |
| 401 | Sem sessão válida ou login recusado | `NAO_AUTENTICADO`, `CREDENCIAIS_INVALIDAS` |
| 404 | Não existe, foi removido ou é de outro usuário | `NAO_ENCONTRADO` |
| 409 | Conflito | `EMAIL_EM_USO`, `AMBIENTE_DUPLICADO`, `AMBIENTE_COM_DISPOSITIVOS` |
| 429 | Excesso de tentativas de login | `MUITAS_TENTATIVAS` |
| 500 | Erro inesperado | `ERRO_INTERNO` |

## Endpoints

### Autenticação

| Método e rota | Corpo | Sucesso |
| --- | --- | --- |
| `POST /api/auth/login` (pública) | `{ email, senha }` | 200 `Usuario`, grava o cookie |
| `POST /api/auth/logout` (pública) | | 204, apaga o cookie |

### Usuários

`Usuario = { id, nome, email }`

| Método e rota | Corpo | Sucesso |
| --- | --- | --- |
| `POST /api/usuarios` (pública) | `{ nome, email, senha }` (senha de 6 a 128 caracteres) | 201 `Usuario` (não faz login) |
| `GET /api/usuarios/me` | | 200 `Usuario` |
| `PATCH /api/usuarios/me` | `{ nome?, email?, senhaAtual?, novaSenha? }` (`novaSenha` exige `senhaAtual`) | 200 `Usuario` |
| `DELETE /api/usuarios/me` | `{ senha }` | 204, encerra a sessão |

### Ambientes

`Ambiente = { id, nome }`

| Método e rota | Corpo | Sucesso |
| --- | --- | --- |
| `POST /api/ambientes` | `{ nome }` | 201 `Ambiente` |
| `GET /api/ambientes` | | 200 `Ambiente[]` |
| `GET /api/ambientes/:id` | | 200 `Ambiente` |
| `PATCH /api/ambientes/:id` | `{ nome }` | 200 `Ambiente` |
| `DELETE /api/ambientes/:id` | | 204, ou 409 se houver dispositivos ativos |

### Dispositivos

```ts
type Dispositivo = {
  id: number
  nome: string
  comodo: string
  ambienteId: number
  tipo: 'luz' | 'climatizacao' | 'eletro' | 'entretenimento'
  ligado: boolean
  potenciaWatts: number
  consumo: number // média de kWh/dia nos últimos 7 dias, calculada pela API
}
```

| Método e rota | Corpo | Sucesso |
| --- | --- | --- |
| `POST /api/dispositivos` | `DadosDispositivo` | 201 `Dispositivo` |
| `GET /api/dispositivos` | | 200 `Dispositivo[]`, por nome |
| `GET /api/dispositivos/:id` | | 200 `Dispositivo` |
| `PUT /api/dispositivos/:id` | `DadosDispositivo` | 200 `Dispositivo` |
| `PATCH /api/dispositivos/:id/estado` | `{ ligado: boolean }` | 200 `Dispositivo`; repetir o mesmo estado não tem efeito |
| `DELETE /api/dispositivos/:id` | | 204; fecha a sessão aberta e preserva o histórico |

`DadosDispositivo = { nome, comodo, tipo, potenciaWatts }`, todos obrigatórios. `nome` e `comodo` têm até 50 caracteres, e `potenciaWatts` vai de 0,01 a 100000, com até 2 casas decimais. O ambiente é encontrado pelo nome, sem diferenciar maiúsculas, ou criado.

### Histórico (somente leitura)

`GET /api/historico?dispositivoId=&de=&ate=&pagina=&limite=`, todos opcionais. `pagina` começa em 1, e `limite` tem padrão 20 e máximo de 100. `de` e `ate` aceitam `AAAA-MM-DD` (o dia inteiro em São Paulo) ou um instante com fuso (`2026-10-29T18:00:00-03:00`). Parâmetro vazio (`de=`) retorna 400: omita o que não for usar.

```ts
type PaginaHistorico = {
  itens: {
    id: number
    dispositivoId: number
    dispositivoNome: string
    comodo: string
    ligadoEm: string
    desligadoEm: string | null // null enquanto estiver ligado
    consumoKwh: number | null // null enquanto estiver ligado
  }[]
  pagina: number
  limite: number
  total: number
  totalPaginas: number
}
```

### Dashboard

`GET /api/dashboard` retorna:

```ts
type Indicador = { valor: number | null; variacao: number | null }

type DadosDashboard = {
  resumo: {
    consumoHoje: Indicador
    custoMes: Indicador
    economiaMes: Indicador // valor negativo significa que o mês está custando mais
  }
  consumoSemana: { dia: string; real: number | null; previsto: number | null }[] // sempre Seg a Dom
  consumoPorTipo: { nome: string; valor: number }[] | null // valor em %
  consumoPorComodo: { comodo: string; kwh: number }[] | null
  recomendacao: { titulo: string; texto: string } | null
}
```

`null` significa "ainda não há histórico suficiente". As regras de cada campo estão na seção Dashboard do [README](README.md).

## O que precisa mudar no front

Estas mudanças já foram aplicadas no `ecosync-frontend`. A lista fica como registro do que a integração envolveu.

### 1. Proxy do Vite

Em `vite.config.ts`:

```ts
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:3000' } },
})
```

### 2. Dispositivo ganha potência e o tipo entretenimento

- **`src/types/Dispositivo.ts`:** usar o tipo `Dispositivo` acima, com `potenciaWatts`, `ambienteId` e `'entretenimento'`.
- **`src/pages/Admin.tsx`:**
  - O formulário passa a pedir **Potência (W)** em vez de "Consumo (kWh/dia)". O estado `consumo` e sua validação viram `potenciaWatts`, que deve ser maior que zero.
  - Incluir `entretenimento` em `tiposAdmin` e `nomesTipo`.
  - A coluna da tabela pode seguir mostrando `consumo`, agora calculado pela API e somente leitura.
- **`src/pages/Dispositivos.tsx`:** incluir `entretenimento` nos filtros de `tipos`.
- **`src/pages/Dashboard.tsx`:** `coresTipo` tem 3 cores e agora são até 4 tipos. Sem uma quarta cor, a fatia e a legenda de Entretenimento ficam sem cor.

### 3. Campos do dashboard aceitam null

- **`src/types/Dashboard.ts`:** usar o tipo `DadosDashboard` acima.
- **`src/pages/Dashboard.tsx`:**
  - `resumo.*.valor.toLocaleString()` e `moeda(...)` quebram com `null`. Mostre "Sem dados" nesses casos.
  - `Math.max(...consumoPorComodo.map(...))` e os `.map` de `consumoPorTipo` e `consumoPorComodo` quebram com `null`. Mostre um estado vazio.
  - `recomendacao` pode ser `null`: esconda o texto da dica ou mostre uma mensagem neutra.
  - `economiaMes.valor` pode ser negativo.
- **`src/components/Card.tsx`:** trocar `variacao?: number` por `variacao?: number | null`, e `variacao !== undefined` por `variacao != null` nos dois lugares. Sem isso, `null` aparece como "↓ 0%", um valor inventado.

### 4. Services chamam a API e as telas tratam erros de rede

Sugestão de auxiliar único, `src/services/api.ts`:

```ts
export class ErroApi extends Error {
  constructor(public status: number, public codigo: string, mensagem: string) {
    super(mensagem)
  }
}

export async function api<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  let resposta: Response
  try {
    resposta = await fetch(`/api${caminho}`, {
      ...opcoes,
      headers: opcoes.body ? { 'Content-Type': 'application/json' } : undefined,
    })
  } catch {
    throw new ErroApi(0, 'SEM_CONEXAO', 'Não foi possível conectar ao servidor.')
  }
  if (resposta.status === 204) return undefined as T
  const corpo = await resposta.json().catch(() => null)
  if (!resposta.ok) {
    throw new ErroApi(
      resposta.status,
      corpo?.erro?.codigo ?? 'ERRO',
      corpo?.erro?.mensagem ?? 'Algo deu errado. Tente novamente.',
    )
  }
  return corpo as T
}
```

- **`src/services/dashboardService.ts`:** `obterDashboard` chama `GET /dashboard`.
- **`src/services/dispositivosService.ts`:** remover o "banco" em memória e os mocks.
  - `criarDispositivo` e `atualizarDispositivo` enviam **somente** `{ nome, comodo, tipo, potenciaWatts }`. Enviar `id`, `ligado`, `consumo` ou `ambienteId` retorna 400.
  - `atualizarDispositivo` usa `PUT /dispositivos/:id`, com o id separado dos dados.
- **`src/pages/Dashboard.tsx`, `Dispositivos.tsx` e `Admin.tsx`:** hoje os `.then(...)` não têm tratamento de falha, então a tela fica presa em "Carregando...". Trate o erro nas cargas e nas ações (`enviar`, `excluir`) e mostre `erro.message`.
- **401 em qualquer chamada** significa sessão inválida: redirecione para `/login`.
- **Chat:** `src/services/chatService.ts` não muda. O chat continua usando mock.

### 5. Usuário real, rotas protegidas e logout

- **`src/pages/Login.tsx`:** chamar `POST /auth/login`, mostrar `erro.message` em caso de 401 ou 429 e só então navegar para `/dashboard`.
- **`src/pages/Cadastro.tsx`:** chamar `POST /usuarios` e mostrar `erro.message` (por exemplo, o 409 de e-mail em uso).
- **Rotas protegidas (`src/App.tsx` e `src/components/Layout.tsx`):** ao montar, chamar `GET /usuarios/me`. Com 401, redirecionar para `/login`. O cookie é HttpOnly, então essa chamada é a única forma de saber se há sessão.
- **`Layout.tsx` e `Sidebar.tsx`:** trocar `mocks/usuario` pelo usuário retornado. A API não tem o campo `papel`, pois não existe administrador.
- **`src/components/Sidebar.tsx`:** o botão Sair chama `POST /auth/logout` e depois navega para `/login`.

### 6. Ligar e desligar chama a API

- **`src/pages/Dispositivos.tsx`:** `alternar(id)` hoje só muda o estado local. Deve chamar `PATCH /dispositivos/:id/estado` com `{ ligado: !d.ligado }` e atualizar a lista com o `Dispositivo` retornado. Se falhar, mantenha o estado anterior e mostre o erro.

### 7. Rótulos

- **`src/pages/Dashboard.tsx`:** a linha com `name="Previsão da IA"` passa a ser `name="Previsão"`, pois é uma média histórica.
- **Selo da recomendação:** o título agora vem da API como "Dica do EcoSync". Vale reavaliar o ícone `Sparkles` e a classe `destaque-ia`, já que essa dica é uma regra simples, sem IA.
