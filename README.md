# Inventário de Bens — Organização Social Hora da Criança

Web app para conferir o inventário cômodo por cômodo, em vários celulares ao mesmo tempo.
React + Vite, Firebase (Firestore + Auth anônima), publicado na Vercel.
O Docker é usado **só para desenvolvimento local**.

---

## 1. Rodar localmente (Docker + emulador)

Requisitos: Docker Desktop e Git. Não precisa instalar Node nem Java.

> A planilha `inventario.ods` **não está no repositório** (ele é público e a planilha tem a lista de bens e valores da entidade).
> Para importar, coloque o arquivo na raiz do projeto.

```bash
# 1. (opcional) escolher o código de acesso local — padrão: hora2026
copy .env.example .env

# 2. subir o site + emulador (deixe este terminal aberto)
docker compose up --watch

# 3. em OUTRO terminal, na primeira vez: importar a planilha para o emulador
docker compose run --rm tools npm run import
```

| O quê | Endereço |
|---|---|
| Site | http://localhost:5173 |
| Emulator UI (ver os dados) | http://localhost:4000 |
| Firestore (emulador) | porta 8080 |
| Auth (emulador) | porta 9099 |

Os dados do emulador ficam salvos num volume do Docker e sobrevivem a `docker compose down`/`up`.
Para recomeçar do zero: `docker compose run --rm tools npm run import -- --forcar`.

### Abrir no celular (mesma rede Wi-Fi)

1. No PC, descubra o IP: abra o PowerShell e rode `ipconfig`. Procure **Endereço IPv4** do adaptador Wi-Fi (ex.: `192.168.0.15`).
2. No celular, abra `http://192.168.0.15:5173`.
3. Se não abrir: o Firewall do Windows pode estar bloqueando. Na primeira vez que o Docker abre portas o Windows costuma perguntar — permita em **Redes privadas**. Confirme também que o Wi-Fi do PC está como **rede privada** (Configurações → Rede e Internet → Wi-Fi → Propriedades).

O site usa o mesmo IP para falar com o emulador (portas 8080 e 9099), então nada mais precisa ser configurado.

### Outros comandos úteis

```bash
docker compose run --rm tools npm run import -- --simular   # só mostra o resumo da planilha
docker compose run --rm tools npm run test:export           # gera teste-exportacao.xlsx
docker compose down                                         # parar tudo
```

---

## 2. Como funciona

- **Entrada**: escolhe o nome (Pedro, Michele, Mércia, Carlos, Gabriel) e digita o código do grupo. O app entra com uma conta anônima do Firebase e grava `membros/{uid}`; a regra do Firestore só aceita se o código estiver certo. Sem esse documento, ninguém lê nem grava nada.
- **Cômodos**: os nomes de setor são normalizados na importação (`Sala de Musica` → `Sala de Música`, `Blibioteca` → `Biblioteca`, espaços e quebras de linha). O nome original fica em `setorOriginal` e volta na exportação.
- **Conferência**: ao salvar o modal (conservação nova obrigatória), o item fica *conferido*, com "editado por X às HH:MM". A conservação original continua guardada à parte.
- **Valor**: o campo formata enquanto digita (`1500` → `1.500`; vírgula ou ponto começam os centavos).
- **Excluir**: botão de lixeira dentro do Editar. O item vai para a aba **Lixeira**, com quem excluiu, quando e o motivo (obrigatório), e pode ser **restaurado**. Os números nunca mudam.
- **Histórico**: aba com o registro de tudo (conferências, edições com o "de → para" de cada campo, adições, exclusões e restaurações), com filtro por pessoa, ação e cômodo. Ninguém consegue alterar ou apagar o histórico (regra do Firestore). Vai também para a planilha, na aba *Histórico*.
- **Equipe**: aba que mostra cada pessoa e os aparelhos em que entrou (ex.: "Android · Chrome"), com "online agora" (app aberto nos últimos 3 minutos) ou "visto há X". Cada aparelho avisa a cada 1 minuto enquanto o app está aberto e com internet; só guarda nome, tipo de aparelho e hora (nada de IP ou localização). A lista só é lida com a aba aberta, para economizar o plano gratuito.
- **Itens novos**: numerados 279, 280… na ordem em que chegam ao servidor (todos veem o mesmo número). Enquanto o aparelho está offline o número aparece como *provisório*.
- **Internet fraca**: as alterações ficam salvas no aparelho (cache do Firestore) e são enviadas quando a conexão volta. O app também fica instalado no navegador (PWA) e abre sem internet depois do primeiro acesso. **Para entrar pela primeira vez é preciso internet.**
- **Exportar planilha**: gera um `.xlsx` no layout da aba *Planilha1 - Auxiliar*, com o cabeçalho da original (logo da Hora da Criança nos dois cantos, Arial), conservação original em O-B-R-P-I, nova no bloco 11/2026, itens novos no fim (279, 280…), legenda e assinaturas. Itens excluídos não entram na aba oficial: ficam só na aba *Excluídos*. Abas extras: *Registro da visita*, *Excluídos* e *Histórico*. Nenhuma aba tem painel congelado.
- **Sem dados pessoais**: o sistema guarda só o primeiro nome de quem editou. RG/CPF ficam apenas como linhas em branco no rodapé da planilha exportada.

---

## 3. Publicar (banco real + Vercel)

Resumo — cada passo será explicado na hora:

1. Criar o projeto no console do Firebase, ativar **Firestore** e **Authentication → Anônimo**.
2. `docker compose run --rm tools firebase login --no-localhost`
3. Gerar e publicar as regras: `docker compose run --rm tools sh -c "npm run rules && firebase deploy --only firestore:rules --project SEU_PROJETO"`
4. Baixar a chave de serviço como `service-account.json` (raiz do projeto, não vai para o GitHub) e importar:
   `docker compose run --rm tools npm run import -- --producao`
5. Subir o código no GitHub e importar na Vercel (Framework: Vite).

### Variáveis de ambiente na Vercel

| Nome | Onde achar |
|---|---|
| `VITE_FIREBASE_API_KEY` | Console Firebase → Configurações do projeto → Seus apps → app Web |
| `VITE_FIREBASE_AUTH_DOMAIN` | idem |
| `VITE_FIREBASE_PROJECT_ID` | idem |
| `VITE_FIREBASE_STORAGE_BUCKET` | idem |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | idem |
| `VITE_FIREBASE_APP_ID` | idem |

Não cadastre `VITE_USE_EMULATOR` na Vercel. O `ACCESS_CODE` **não** vai para a Vercel: ele só existe nas regras do Firestore.

---

## Estrutura

```
src/                 app React
  components/        telas e componentes
  exportar.js        montagem do .xlsx (layout da planilha)
  comodos.js         normalização dos nomes de setor
scripts/
  importar.mjs       .ods → Firestore (emulador ou produção)
  ods.mjs            leitor do .ods
  gerar-regras.mjs   firestore.rules.template → firestore.rules
firestore.rules.template   regras de segurança (com __ACCESS_CODE__)
docker-compose.yml, Dockerfile   só para uso local
```
