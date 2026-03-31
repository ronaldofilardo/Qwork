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
CONTRATO DE PRESTAÇÃO DE SERVIÇOS
PLATAFORMA QWORK – AVALIAÇÃO DE RISCO PSICOSSOCIAL ORGANIZACIONAL

CONTRATADA: MEUCLUBE.ONLINE BENEFÍCIOS E VANTAGENS LTDA., pessoa jurídica de direito privado, inscrita no CNPJ sob nº 21.020.277/0001-56, com sede na Rua Barão do Serro Azul, nº 198, 5º andar, Centro, Curitiba/PR, doravante denominada QWORK ou CONTRATADA.

CONTRATANTE: ${tomador.nome}
CNPJ: ${tomador.cnpj}
${tomador.endereco ? `Endereço: ${tomador.endereco}, ${tomador.cidade}/${tomador.estado}, CEP: ${tomador.cep}` : ''}
Representado por: ${tomador.responsavel_nome}
CPF: ${tomador.responsavel_cpf}
${tomador.responsavel_cargo ? `Cargo: ${tomador.responsavel_cargo}` : ''}

Data: ${dataAtual}

As partes celebram o presente contrato mediante as cláusulas e condições seguintes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 1 – OBJETO

O presente contrato tem por objeto a disponibilização da plataforma digital QWORK, destinada à aplicação de questionário estruturado de avaliação psicossocial organizacional e geração de relatório analítico consolidado voltado à gestão preventiva de riscos psicossociais no ambiente de trabalho.

Parágrafo único. A ferramenta possui finalidade exclusivamente organizacional, estatística e preventiva, sendo utilizada como instrumento de apoio à gestão de riscos psicossociais, em conformidade com as diretrizes da Norma Regulamentadora nº 1 (NR-1).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 2 – NATUREZA DO SERVIÇO

A CONTRATANTE declara estar ciente de que:

I – a plataforma não realiza diagnóstico psicológico ou psiquiátrico individual;
II – não realiza atendimento clínico ou terapêutico;
III – não substitui avaliação médica ou psicológica;
IV – o relatório gerado possui natureza exclusivamente organizacional e coletiva.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 3 – FUNCIONAMENTO DA PLATAFORMA

A utilização da plataforma ocorrerá mediante:

I – cadastro da empresa contratante;
II – inclusão de colaboradores pela própria empresa;
III – acesso individual dos colaboradores mediante autenticação por CPF e data de nascimento;
IV – preenchimento do questionário psicossocial;
V – geração de relatório organizacional consolidado.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 4 – RESPONSABILIDADES DA CONTRATANTE

Compete à CONTRATANTE:

I – fornecer dados corretos de seus colaboradores;
II – informar os colaboradores sobre a finalidade da avaliação;
III – garantir que o acesso seja realizado pelo próprio colaborador;
IV – utilizar os relatórios exclusivamente para fins organizacionais e preventivos.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 5 – RESPONSABILIDADES DA QWORK

Compete à QWORK:

I – manter a plataforma em funcionamento;
II – garantir medidas técnicas razoáveis de segurança da informação;
III – gerar relatório organizacional consolidado com base nas respostas coletadas;
IV – tratar os dados conforme a legislação aplicável.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 6 – LIMITAÇÃO DE RESPONSABILIDADE

A QWORK não se responsabiliza por:

I – decisões administrativas tomadas pela empresa com base nos relatórios;
II – dados incorretos fornecidos pela empresa ou pelos colaboradores;
III – utilização inadequada das informações geradas pela plataforma.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 7 – PROTEÇÃO DE DADOS

O tratamento de dados observará a Lei nº 13.709/2018 (LGPD).

Parágrafo primeiro. A empresa contratante atua como Controladora dos dados pessoais de seus colaboradores.

Parágrafo segundo. A QWORK atua como Operadora da plataforma tecnológica, realizando o tratamento de dados conforme instruções da empresa contratante.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 8 – ACEITE ELETRÔNICO

O presente contrato será considerado aceito eletronicamente no momento do primeiro login do gestor da empresa na plataforma.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 9 – FORO

Fica eleito o foro da Comarca de Curitiba/PR.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

E por estarem de acordo, as partes assinam digitalmente o presente contrato.

_____________________________________
${tomador.nome}
CONTRATANTE
CNPJ: ${tomador.cnpj}

_____________________________________
MEUCLUBE.ONLINE BENEFÍCIOS E VANTAGENS LTDA.
CONTRATADA (QWORK)
CNPJ: 21.020.277/0001-56

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
