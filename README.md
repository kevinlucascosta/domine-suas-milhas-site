# Domine suas Milhas

Este projeto adapta o `multi-language-loyalty-website-prototype` para um site navegável — preservando seus componentes, paleta Frosted Silver, tipografia e efeitos 3D. A pasta de referência no Desktop não foi modificada.

## Executar localmente

```powershell
npm install
npm run build
npm run start -- --hostname 127.0.0.1 --port 3000
```

Abra `http://127.0.0.1:3000`.

## Entrega

- Home contínua: capa 3D, introdução, módulos e chamada para cadastro.
- URLs próprias: `/`, `/cadastro`, `/painel`, `/curso`, `/aula`, `/ferramentas`, `/missoes`, `/perfil` e demais áreas da jornada.
- Seis idiomas: português brasileiro, inglês, português europeu, espanhol, japonês e chinês; bandeiras SVG locais e idioma persistido.
- Carrossel 3D com pausa, foco, toque e preferência por movimento reduzido.
- Sem controles de apresentação, contador de telas ou troca global por teclas de seta.

## Limites reais

O botão de compra redireciona com segurança ao checkout hospedado da Kiwify, configurado localmente por `KIWIFY_CHECKOUT_URL`. Cadastro, login, recuperação, validação de pagamento, vídeos, PDFs, progresso, certificado e dados de aluno permanecem demonstrativos até haver integração segura de produção. Ainda não há webhook validado, envio de e-mail ou criação real de conta.

O arquivo `/images/premium-travel.jpg` não existe na pasta recebida e retorna 404 na referência publicada; por isso, a camada foi preservada sem uma imagem quebrada. As fotos do carrossel usam URLs do Unsplash e dependem de conexão.

## Verificação

`npm run typecheck`, `npm run lint` e `npm run build` passam. Foram testadas a navegação de todas as rotas, a página 404, a home, o cadastro e a troca para inglês, espanhol, japonês e chinês em visualização móvel.
