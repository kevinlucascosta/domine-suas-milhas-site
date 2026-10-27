# Auditoria defensiva de segurança — Domine suas Milhas

Data: 02/10/2026  
Escopo: código fonte entregue, configuração versionada, projeto Supabase conectado e deployment de produção na Vercel.  
Produção validada: `https://domine-suas-milhas-site.vercel.app`

## Arquitetura identificada

| Camada | Tecnologia / serviço |
|---|---|
| Frontend e framework | React 19, Next.js App Router 16.3.8, TypeScript |
| Backend | Route Handlers do Next.js e Proxy (middleware) |
| Banco | PostgreSQL gerenciado pelo Supabase |
| Autenticação | Supabase Auth, cookies de sessão e confirmação de e-mail |
| Autorização | RLS do Supabase + Proxy do Next.js + checagem de entitlement |
| Hospedagem | Vercel |
| Pagamento | Checkout hospedado Kiwify + webhook para liberar acesso |
| Outros | Supabase Storage privado para avatares |

## Método aplicado

1. Revisão manual de rotas, Proxy, autenticação, RLS, migrations, APIs, upload, redirecionamentos e configuração.
2. Verificação do banco com os advisors do Supabase e consulta de privilégios efetivos.
3. Pesquisa de segredos no código sem exibir valores e conferência dos nomes de variáveis da Vercel.
4. `npm audit --omit=dev` antes e depois da atualização.
5. Semgrep antes e depois: `semgrep --config auto .` (com exclusão de `node_modules` e `.next`).
6. Compilação, typecheck e ESLint após as alterações; publicação e conferência HTTP no ambiente de produção.

Não foram feitos testes destrutivos, tentativas de login indevido, alteração de dados de alunos, brute force, criação de pagamentos ou envio de webhooks falsos.

## Achados corrigidos

### 1. Dependência Next.js em versão vulnerável

**VULNERABILIDADE:** Dependência com vulnerabilidades críticas e altas conhecidas.

**SEVERIDADE:** Crítica (com dois avisos altos transitivos).

**ARQUIVO / LOCAL:** `package.json` e `package-lock.json`.

**EVIDÊNCIA:** O primeiro `npm audit --omit=dev` identificou Next.js 16.2.6 dentro do intervalo vulnerável e também dependências transitivas `postcss` e `sharp` afetadas pela cadeia do Next.js.

**POR QUE É PERIGOSO:** Uma versão do framework abaixo das correções oficiais amplia a superfície de ataques a rotas App Router, Server Actions e processamento de imagens, mesmo quando a aplicação não usa todas essas funções diretamente.

**CENÁRIO DE RISCO:** Uma falha conhecida no framework poderia ser explorada contra a camada de servidor antes das validações específicas da aplicação.

**CORREÇÃO RECOMENDADA:** Atualizar para a versão corrigida indicada pelo `npm audit` e manter o lockfile versionado.

**EXEMPLO DE CÓDIGO CORRIGIDO:** `next` foi fixado em `16.3.8` no `package.json`.

**COMPORTAMENTO PRESERVADO:** Sim. Typecheck, lint e build de produção concluíram com sucesso após a atualização.

**COMO VALIDAR:** Executar `npm audit --omit=dev`; resultado final: `found 0 vulnerabilities`.

### 2. Falha aberta de autorização se variáveis do Supabase faltassem em produção

**VULNERABILIDADE:** Fail-open de acesso a rotas premium em caso de configuração incompleta.

**SEVERIDADE:** Alta.

**ARQUIVO / LOCAL:** `src/lib/supabase/proxy.ts`, função `updateSession`.

**EVIDÊNCIA:** Quando `NEXT_PUBLIC_SUPABASE_URL` ou `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` estavam ausentes, o Proxy retornava `NextResponse.next()` inclusive para `/curso`, `/perfil`, `/missoes` e demais rotas protegidas.

**POR QUE É PERIGOSO:** Um erro de ambiente de produção não pode transformar uma área paga em área acessível sem autenticação ou entitlement.

**CENÁRIO DE RISCO:** Após uma variável ser removida ou configurada incorretamente na Vercel, alguém poderia visitar uma rota premium sem passar pelo controle normal do Proxy.

