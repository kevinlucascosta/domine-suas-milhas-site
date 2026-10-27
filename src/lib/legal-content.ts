export type LegalPage = {
  slug: "privacidade" | "cookies" | "termos" | "reembolso" | "direitos";
  title: string;
  updatedAt: string;
  sections: { heading: string; paragraphs: string[] }[];
};

export const legalPlaceholders = [
  "[PREENCHER: razão social ou nome do controlador]",
  "[PREENCHER: CPF ou CNPJ]",
  "[PREENCHER: endereço comercial]",
  "[PREENCHER: e-mail para privacidade e direitos do titular]",
];

const controller = `${legalPlaceholders[0]}, ${legalPlaceholders[1]}, com endereço em ${legalPlaceholders[2]}.`;
const contact = legalPlaceholders[3];

export const legalPages: LegalPage[] = [
  {
    slug: "privacidade", title: "Política de Privacidade", updatedAt: "27 de outubro de 2026",
    sections: [
      { heading: "Quem controla os dados", paragraphs: [controller, `Dúvidas ou solicitações sobre dados pessoais devem ser enviadas para ${contact}.`] },
      { heading: "Dados que tratamos", paragraphs: ["Podemos tratar nome, e-mail, dados de perfil, respostas pedagógicas, progresso, XP e registros necessários para fornecer a plataforma.", "Pagamentos são processados pela Kiwify. O site não armazena dados completos de cartão."] },
      { heading: "Finalidades e compartilhamento", paragraphs: ["Usamos os dados para criar e proteger contas, liberar conteúdo adquirido, registrar progresso e prestar suporte.", "Os dados podem ser tratados por Supabase (autenticação, banco e armazenamento), Vercel (hospedagem) e Kiwify (pagamento), somente quando necessário à operação."] },
      { heading: "Seus direitos", paragraphs: ["Você pode solicitar confirmação, acesso, correção, portabilidade, eliminação quando aplicável e informações sobre compartilhamento.", `Para exercer esses direitos, escreva para ${contact}. Antes de atender, poderemos confirmar sua identidade para proteger a conta.`] },
      { heading: "Retenção e segurança", paragraphs: ["Mantemos os dados pelo tempo necessário para as finalidades informadas, obrigações legais e defesa de direitos. Os prazos específicos devem ser definidos pelo controlador.", "Adotamos controles técnicos e administrativos proporcionais, mas nenhum sistema elimina todos os riscos."] },
    ],
  },
  {
    slug: "cookies", title: "Política de Cookies", updatedAt: "27 de outubro de 2026",
    sections: [
      { heading: "O que são cookies", paragraphs: ["Cookies e tecnologias semelhantes guardam preferências no navegador para que o site funcione de forma consistente."] },
      { heading: "Cookies usados", paragraphs: ["Necessários: sessão de autenticação e preferências essenciais da plataforma.", "Preferências: idioma escolhido e decisão de cookies. No momento, não foram identificados pixels de publicidade ou analytics próprios no carregamento inicial."] },
      { heading: "Suas escolhas", paragraphs: ["Você pode aceitar apenas os cookies necessários ou permitir também preferências. A recusa de cookies não essenciais não bloqueia a navegação.", "Use o botão “Preferências de cookies” no rodapé para revisar ou revogar a decisão a qualquer momento."] },
      { heading: "Terceiros", paragraphs: ["O site usa fontes do Google e pode conectar-se a Supabase, Vercel e Kiwify conforme a funcionalidade utilizada. As respectivas políticas desses serviços também se aplicam."] },
    ],
  },
  {
    slug: "termos", title: "Termos de Uso", updatedAt: "27 de outubro de 2026",
    sections: [
      { heading: "Aceite e uso", paragraphs: ["Ao criar uma conta ou usar a plataforma, você concorda em utilizar o conteúdo de forma lícita e pessoal.", "Não é permitido compartilhar credenciais, tentar acessar contas de terceiros, burlar controles de acesso ou copiar e redistribuir materiais sem autorização."] },
      { heading: "Conta e conteúdo", paragraphs: ["Você é responsável por manter a senha confidencial e por informar dados verdadeiros. O acesso ao curso depende da confirmação do pagamento quando aplicável.", "Textos, vídeos, PDFs, marca e elementos visuais pertencem aos respectivos titulares e não podem ser reproduzidos além do permitido por lei ou autorização."] },
      { heading: "Contato", paragraphs: [`Para suporte, privacidade ou notificações relacionadas a estes termos, use ${contact}.`] },
    ],
  },
  {
    slug: "reembolso", title: "Política de Reembolso", updatedAt: "27 de outubro de 2026",
    sections: [
      { heading: "Garantia e reembolso", paragraphs: ["O checkout informa garantia de 7 dias e reembolso sem burocracia. O pedido deve ser solicitado dentro desse prazo, respeitando as condições exibidas no momento da compra e a legislação aplicável."] },
      { heading: "Como solicitar", paragraphs: [`Solicite o reembolso pelo canal de suporte ${contact}, informando o e-mail usado na compra e o identificador do pedido quando disponível. O pedido também pode seguir o fluxo disponibilizado pela Kiwify.`] },
      { heading: "Acesso ao curso", paragraphs: ["Após confirmação do reembolso, o acesso ao conteúdo poderá ser removido automaticamente. A Kiwify é responsável pelo processamento financeiro do pagamento e do estorno conforme seu fluxo operacional."] },
    ],
  },
  {
    slug: "direitos", title: "Canal de Direitos do Titular", updatedAt: "27 de outubro de 2026",
    sections: [
      { heading: "Como fazer uma solicitação", paragraphs: [`Envie um e-mail para ${contact} com o assunto “Direitos do titular”. Informe seu nome, e-mail da conta, pedido e a melhor forma de retorno.`] },
      { heading: "Pedidos aceitos", paragraphs: ["Você pode pedir acesso, correção, atualização, portabilidade, eliminação quando cabível, informações sobre compartilhamento ou revogação de consentimento."] },
      { heading: "Prazo e segurança", paragraphs: ["Confirmaremos o recebimento e responderemos dentro do prazo aplicável. Podemos solicitar confirmação de identidade antes de fornecer dados ou modificar uma conta."] },
    ],
  },
];

export function getLegalPage(slug: LegalPage["slug"]) {
  return legalPages.find((page) => page.slug === slug);
}
