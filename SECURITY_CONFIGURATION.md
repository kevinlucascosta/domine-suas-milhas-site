# Configuração de segurança antes da publicação

As variáveis abaixo devem existir nos ambientes de produção e prévia antes de publicar esta revisão:

- `KIWIFY_PRODUCT_ID`: identificador exato do produto na Kiwify.
- `KIWIFY_PRODUCT_AMOUNT_CENTS`: valor total esperado em centavos. Exemplo: `5000` para R$ 50,00.
- `KIWIFY_PRODUCT_CURRENCY`: moeda esperada, normalmente `BRL`.
- `KIWIFY_WEBHOOK_SECRET`: segredo forte e exclusivo da URL do webhook.
- `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_SERVICE_ROLE_KEY`: credenciais mantidas somente nas configurações seguras do ambiente.

Depois de configurar as variáveis na Vercel e atualizar a URL do webhook na Kiwify, faça uma compra de teste autorizada e confirme que:

1. um pagamento aprovado libera o acesso;
2. um valor ou moeda divergente é recusado;
3. reenvios do mesmo evento não duplicam o acesso;
4. reembolso, chargeback e cancelamento revogam o acesso.

Não registre os valores dessas variáveis em arquivos versionados, capturas de tela, e-mails ou conversas.