**CORREÇÃO RECOMENDADA:** Em produção, responder com 503 para rota protegida quando a configuração obrigatória não existir; manter a experiência flexível somente para desenvolvimento.

**EXEMPLO DE CÓDIGO CORRIGIDO:**

```ts
if (needsAccess && process.env.NODE_ENV === "production") {
  return NextResponse.json({ error: "access_not_configured" }, { status: 503 });
}
```

**COMPORTAMENTO PRESERVADO:** Sim. Com a configuração existente na Vercel, usuários seguem para login, pagamento pendente ou curso exatamente como antes. A consulta de entitlement agora também respeita `expires_at`.

**COMO VALIDAR:** Remover uma variável somente em ambiente de teste e requisitar uma rota premium; o resultado deve ser 503, nunca conteúdo do curso.

### 3. Metadado de configuração exposto no endpoint de saúde

**VULNERABILIDADE:** Divulgação de estado interno de banco.

**SEVERIDADE:** Baixa.

**ARQUIVO / LOCAL:** `src/app/api/health/route.ts`.

**EVIDÊNCIA:** A resposta pública podia retornar `database: "not_configured"` e `mode: "demo"`.

**POR QUE É PERIGOSO:** Embora não exponha uma credencial, ajuda reconhecimento do ambiente por terceiros.

**CENÁRIO DE RISCO:** Um atacante poderia distinguir uma implantação incompleta de uma implantação com banco ativo ao consultar uma rota pública.

**CORREÇÃO RECOMENDADA:** Retornar somente o estado genérico de saúde.

**EXEMPLO DE CÓDIGO CORRIGIDO:** `Response.json({ ok: true })`.

**COMPORTAMENTO PRESERVADO:** Sim. O endpoint segue utilizável por monitoramento.

**COMO VALIDAR:** `GET /api/health` em produção retorna apenas `{"ok":true}`.

### 4. Registro de missões e XP confiava em campos enviados pelo navegador

**VULNERABILIDADE:** Integridade fraca de gamificação / lógica de negócio.

**SEVERIDADE:** Baixa.

**ARQUIVO / LOCAL:** `src/components/learning-site.tsx` e migration `20261002120632_mission_completion_insert_policy.sql`.

**EVIDÊNCIA:** O cliente inseria diretamente `user_id`, `mission_key` e `xp_earned` em `learning_mission_completions`.

**POR QUE É PERIGOSO:** Mesmo com RLS limitando o usuário à própria linha, a aplicação não deve confiar no navegador para declarar pontos ou conclusão.

**CENÁRIO DE RISCO:** Um aluno autenticado poderia tentar registrar diretamente uma missão própria fora da interface prevista.

**CORREÇÃO RECOMENDADA:** Usar a RPC restrita `complete_learning_mission`, que obtém `auth.uid()` no banco e mapeia internamente os XP aceitos; revogar INSERT direto do papel autenticado.

**EXEMPLO DE CÓDIGO CORRIGIDO:**

```ts
const { data, error } = await supabase
  .rpc("complete_learning_mission", { p_mission_key: missionKey });
```

**COMPORTAMENTO PRESERVADO:** Sim. Os mesmos botões continuam concluindo as missões e retornando a mensagem de XP; duplicatas permanecem idempotentes.

**COMO VALIDAR:** A checagem no banco confirmou `anon_can_execute=false`, `authenticated_can_insert=false` e ausência da política de INSERT direto. A função permanece executável somente para `authenticated`.

## Achados que permanecem e exigem ação do proprietário

### 5. Proteção contra senhas vazadas desativada no Supabase

**VULNERABILIDADE:** Proteção de credenciais comprometidas desativada.

**SEVERIDADE:** Média.

**ARQUIVO / LOCAL:** Configuração de Auth do projeto Supabase (painel, não versionada no repositório).

**EVIDÊNCIA:** O Security Advisor do Supabase retornou `auth_leaked_password_protection` como `WARN`.

**POR QUE É PERIGOSO:** Usuários podem escolher senhas já expostas em vazamentos conhecidos, aumentando o risco de credential stuffing.

**CENÁRIO DE RISCO:** Uma senha reutilizada em outro serviço comprometido pode ser usada para tentar acessar a conta do aluno.

**CORREÇÃO RECOMENDADA:** Ativar “Leaked password protection” nas configurações de senha do Supabase Auth e manter confirmação de e-mail habilitada.

