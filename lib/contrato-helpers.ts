/**
 * Helpers para geração de contratos e recibos
 *
 * Este módulo separa a lógica de geração de:
 * 1. Contratos neutros (foco em prestação de serviço)
 * 2. Recibos financeiros (valores, vigência, parcelas)
 */

interface DadosContratante {
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

interface DadosPlano {
  nome: string;
  tipo: 'fixo' | 'personalizado';
  descricao?: string;
}

/**
 * Gera contrato padrão neutro (sem valores financeiros)
 * Foco: prestação de serviço, escopo, responsabilidades
 */
export function gerarContratoNeutro(
  contratante: DadosContratante,
  plano: DadosPlano
): string {
  const dataAtual = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return `
CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE AVALIAÇÃO PSICOSSOCIAL

CONTRATANTE: ${contratante.nome}
CNPJ: ${contratante.cnpj}
${contratante.endereco ? `Endereço: ${contratante.endereco}, ${contratante.cidade} - ${contratante.estado}, CEP: ${contratante.cep}` : ''}
Representado por: ${contratante.responsavel_nome}
CPF: ${contratante.responsavel_cpf}
${contratante.responsavel_cargo ? `Cargo: ${contratante.responsavel_cargo}` : ''}

CONTRATADA: Qwork - Sistema de Avaliação Psicossocial
CNPJ: [A DEFINIR]
Endereço: [A DEFINIR]

Data: ${dataAtual}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. OBJETO DO CONTRATO

O presente contrato tem por objeto a prestação de serviços de avaliação psicossocial através da plataforma Qwork, incluindo:

- Acesso à plataforma web de avaliação
- Aplicação de questionários COPSOQ III (versão média)
- Módulos complementares (Jogos de Apostas - JZ e Endividamento Financeiro - EF)
- Geração de relatórios individuais e coletivos
- Suporte técnico durante a vigência do contrato

PLANO CONTRATADO: ${plano.nome}
TIPO: ${plano.tipo === 'fixo' ? 'Plano Fixo' : 'Plano Personalizado'}
${plano.descricao ? `Descrição: ${plano.descricao}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2. RESPONSABILIDADES DA CONTRATADA

A CONTRATADA se compromete a:

a) Disponibilizar a plataforma Qwork para acesso dos funcionários da CONTRATANTE
b) Garantir a confidencialidade e segurança dos dados coletados
c) Fornecer suporte técnico em horário comercial
d) Gerar relatórios conforme especificado no plano contratado
e) Manter a plataforma disponível com uptime mínimo de 99%
f) Cumprir todas as normas da Lei Geral de Proteção de Dados (LGPD)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3. RESPONSABILIDADES DA CONTRATANTE

A CONTRATANTE se compromete a:

a) Fornecer cadastro atualizado dos funcionários a serem avaliados
b) Orientar os funcionários sobre o processo de avaliação
c) Garantir que os funcionários tenham acesso à plataforma
d) Utilizar os dados obtidos de forma ética e confidencial
e) Cumprir as condições de pagamento conforme recibo separado
f) Respeitar os direitos autorais da metodologia e plataforma

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4. VIGÊNCIA E TÉRMINO

O prazo de vigência será estabelecido no recibo de pagamento, emitido após a confirmação do pagamento.

O contrato poderá ser rescindido por qualquer das partes mediante notificação prévia de 30 dias.

Em caso de rescisão antecipada pela CONTRATANTE, não haverá reembolso proporcional.

Em caso de não renovação ao fim da vigência, o acesso à plataforma será bloqueado, mas os dados permanecerão armazenados por 5 anos conforme LGPD.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5. PROPRIEDADE INTELECTUAL

Todos os direitos autorais sobre a plataforma Qwork, metodologia COPSOQ III e materiais relacionados pertencem à CONTRATADA.

Os dados coletados são de propriedade da CONTRATANTE, respeitadas as limitações da LGPD.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

6. CONFIDENCIALIDADE E PROTEÇÃO DE DADOS

Ambas as partes se comprometem a manter sigilo sobre informações confidenciais.

A CONTRATADA é responsável pela proteção dos dados pessoais conforme LGPD (Lei 13.709/2018).

Os dados serão utilizados exclusivamente para os fins contratuais.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

7. DISPOSIÇÕES GERAIS

Este contrato está sujeito às leis brasileiras.

Questões financeiras (valores, parcelas, vencimentos) constam no RECIBO DE PAGAMENTO, documento separado emitido após confirmação do pagamento.

Quaisquer alterações devem ser formalizadas por escrito.

Foro: Comarca de [CIDADE], renunciando a qualquer outro por mais privilegiado que seja.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

E por estarem de acordo, as partes assinam digitalmente o presente contrato.

_____________________________________
${contratante.nome}
CONTRATANTE
CPF/CNPJ: ${contratante.cnpj}

_____________________________________
Qwork - Sistema de Avaliação Psicossocial
CONTRATADA
CNPJ: [A DEFINIR]

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
  contratante: DadosContratante;
  plano: DadosPlano;
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

CONTRATANTE
Nome/Razão Social: ${dados.contratante.nome}
CNPJ: ${dados.contratante.cnpj}
Responsável: ${dados.contratante.responsavel_nome}
CPF Responsável: ${dados.contratante.responsavel_cpf}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DETALHES DO SERVIÇO CONTRATADO

Plano: ${dados.plano.nome}
Tipo: ${dados.plano.tipo === 'fixo' ? 'Plano Fixo' : 'Plano Personalizado'}

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
export function validarDadosContrato(
  contratante: DadosContratante,
  plano: DadosPlano
): { valido: boolean; erros: string[] } {
  const erros: string[] = [];

  if (!contratante.nome || contratante.nome.trim().length < 3) {
    erros.push('Nome do contratante inválido');
  }

  if (!contratante.cnpj || contratante.cnpj.length < 14) {
    erros.push('CNPJ inválido');
  }

  if (
    !contratante.responsavel_nome ||
    contratante.responsavel_nome.trim().length < 3
  ) {
    erros.push('Nome do responsável inválido');
  }

  if (!contratante.responsavel_cpf || contratante.responsavel_cpf.length < 11) {
    erros.push('CPF do responsável inválido');
  }

  if (!plano.nome || plano.nome.trim().length === 0) {
    erros.push('Nome do plano inválido');
  }

  if (!['fixo', 'personalizado'].includes(plano.tipo)) {
    erros.push('Tipo de plano inválido');
  }

  return {
    valido: erros.length === 0,
    erros,
  };
}
