# Roadmap — nascentes-geo

Plataforma fictícia de cadastro comunitário de nascentes d'água com workflow de validação
(REGISTRADA → EM_ANALISE → VALIDADA/REJEITADA). Projeto clean-room de portfólio:
domínio, cartografia e dados 100% sintéticos (`tools/gen_data.py`, seed 2026).

## Por que esta ordem

A ordem original (Auth primeiro) tinha dependência invertida: o IdP demo (Spring
Authorization Server) e a sincronização pressupõem a API, que era o último sprint.
A ordem abaixo garante que **cada sprint termina com algo demonstrável em vídeo** e
coloca o diferencial (offline-first de campo) na frente.

## Sprints

### Sprint 1 — Mobile + PWA Offline ✅ (este repo, pasta `web/`)

O app de campo precisa funcionar num celular, na trilha, sem sinal.

- [x] Touch de verdade: pointer events unificados, pinch-zoom, layout responsivo
      (sidebar vira barra inferior no celular)
- [x] PWA instalável: `manifest.webmanifest` + ícones + `sw.js` (app shell em cache)
- [x] "Baixar região para uso offline": estimativa de tamanho, barra de progresso,
      verificação de integridade (SHA-256), chunks vetoriais em IndexedDB
- [x] Prova real: teste automatizado com rede desligada (Playwright `setOffline`)

**Pronto quando:** app instala no celular, e com rede desligada o mapa abre,
filtra e cadastra (fila local vem no Sprint 3).

### Sprint 2 — API + workflow na entidade

API Spring Boot (Java 21), mesmo padrão do `licensehub-api`:

- Entidade `Nascente` com a máquina de estados NA ENTIDADE
- Endpoint GeoJSON com filtro por `status` e `bbox`
- Seed sintético, testes em 3 níveis, Dockerfile, CI `mvn -B verify`
  (build local não roda no sandbox — Maven Central bloqueado; CI é a prova)

**Pronto quando:** CI verde no Actions e contrato da API documentado no README.

### Sprint 3 — Sincronização

- Fila local (IndexedDB) de cadastros feitos offline: `pendente → sincronizado`
- Envio à API quando a rede volta; conflito last-write-wins documentado (ADR)

**Pronto quando:** vídeo mostra cadastro offline → rede volta → registro aparece na API.

### Sprint 4 — Autenticação

- IdP fictício "AcessoCidadão (demo)" com Spring Authorization Server
  (Authorization Code + PKCE); API como resource server
- Papéis: `visitante` (leitura) e `agente` (cadastro/validação)
- Front: login gating o modo cadastro

**Pronto quando:** fluxo PKCE completo gravado; token com papel errado recebe 403.

### Sprint 5 — Publicação

- README bilíngue com GIF mobile, seção de decisões/trade-offs e números
  (tamanho do pacote offline, tempo de sync)
- 1 ADR novo no repo `architecture-decisions` (offline-first e IdP fictício)
- Rascunho do post LinkedIn (vídeo `media/demo_linkedin.mp4` regravado em mobile)
- GitHub Pages servindo `web/` como demo viva (PWA exige HTTPS — Pages resolve)

**Pronto quando:** critérios do briefing: CI verde, README com GIF, demo offline
gravada com rede desligada, ADR publicado, post aprovado.

## Regras invioláveis (inalteradas)

1. Nenhum código, tela, nome, modelo ou dado do projeto real (TDF/MMA).
2. Nenhuma marca Gov.br; identidade visual própria e IdP fictício.
3. Dados sempre gerados por script; sem nomes reais de pessoas ou lugares.