**EXEMPLO DE CÓDIGO CORRIGIDO:** Não se aplica; é uma opção do painel gerenciado.

**COMPORTAMENTO PRESERVADO:** Sim. A ativação apenas bloqueia senhas reconhecidamente comprometidas durante cadastro ou redefinição.

**COMO VALIDAR:** Executar novamente o Security Advisor e confirmar que o aviso desapareceu. Referência: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

### 6. Segredo do webhook está no parâmetro da URL e não há validação de assinatura assimétrica

**VULNERABILIDADE:** Validação de origem do webhook pode ser fortalecida.

**SEVERIDADE:** Média.

**ARQUIVO / LOCAL:** `src/app/api/webhooks/kiwify/route.ts`.

**EVIDÊNCIA:** O endpoint valida `?key=` em tempo constante, valida produto e torna eventos idempotentes por chave/hash, porém ainda depende de segredo na URL. A Kiwify documenta chaves públicas de webhook, mas a integração atual não verifica assinatura criptográfica.

**POR QUE É PERIGOSO:** URLs podem aparecer em logs de infraestrutura, histórico de configurações ou ferramentas de observabilidade. Assinatura verificada reduz dependência de segredo transportado na URL.

**CENÁRIO DE RISCO:** Se o segredo da URL vazasse para alguém com acesso indevido a logs, essa pessoa poderia tentar enviar eventos forjados. As validações de produto e idempotência reduzem, mas não eliminam, o impacto.

**CORREÇÃO RECOMENDADA:** Após confirmar no painel/documentação da Kiwify o formato de assinatura ativo para esta conta, validar a assinatura do corpo com a chave pública oficial e rotacionar o segredo atual. Não apliquei uma alteração especulativa para não interromper a liberação legítima de acesso.

**EXEMPLO DE CÓDIGO CORRIGIDO:** Depende do cabeçalho, algoritmo e chave pública configurados pela Kiwify para esta conta; deve ser implementado conforme a documentação oficial, não por suposição.

**COMPORTAMENTO PRESERVADO:** A validação atual, o produto esperado, a comparação em tempo constante e a idempotência foram preservados.

**COMO VALIDAR:** Configurar um webhook de teste da Kiwify, enviar evento assinado e confirmar aceitação; repetir com assinatura alterada e confirmar 401. Referência: https://docs.kiwify.com.br/api-reference/webhooks/listar-chaves-p%C3%BAblicas-de-webhook

## Itens verificados sem vulnerabilidade confirmada

- **XSS:** não foram encontrados `dangerouslySetInnerHTML`, `innerHTML`, `eval` ou renderização direta de HTML nos arquivos de aplicação. As strings são renderizadas pelo React com escaping padrão.
- **SQL injection:** a única consulta SQL direta do healthcheck é constante (`select 1`); o restante usa Supabase/Drizzle parametrizados.
- **Open redirect:** `/api/checkout` aceita somente `https://pay.kiwify.com.br`; os parâmetros `next` são usados apenas para caminhos internos controlados pela aplicação.
- **RLS e IDOR:** tabelas de perfil, progresso, missão e entitlement foram revisadas com vínculo por `auth.uid()`; a rota de claim deriva usuário e e-mail da sessão no servidor, não do corpo da requisição.
- **Tabelas de pagamento:** `kiwify_orders`, `payment_events` e `webhook_deliveries` têm RLS ativado e nenhuma política de navegador. O Advisor informa isso, mas no modelo atual elas são deliberadamente acessíveis apenas pelo serviço do servidor; não é uma abertura de dados ao aluno.
- **Upload de avatar:** bucket privado, escopo por dono, MIME permitido e tamanho máximo foram encontrados nas migrations. A interface também limita JPEG/PNG/WebP e 2 MB.
- **SSRF, path traversal e IA:** não há funcionalidade de IA, fetch de URL fornecida por usuário, importação remota pelo servidor ou manipulação de caminho por entrada do usuário no escopo analisado.
- **Administração:** nenhuma rota administrativa exposta foi encontrada no código entregue.
- **Segredos:** não houve segredo real hardcoded no código analisado. `.env.local` não foi exibido nem incluído no relatório; a Vercel confirma que `SUPABASE_SERVICE_ROLE_KEY` e segredos Kiwify estão como Secret e não como variáveis públicas.
- **Sessão:** a sessão é consultada no servidor via `getClaims`; nenhum token de serviço é enviado ao navegador. A rotação de refresh token está habilitada na configuração local do Supabase.

