/**
 * Helpers para geração de contratos e recibos
 *
 * Este módulo separa a lógica de geração de:
 * 1. Contratos neutros (foco em prestação de serviço)
 * 2. Recibos financeiros (valores, vigência, parcelas)
 */

interface Dadostomador {
  nome: string;
  cnpj: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  responsavel_nome: string;
  responsavel_cpf: string;
  responsavel_cargo?: string;
}

/**
 * Gera contrato padrão neutro (sem valores financeiros)
 * Conteúdo baseado no CONTRATO_PS.txt oficial
 */
export function gerarContratoNeutro(tomador: Dadostomador): string {
  const dataAtual = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return `
CONTRATO DE PRESTAÇÃO DE SERVIÇOS - PLATAFORMA QWORK – AVALIAÇÃO DE RISCO PSICOSSOCIAL ORGANIZACIONAL

Pelo presente instrumento particular, de um lado, QWORK TECNOLOGIA E GESTÃO DE RISCOS LTDA, pessoa jurídica de direito privado, inscrita no CNPJ sob nº [●], com sede em [●], doravante denominada CONTRATADA, e, na qualidade de interveniente gestora, MEUCLUBE.ONLINE BENEFÍCIOS E VANTAGENS LTDA, pessoa jurídica de direito privado, inscrita no CNPJ sob nº 21.020.277/0001-56, com sede na Rua Barão do Serro Azul, nº 198, 5º andar, Centro, Curitiba/PR, doravante denominada GESTORA, e, de outro lado, a CONTRATANTE, pessoa jurídica que realiza cadastro e contratação da plataforma mediante aceite eletrônico, têm entre si justo e acordado o presente contrato, que se regerá pelas cláusulas seguintes:

CONTRATANTE: ${tomador.nome}
CNPJ: ${tomador.cnpj}
${tomador.endereco ? `Endereço: ${tomador.endereco}, ${tomador.cidade}/${tomador.estado}, CEP: ${tomador.cep}` : ''}
Representado por: ${tomador.responsavel_nome}
CPF: ${tomador.responsavel_cpf}
${tomador.responsavel_cargo ? `Cargo: ${tomador.responsavel_cargo}` : ''}

Data: ${dataAtual}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 1 – DO OBJETO

O presente contrato tem por objeto a disponibilização da plataforma digital QWORK, destinada à aplicação de questionário estruturado de avaliação psicossocial organizacional, com posterior geração de relatório analítico consolidado, voltado à gestão preventiva de riscos psicossociais no ambiente de trabalho.

Parágrafo único. A ferramenta possui finalidade exclusivamente organizacional, estatística e preventiva, em conformidade com as diretrizes da Norma Regulamentadora nº 1 (NR-1), não possuindo caráter clínico ou assistencial.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 2 – DA NATUREZA DO SERVIÇO

A CONTRATANTE declara ciência de que:

I – a plataforma não realiza diagnóstico psicológico ou psiquiátrico individual;
II – não realiza atendimento clínico, terapêutico ou médico;
III – não substitui avaliação profissional individualizada;
IV – os relatórios gerados possuem natureza exclusivamente organizacional, coletiva e estatística.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 3 – DO FUNCIONAMENTO DA PLATAFORMA

A utilização da plataforma ocorrerá mediante:

I – cadastro da empresa CONTRATANTE;
II – inclusão dos colaboradores pela própria CONTRATANTE;
III – acesso individual mediante autenticação por CPF e data de nascimento;
IV – preenchimento do questionário psicossocial;
V – consolidação e tratamento dos dados coletados.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 4 – DA EVOLUÇÃO DA PLATAFORMA

A CONTRATADA poderá, a seu critério, promover atualizações, melhorias e modificações na plataforma, sem que isso implique alteração da natureza do serviço contratado.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 5 – DA ADESÃO MÍNIMA E EMISSÃO DE RELATÓRIO

A CONTRATANTE declara ciência de que a geração do relatório organizacional consolidado está condicionada à participação mínima de 70% (setenta por cento) dos colaboradores cadastrados.

Parágrafo primeiro. O percentual mínimo estabelecido visa garantir consistência estatística e validade técnica dos dados.
Parágrafo segundo. O faturamento será realizado com base na totalidade dos colaboradores cadastrados, independentemente do percentual de adesão efetivamente atingido.
Parágrafo terceiro. A não obtenção do percentual mínimo de adesão não configura inadimplemento da CONTRATADA.
Parágrafo quarto. Compete exclusivamente à CONTRATANTE promover o engajamento dos colaboradores.
Decorridos 90 (noventa) dias da ativação da plataforma, caso não haja emissão de relatórios, será devida cobrança mínima no valor de R$ 250,00 (duzentos e cinquenta reais).
A cobrança independe da efetiva utilização da plataforma, considerando a disponibilização do serviço.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 6 – DAS RESPONSABILIDADES DA CONTRATANTE

Compete à CONTRATANTE:

I – fornecer dados corretos e atualizados;
II – comunicar adequadamente seus colaboradores;
III – garantir autenticidade das respostas;
IV – utilizar os relatórios exclusivamente para fins organizacionais;
V – adotar medidas internas decorrentes da análise dos resultados.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 7 – DAS RESPONSABILIDADES DA QWORK

Compete à CONTRATADA:

I – disponibilizar a plataforma em funcionamento regular;
II – adotar medidas técnicas razoáveis de segurança da informação;
III – processar os dados e gerar relatório consolidado;
IV – observar a legislação aplicável.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 8 – DA LIMITAÇÃO DE RESPONSABILIDADE

A QWORK não se responsabiliza por:

I – decisões administrativas da CONTRATANTE;
II – dados incorretos fornecidos;
III – uso inadequado das informações;
IV – ausência de adesão dos colaboradores;
V – resultados interpretativos adotados pela CONTRATANTE.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 9 – DA GESTÃO OPERACIONAL E COMERCIAL

A CONTRATANTE declara ciência de que a gestão operacional, comercial e administrativa da plataforma poderá ser realizada pela empresa MEUCLUBE.ONLINE BENEFÍCIOS E VANTAGENS LTDA, integrante do mesmo grupo econômico da CONTRATADA, sem que isso implique transferência de responsabilidade técnica ou jurídica pela prestação do serviço.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 10 – DA SUSPENSÃO DE ACESSO

A CONTRATADA poderá suspender o acesso à plataforma em caso de inadimplemento, uso indevido ou descumprimento contratual.
A suspensão não afasta a obrigação de pagamento dos valores contratados.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 11 – DA RESPONSABILIDADE PELO TRATAMENTO DE DADOS E SEGURANÇA DAS INFORMAÇÕES

A CONTRATANTE declara, para todos os fins, que atua na condição de Controladora dos dados pessoais de seus colaboradores, sendo integralmente responsável pela coleta, base legal, veracidade, legitimidade e segurança das informações inseridas na plataforma.

Parágrafo primeiro. Compete exclusivamente à CONTRATANTE adotar medidas administrativas, técnicas e organizacionais adequadas para garantir a proteção dos dados pessoais sob sua responsabilidade, especialmente no que se refere ao acesso, compartilhamento interno, armazenamento e uso das informações.
Parágrafo segundo. A CONTRATADA não será responsável por incidentes de segurança, vazamentos, acessos indevidos ou qualquer forma de uso inadequado dos dados que decorram de falha, negligência, imprudência ou descumprimento das obrigações legais por parte da CONTRATANTE.
Parágrafo terceiro. A CONTRATANTE se responsabiliza integralmente por quaisquer danos, prejuízos, sanções administrativas ou reclamações judiciais decorrentes do tratamento indevido dos dados sob sua responsabilidade, obrigando-se a ressarcir a CONTRATADA por eventuais prejuízos que venha a sofrer em razão de tais ocorrências.
Parágrafo quarto. A CONTRATADA compromete-se a adotar medidas técnicas razoáveis de segurança da informação no âmbito da plataforma, limitadas à sua atuação como operadora, nos termos da Lei nº 13.709/2018.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 12 – DA NATUREZA JURÍDICA

O presente contrato possui natureza estritamente civil, inexistindo vínculo trabalhista, societário ou de representação entre as partes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 13 – DA VIGÊNCIA E RESCISÃO

O contrato terá vigência mínima de 90 (noventa) dias.
A rescisão antecipada por iniciativa da CONTRATANTE antes do prazo mínimo implicará pagamento de multa equivalente ao valor restante do período contratado.
A utilização da plataforma sem a correspondente emissão de relatórios ou cumprimento da finalidade contratada não afasta a obrigação de pagamento.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 14 – DA PROPRIEDADE INTELECTUAL

A plataforma QWORK, incluindo seu código-fonte, estrutura, metodologia, banco de dados, layout, fluxos operacionais e relatórios, constitui propriedade exclusiva da CONTRATADA.
É expressamente vedado à CONTRATANTE:

I – copiar, reproduzir, modificar ou adaptar a plataforma;
II – realizar engenharia reversa, descompilação ou qualquer tentativa de acesso à estrutura interna do sistema;
III – utilizar as informações, metodologia ou lógica da plataforma para desenvolvimento de soluções concorrentes;
IV – ceder, sublicenciar ou disponibilizar o sistema a terceiros fora das condições contratadas.

O descumprimento desta cláusula sujeitará a CONTRATANTE ao pagamento de multa equivalente a 10 (dez) vezes o valor total contratado, sem prejuízo de perdas e danos.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 15 – DO ACEITE ELETRÔNICO

A adesão ao presente contrato ocorrerá mediante aceite eletrônico realizado pela CONTRATANTE na plataforma, por meio de ação inequívoca, como seleção de checkbox ou clique em botão de confirmação.
Tal aceite constitui manifestação válida de vontade, produzindo todos os efeitos legais, nos termos da legislação vigente.
A CONTRATANTE declara que teve acesso prévio ao contrato e concorda integralmente com seus termos.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 16 – DA ASSINATURA DIGITAL

As partes reconhecem como válida a assinatura eletrônica, nos termos da MP nº 2.200-2/2001 e Lei nº 14.063/2020.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 17 – DO FORO

Fica eleito o foro da comarca de Curitiba/PR, com renúncia expressa de qualquer outro, por mais privilegiado que seja.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

E por estarem de acordo, as partes assinam digitalmente o presente contrato.

_____________________________________
${tomador.nome}
CONTRATANTE
CNPJ: ${tomador.cnpj}

_____________________________________
QWORK TECNOLOGIA E GESTÃO DE RISCOS LTDA
CONTRATADA
CNPJ: [●]

Data de aceite: [A SER PREENCHIDA DIGITALMENTE]
IP de aceite: [A SER REGISTRADO AUTOMATICAMENTE]
`;
}

