# Prompt mestre da adaptação — Domine suas Milhas

Use o projeto `multi-language-loyalty-website-prototype` como base estrutural e visual. A orientação mais recente prevalece: mantenha o 3D existente, seus cartões, órbitas, perspectiva, inclinações e interações; remova apenas a lógica de apresentação por slides.

O resultado deve ser um site mobile-first para aulas de milhas aéreas, usando a paleta Frosted Silver: `#C8CDD2`, `#DDE9F3`, `#FFFFFF`, `#708090`, `#303030`; títulos em Playfair Display e interface em Inter. A experiência deve ser elegante, clara e premium sem trocar a identidade original.

A home deve ser uma rolagem contínua: capa interativa, introdução do curso, jornada aprender/praticar/simular/evoluir, módulos e convite para criar conta. Depois, o usuário segue para cadastro e para a área do aluno. Não usar numeração 01/15, botões de próximo/anterior de apresentação, atalhos globais de seta ou qualquer aspecto de slideshow.

Criar páginas reais com URLs para: home, como funciona, cadastro, boas-vindas, painel, curso, aula, ferramentas, comparador, missões, quiz, projeto final, progresso, perfil e certificado. Usar links e histórico do navegador, com navegação inferior móvel.

Incluir português do Brasil, inglês, português de Portugal, espanhol, japonês e chinês. O seletor deve mostrar as bandeiras de Brasil, Estados Unidos, Portugal, Espanha, Japão e China. Ao alterar o idioma, mudar textos, rótulos, botões, mensagens, placeholders, descrições acessíveis e conteúdo das páginas; preservar apenas nomes próprios, códigos de aeroporto e a marca quando apropriado. Persistir o idioma.

O carrossel de documentos deve manter a modelagem 3D da referência, com toque, botões, foco e controle de pausa, sem capturar teclas fora do componente. Respeitar `prefers-reduced-motion` e evitar rolagem horizontal ou conteúdo cortado em celulares.

Se vídeos, PDFs, preço, login, banco de dados ou checkout não tiverem sido configurados, não alegar que funcionam. Mostrar aviso de demonstração e explicar que autenticação, acesso ao curso, pagamento validado por webhooks e persistência precisam de implementação de produção. Não inventar valores, testemunhos, arquivos ou credenciais.

Preservar `globals.css` do projeto de referência e colocar mudanças de navegação/estrutura em arquivo complementar. Validar compilação, tipos, rotas, versão móvel e os seis idiomas antes da entrega. A pasta do projeto de referência nunca deve ser alterada.