## Semgrep e dependências

| Verificação | Resultado antes | Resultado depois |
|---|---:|---:|
| `semgrep --config auto .` | 0 achados em 54 arquivos | 0 achados em 56 arquivos |
| `npm audit --omit=dev` | 1 crítico e 2 altos | 0 vulnerabilidades |
| `npm run typecheck` | — | sucesso |
| `npm run lint` | — | sucesso |
| `npm run build` | — | sucesso, Next.js 16.3.8 |

Os artefatos completos do Semgrep estão em `semgrep-before.json` e `semgrep-after.json`.

## Produção e headers confirmados

No domínio público foram confirmados: `Content-Security-Policy` (base-uri, object-src, frame-ancestors e form-action), HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy` e `Permissions-Policy`.

## Reforço adicional aplicado no Supabase

Em 02/10/2026 também foram ativados no painel do projeto:

- alteração de senha segura, exigindo autenticação recente;
- exigência da senha atual ao trocar uma senha dentro de uma sessão autenticada;
- comprimento mínimo de senha de 8 caracteres.

O painel confirmou limite de login/cadastro de 30 solicitações por IP a cada 5 minutos e limite de verificação de token de 30 por IP a cada 5 minutos. Eles foram preservados para não elevar o risco de bloqueio indevido em recuperação de senha.

O controle de senha vazada não pôde ser ativado porque esta conta Supabase está no plano Free e o próprio painel informa que a função requer o plano Pro ou superior. Isso não é falha de código do site; ao mudar de plano, a opção pode ser ativada diretamente em **Authentication → Sign In / Providers → Email**.

## Tabela final

| Severidade | Vulnerabilidade | Arquivo/Local | Situação | Correção |
| ---------- | --------------- | ------------- | -------- | -------- |
| Crítica | Next.js com avisos conhecidos | `package.json` / lockfile | Corrigida | Atualizado para 16.3.8; npm audit final limpo |
| Alta | Falha aberta em rota premium sem configuração | `src/lib/supabase/proxy.ts` | Corrigida | Falha fechada com 503 em produção; expiracão validada |
| Média | Proteção contra senhas vazadas desativada | Painel Supabase Auth | Pendente de ação manual | Ativar no Dashboard |
| Média | Autenticidade de webhook sem assinatura assimétrica | `api/webhooks/kiwify` | Pendente de integração configurada | Validar assinatura oficial e rotacionar segredo |
| Baixa | Estado de banco exposto | `api/health` | Corrigida | Resposta pública genérica |
| Baixa | XP aceito do navegador | Missões / RLS | Corrigida | RPC com usuário e XP definidos no banco |

## Resumo final

- Críticas encontradas: **1**, corrigida.
- Altas encontradas: **1** de lógica/autorização, corrigida; o audit de dependências também reportou **2 alertas altos transitivos**, eliminados com a atualização do Next.js.
- Médias encontradas: **2**, dependentes de configuração/integração externa.
- Baixas encontradas: **2**, corrigidas.
- Falsos positivos: **0**. Há três avisos de RLS sem política que foram revisados como modelo intencional server-only, não como falso positivo silenciosamente ignorado.

Prioridade seguinte: ativar proteção contra senhas vazadas no Supabase e evoluir o webhook Kiwify para assinatura criptográfica conforme o formato que estiver habilitado na conta.

## Limitações

- Não foi possível auditar valores de variáveis de ambiente, logs históricos da Vercel/Kiwify ou a origem real dos eventos já recebidos, para não expor segredos ou dados pessoais.
- Não foram realizados testes de invasão, brute force, pagamento real, upload malicioso ou envio de webhook forjado.
- Não foram fornecidas migrations históricas completas das tabelas de pagamento existentes; elas foram revisadas pelo estado e advisors do banco conectado.
- Rate limits e CAPTCHA reais de Supabase Auth são configurações de painel e precisam de conferência operacional adicional.
- A auditoria não garante ausência total de falhas. Não foram encontradas vulnerabilidades adicionais dentro do escopo analisado, mas mudanças futuras, integrações e configurações externas exigem nova revisão.
