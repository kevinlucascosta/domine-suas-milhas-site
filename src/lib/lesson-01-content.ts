import type { TravelDocument } from "@/components/ui/coverflow-documents";

export type LessonQuestion = {
  id: string;
  documentId: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

// Add future Aula 01 PDFs here. The carousel reads this list directly.
export const lesson01Documents: TravelDocument[] = [
  {
    tag: "#Fundamentos",
    country: "O QUE SÃO MILHAS",
    subtitle: "AULA 01 · MATERIAL DE APOIO",
    subject: "Milhas, pontos e milheiro",
    img: "/lesson-01/o-que-sao-milhas-capa.png",
    pdfUrl: "/lesson-01/o-que-sao-milhas.pdf",
    fileName: "o-que-sao-milhas.pdf",
  },
  {
    tag: "#Fundamentos",
    country: "PROGRAMAS DE FIDELIDADE",
    subtitle: "AULA 01 · MATERIAL DE APOIO",
    subject: "Programas das companhias aéreas",
    img: "/lesson-01/programas-de-fidelidade-capa.png",
    pdfUrl: "/lesson-01/programas-de-fidelidade.pdf",
    fileName: "programas-de-fidelidade.pdf",
  },
];

export const lesson01ReviewQuestions: LessonQuestion[] = [
  { id: "review-milhas-01", documentId: "milhas", prompt: "De acordo com o material, o que são milhas?", options: ["A moeda dos programas de fidelidade", "Uma taxa cobrada pela companhia aérea", "Um tipo de cartão de crédito", "Um desconto fixo em passagens"], correctIndex: 0, explanation: "Milhas são a moeda usada nos programas de fidelidade das companhias aéreas." },
  { id: "review-milhas-02", documentId: "milhas", prompt: "Como o material define os pontos?", options: ["Recompensas de bancos ou sites parceiros", "Milhas vencidas de companhias aéreas", "Taxas de embarque", "Descontos exclusivos de hotéis"], correctIndex: 0, explanation: "Os pontos são recompensas oferecidas por bancos ou sites parceiros." },
  { id: "review-milhas-03", documentId: "milhas", prompt: "Um milheiro corresponde a qual quantidade?", options: ["100 milhas", "500 milhas", "1.000 milhas", "10.000 milhas"], correctIndex: 2, explanation: "Um milheiro equivale a 1.000 milhas." },
  { id: "review-milhas-04", documentId: "milhas", prompt: "15 mil milhas equivalem a quantos milheiros?", options: ["1,5 milheiros", "15 milheiros", "150 milheiros", "1.500 milheiros"], correctIndex: 1, explanation: "15.000 milhas divididas por 1.000 correspondem a 15 milheiros." },
  { id: "review-milhas-05", documentId: "milhas", prompt: "Qual faixa é citada para o milheiro LATAM?", options: ["R$ 13 a R$ 15", "R$ 14 a R$ 18", "R$ 22 a R$ 25", "Até R$ 55"], correctIndex: 2, explanation: "O material cita a faixa de R$ 22 a R$ 25 para o milheiro LATAM." },
  { id: "review-programas-01", documentId: "programas", prompt: "Quem cria os programas de fidelidade apresentados?", options: ["Bancos", "Companhias aéreas", "Agências de turismo", "Hotéis"], correctIndex: 1, explanation: "Os programas apresentados são criados pelas companhias aéreas para recompensar clientes." },
  { id: "review-programas-02", documentId: "programas", prompt: "Segundo o PDF, qual é o custo para fazer o cadastro nos programas?", options: ["É gratuito", "Custa R$ 10", "Exige assinatura mensal", "Depende do cartão de crédito"], correctIndex: 0, explanation: "O material incentiva o cadastro e informa que ele é gratuito." },
  { id: "review-programas-03", documentId: "programas", prompt: "Qual é o programa de fidelidade da GOL mostrado no material?", options: ["TudoAzul", "LATAM Pass", "Smiles", "Iberia Plus"], correctIndex: 2, explanation: "Smiles é o programa de fidelidade associado à GOL." },
  { id: "review-programas-04", documentId: "programas", prompt: "Qual programa é associado à companhia Azul?", options: ["TudoAzul", "Smiles", "LATAM Pass", "Qatar Airways"], correctIndex: 0, explanation: "TudoAzul é o programa de fidelidade da Azul." },
  { id: "review-programas-05", documentId: "programas", prompt: "Qual programa aparece associado à LATAM?", options: ["Avios", "LATAM Pass", "Smiles", "TudoAzul"], correctIndex: 1, explanation: "O PDF identifica LATAM Pass como o programa de fidelidade da LATAM." },
];

export const lesson01ChallengeQuestions: LessonQuestion[] = [
  { id: "challenge-milhas-01", documentId: "milhas", prompt: "Qual alternativa separa corretamente pontos e milhas?", options: ["Pontos são recompensas de bancos/parceiros; milhas são a moeda dos programas de fidelidade", "Milhas são recompensas de bancos; pontos são a moeda das companhias", "São sempre exatamente a mesma coisa", "Pontos só existem após uma viagem internacional"], correctIndex: 0, explanation: "O material diferencia a origem dos pontos da função das milhas nos programas." },
  { id: "challenge-milhas-02", documentId: "milhas", prompt: "Uma pessoa possui 45.000 milhas. Quantos milheiros ela possui?", options: ["4,5", "45", "450", "4.500"], correctIndex: 1, explanation: "45.000 dividido por 1.000 resulta em 45 milheiros." },
  { id: "challenge-milhas-03", documentId: "milhas", prompt: "Qual grupo é citado com milheiro podendo chegar a R$ 55?", options: ["GOL, Azul e LATAM", "Iberia, British e Qatar", "Smiles, TudoAzul e LATAM Pass", "GOL, TAP e Azul"], correctIndex: 1, explanation: "Iberia, British e Qatar aparecem no material com valor de até R$ 55 por milheiro." },
  { id: "challenge-milhas-04", documentId: "milhas", prompt: "Qual é a lógica mostrada para calcular o valor do milheiro?", options: ["Valor pago dividido pela quantidade de milhas", "Quantidade de milhas multiplicada por 100", "Valor pago menos a taxa de embarque", "Quantidade de pontos dividida pelo cartão"], correctIndex: 0, explanation: "A página de cálculo mostra a relação entre valor pago e quantidade de milhas." },
  { id: "challenge-milhas-05", documentId: "milhas", prompt: "Qual faixa de preço é indicada para o milheiro GOL?", options: ["R$ 13 a R$ 15", "R$ 14 a R$ 18", "R$ 22 a R$ 25", "Até R$ 35"], correctIndex: 0, explanation: "O material cita R$ 13 a R$ 15 para o milheiro GOL." },
  { id: "challenge-programas-01", documentId: "programas", prompt: "Qual associação está correta conforme o material?", options: ["Smiles - GOL", "Smiles - Azul", "TudoAzul - LATAM", "LATAM Pass - Iberia"], correctIndex: 0, explanation: "Smiles é apresentado como o programa de fidelidade da GOL." },
  { id: "challenge-programas-02", documentId: "programas", prompt: "Qual dupla reúne programas mostrados no segundo PDF?", options: ["TudoAzul e LATAM Pass", "Livelo e Esfera", "ConnectMiles e AAdvantage", "Miles&Go e TAP Miles"], correctIndex: 0, explanation: "TudoAzul e LATAM Pass são dois dos programas mostrados no material." },
  { id: "challenge-programas-03", documentId: "programas", prompt: "Além de Smiles, TudoAzul e LATAM Pass, qual programa é citado?", options: ["Iberia Plus", "Esfera", "Livelo", "C6 Átomos"], correctIndex: 0, explanation: "O PDF também apresenta o programa Iberia Plus." },
  { id: "challenge-programas-04", documentId: "programas", prompt: "Qual ação o PDF recomenda fazer agora em relação aos programas?", options: ["Fazer o cadastro gratuito", "Comprar milhas imediatamente", "Assinar todos os clubes", "Cancelar o cartão"], correctIndex: 0, explanation: "O material recomenda fazer o cadastro, que é gratuito." },
  { id: "challenge-programas-05", documentId: "programas", prompt: "Qual companhia também aparece identificada pelo seu programa no material?", options: ["Qatar Airways", "Lufthansa", "Emirates", "Air France"], correctIndex: 0, explanation: "Qatar Airways aparece entre os programas principais apresentados." },
];