/**
 * Gera conteúdo textual do recibo financeiro
 * Inclui: vigência, valores, parcelas, forma de pagamento
 */
export function gerarTextoRecibo(dados: {
  numero_recibo: string;
  tomador: Dadostomador;
  vigencia_inicio: string;
  vigencia_fim: string;
  numero_funcionarios: number;
  valor_total: number;
  valor_por_funcionario: number | null;
  forma_pagamento: string;
  descricao_pagamento: string;
}): string {
  const dataEmissao = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
               RECIBO DE PAGAMENTO - QWORK
         Sistema de Avaliação Psicossocial
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Número do Recibo: ${dados.numero_recibo}
Data de Emissão: ${dataEmissao}

tomador
Nome/Razão Social: ${dados.tomador.nome}
CNPJ: ${dados.tomador.cnpj}
Responsável: ${dados.tomador.responsavel_nome}
CPF Responsável: ${dados.tomador.responsavel_cpf}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DETALHES DO SERVIÇO CONTRATADO

Serviço: Avaliação Psicossocial Organizacional - QWork

VIGÊNCIA DO CONTRATO
Data de Início: ${new Date(dados.vigencia_inicio).toLocaleDateString('pt-BR')}
Data de Término: ${new Date(dados.vigencia_fim).toLocaleDateString('pt-BR')}
Período: 364 dias

COBERTURA
Número de Funcionários Cobertos: ${dados.numero_funcionarios}
${dados.valor_por_funcionario ? `Valor por Funcionário: R$ ${dados.valor_por_funcionario.toFixed(2).replace('.', ',')}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INFORMAÇÕES FINANCEIRAS

Valor Total Anual: R$ ${dados.valor_total.toFixed(2).replace('.', ',')}

FORMA DE PAGAMENTO
${dados.descricao_pagamento}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DECLARAÇÃO

Declaramos ter recebido o valor acima descrito referente à prestação de serviços de avaliação psicossocial através da plataforma Qwork, conforme contrato de prestação de serviços firmado anteriormente.

Este recibo é comprovante de pagamento e deve ser guardado para fins de controle financeiro e tributário.

Em caso de dúvidas, entre em contato através de:
Email: contato@qwork.com.br
Telefone: [A DEFINIR]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Qwork - Sistema de Avaliação Psicossocial
CNPJ: [A DEFINIR]
Endereço: [A DEFINIR]

Documento gerado automaticamente em ${dataEmissao}
`;
}

/**
 * Valida dados antes de gerar contrato
 */
export function validarDadosContrato(tomador: Dadostomador): {
  valido: boolean;
  erros: string[];
} {
  const erros: string[] = [];

  if (!tomador.nome || tomador.nome.trim().length < 3) {
    erros.push('Nome do tomador inválido');
  }

  if (!tomador.cnpj || tomador.cnpj.length < 14) {
    erros.push('CNPJ inválido');
  }

  if (!tomador.responsavel_nome || tomador.responsavel_nome.trim().length < 3) {
    erros.push('Nome do responsável inválido');
  }

  if (!tomador.responsavel_cpf || tomador.responsavel_cpf.length < 11) {
    erros.push('CPF do responsável inválido');
  }

  return {
    valido: erros.length === 0,
    erros,
  };
}
