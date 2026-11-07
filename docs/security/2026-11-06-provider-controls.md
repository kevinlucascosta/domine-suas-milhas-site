# Controles externos de autenticação, pagamentos e hospedagem

Este documento registra os controles que precisam ser conferidos nos painéis dos provedores. Ele não contém segredos, tokens, dados pessoais nem valores de variáveis de ambiente.

## Estado deste trabalho

Nenhuma configuração externa foi alterada por este trabalho. As ações abaixo precisam ser executadas e confirmadas nos respectivos painéis, com acesso do responsável pela conta. Os nomes dos domínios e das variáveis são registrados; valores de segredos e dados de clientes não devem ser copiados para este documento.

## Supabase Auth

Antes de ativar a confirmação obrigatória de e-mail, configure e teste um SMTP personalizado. O SMTP padrão do Supabase possui limite baixo e pode ser destinado apenas a usos de teste; ele não é uma base adequada para a entrega confiável de confirmações e redefinições de senha em produção.

Na lista de URLs de redirecionamento permitidas do Supabase, mantenha somente as rotas exatas dos domínios que continuam ativos. Confirme primeiro qual é o domínio canônico de produção e remova domínios antigos ou não utilizados. Se os dois endereços abaixo realmente continuarem em uso, permita somente estas rotas exatas:

- `https://lary-milhas-rotadas.vercel.app/auth/callback`
- `https://lary-milhas-rotadas.vercel.app/auth/recovery`
- `https://domine-suas-milhas-site.vercel.app/auth/callback`
- `https://domine-suas-milhas-site.vercel.app/auth/recovery`

Evite curingas amplos, como `*.vercel.app`, para que um domínio não previsto não possa receber links de autenticação.

O CAPTCHA deve continuar desativado até que o frontend passe a coletar e enviar o token do provedor em cada operação de autenticação. Ativá-lo sem essa integração bloquearia cadastros, logins ou redefinições legítimos.

Confira no painel os limites de tentativas de autenticação e a proteção contra abuso disponíveis no projeto. Depois, teste cadastro e recuperação de senha com contas de teste. As respostas públicas devem ser genéricas e não revelar se um e-mail está cadastrado; não use contas de clientes nem compartilhe códigos ou links recebidos.

Se SMTP personalizado for usado, confirme também que o domínio remetente está autenticado com SPF e DKIM e que a política DMARC está coerente com o serviço de envio. Faça um teste de entrega e de recuperação antes de exigir confirmação de e-mail em produção.

A proteção contra senhas vazadas depende de confirmação do plano contratado e de eventual custo adicional do Supabase. Ela não deve ser ativada antes dessa confirmação pelo responsável financeiro.

## Vercel

Caso seja criada uma regra de Firewall/WAF específica, restrinja seu escopo ao endpoint de webhook:

- método `POST`
- caminho `/api/webhooks/kiwify`

Comece a regra em modo de observação ou rascunho para validar tráfego legítimo antes de aplicar bloqueios. Essa regra não protege o login feito diretamente no Supabase; a proteção contra excesso de tentativas de autenticação deve ser confirmada no próprio Supabase.

Confira somente os nomes e o escopo (Production e Preview, quando necessários) das variáveis privadas de servidor:

- `SUPABASE_SERVICE_ROLE_KEY`
- `KIWIFY_WEBHOOK_SECRET`
- `KIWIFY_PRODUCT_ID`
- `KIWIFY_PRODUCT_AMOUNT_CENTS`
- `KIWIFY_PRODUCT_CURRENCY`

Essas variáveis não podem usar o prefixo `NEXT_PUBLIC_`. Não leia, copie, registre ou exponha seus valores durante a conferência.

Não disponibilize `SUPABASE_SERVICE_ROLE_KEY` em previews ou ambientes de teste. Use um projeto Supabase separado para Preview/Testes ou deixe a variável ausente nesses ambientes se o fluxo não precisar dela. Nunca reutilize a chave de produção em um preview que possa executar código não revisado.

## Kiwify

O cadastro do webhook deve apontar para a URL do endpoint com o parâmetro `?key=` preenchido pelo segredo configurado, sem revelar esse valor em documentos, telas compartilhadas ou logs. Como o segredo viaja na URL, proxies, logs de acesso, ferramentas de analytics e históricos podem registrá-lo. Restrinja o acesso a esses registros e nunca compartilhe a URL completa. Se houver suspeita de exposição, rotacione o segredo no código e no painel de forma coordenada. Migrar para assinatura em cabeçalho é uma melhoria futura que exige mudança compatível no endpoint e no cadastro do webhook.

Confirme que a Kiwify envia os eventos tratados pela aplicação: pagamento aprovado, reembolso, chargeback e cancelamento. A aplicação deve continuar validando produto, valor, moeda e idempotência antes de conceder ou revogar acesso.

Também confirme que o formato configurado no painel corresponde ao endpoint da aplicação: o segredo é esperado como parâmetro de consulta (`?key=`), não apenas como um campo interno do painel sem transmissão na URL.

## Ordem segura de validação

1. Configurar e testar SMTP personalizado com uma conta de teste.
2. Inserir as quatro URLs exatas de callback e recuperação no Supabase.
3. Confirmar entrega de e-mail de cadastro e de redefinição.
4. Conferir o webhook da Kiwify em modo de teste, sem alterar pagamentos reais.
5. Criar e observar a regra limitada da Vercel antes de qualquer bloqueio.
6. Verificar nomes e escopos das variáveis privadas, sem acessar seus valores.
7. Confirmar domínio remetente e SPF/DKIM/DMARC, além dos limites de tentativas do Auth.
8. Confirmar que a chave `service_role` não está disponível em Preview e validar os nomes/escopos das variáveis de produto da Kiwify sem ler valores.
