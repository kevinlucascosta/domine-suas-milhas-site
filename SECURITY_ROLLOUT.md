# Reforço de disponibilidade

## Escopo preservado

Esta revisão não altera telas, textos, componentes, animações, rotas, pagamento, autenticação ou banco de dados. A proteção é configurada antes da aplicação, no Firewall da Vercel.

## Backup e branch

- Backup remoto da versão principal: `backup/pre-security-hardening-2026-11-03`.
- Branch isolada: `security/availability-hardening`.
- Nenhuma mudança desta revisão foi integrada na `main` ou publicada no domínio.

## Regra em observação na Vercel

Existe um rascunho não publicado, sem bloqueio de tráfego:

| Regra | Caminho | Método | Limite observado | Ação quando excede |
| --- | --- | --- | --- | --- |
| Observe health endpoint bursts | `/api/health` | `GET` | 60 por IP a cada 60 segundos | apenas registrar |

Antes de qualquer publicação, conferir o rascunho:

```powershell
npx vercel firewall diff --project lary-milhas-rotadas --json
```

Para descartar a regra sem afetar o site:

```powershell
npx vercel firewall discard --project lary-milhas-rotadas --yes
```

## Limitação confirmada da plataforma

Em 03/11/2026, ao criar limites para `/api/access/claim` e `/api/webhooks/kiwify`, a API da Vercel respondeu `402`: rate limiting não está disponível no plano atual. Nenhuma regra dessas rotas foi criada.

Não foi adicionado um limitador em memória dentro do Next.js: ele seria inconsistente em múltiplas instâncias serverless e poderia dar uma falsa impressão de proteção.

## Próximos reforços dependentes de configuração externa

1. **Vercel:** quando o plano permitir rate limiting, criar inicialmente regras em observação para `POST /api/access/claim` e `POST /api/webhooks/kiwify`; revisar tráfego antes de bloquear.
2. **Kiwify:** validar assinaturas criptográficas de eventos requer o formato dos cabeçalhos de evento recebidos, a chave pública ativa da conta e um webhook de teste. Não alterar a validação atual sem isso, pois um erro pode impedir liberações legítimas de compra.
3. **Supabase:** proteção contra senhas vazadas é disponibilizada no plano Pro ou superior. CAPTCHA também requer chaves de um provedor e altera o fluxo de autenticação; não foi habilitado para preservar a experiência atual.

## Verificação pós-publicação, quando autorizada

1. Conferir os logs do Firewall por 24 horas.
2. Testar monitoramento em `/api/health`.
3. Fazer uma compra de teste autorizada e confirmar o webhook da Kiwify.
4. Confirmar cadastro, login e recuperação de senha com um usuário de teste.
