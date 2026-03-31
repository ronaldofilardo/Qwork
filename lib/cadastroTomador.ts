'use strict';

export type TipoEntidade = 'clinica' | 'entidade';

export interface DadosTomador {
  nome: string;
  cnpj: string;
  inscricao_estadual?: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
}

// Alias para compatibilidade com código antigo
export type Dadostomador = DadosTomador;

export interface DadosResponsavel {
  nome: string;
  cpf: string;
  cargo?: string;
  email: string;
  celular: string;
}

export interface Arquivos {
  cartao_cnpj: File | null;
  contrato_social: File | null;
  doc_identificacao: File | null;
}

// Formatters
export const formatarCNPJ = (valor: string) => {
  const apenasNumeros = valor.replace(/\D/g, '');
  if (apenasNumeros.length <= 14) {
    return apenasNumeros
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return valor;
};

export const formatarCPF = (valor: string) => {
  const apenasNumeros = valor.replace(/\D/g, '');
  if (apenasNumeros.length <= 11) {
    return apenasNumeros
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1-$2');
  }
  return valor;
};

export const formatarTelefone = (valor: string) => {
  const apenasNumeros = valor.replace(/\D/g, '');
  if (apenasNumeros.length <= 11) {
    return apenasNumeros
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  }
  return valor;
};

export const formatarCEP = (valor: string) => {
  const apenasNumeros = valor.replace(/\D/g, '');
  if (apenasNumeros.length <= 8) {
    return apenasNumeros.replace(/(\d{5})(\d)/, '$1-$2');
  }
  return valor;
};

// Validação de CNPJ (mesma lógica do backend)
export const validarCNPJ = (cnpj: string): boolean => {
  const somente = cnpj.replace(/\D/g, '');
  if (somente.length !== 14) return false;
  if (/^(\d)\1+$/.test(somente)) return false;

  let soma = 0;
  let peso = 5;
  for (let i = 0; i < 12; i++) {
    soma += parseInt(somente[i]) * peso;
    peso = peso === 2 ? 9 : peso - 1;
  }
  const dig1 = soma % 11 < 2 ? 0 : 11 - (soma % 11);

  soma = 0;
  peso = 6;
  for (let i = 0; i < 13; i++) {
    soma += parseInt(somente[i]) * peso;
    peso = peso === 2 ? 9 : peso - 1;
  }
  const dig2 = soma % 11 < 2 ? 0 : 11 - (soma % 11);

  return dig1 === parseInt(somente[12]) && dig2 === parseInt(somente[13]);
};

// Validators
export const validarEtapaDados = (
  dadosTomador: DadosTomador,
  arquivos: Arquivos
): { ok: boolean; error?: string } => {
  const { nome, cnpj, email, telefone, endereco, cidade, estado, cep } =
    dadosTomador;

  if (!nome || nome.length < 3) {
    return {
      ok: false,
      error: 'Nome/Razão Social deve ter no mínimo 3 caracteres',
    };
  }

  if (cnpj.replace(/\D/g, '').length !== 14) {
    return { ok: false, error: 'CNPJ inválido' };
  }

  if (!email.includes('@')) {
    return { ok: false, error: 'Email inválido' };
  }

  if (telefone.replace(/\D/g, '').length < 10) {
    return { ok: false, error: 'Telefone inválido' };
  }

  if (!endereco || !cidade || !estado || !cep) {
    return { ok: false, error: 'Todos os campos de endereço são obrigatórios' };
  }

  if (!arquivos.cartao_cnpj || !arquivos.contrato_social) {
    return {
      ok: false,
      error: 'Cartão CNPJ e Contrato Social são obrigatórios',
    };
  }

  return { ok: true };
};

export const validarEtapaResponsavel = (
  dadosResponsavel: DadosResponsavel,
  arquivos: Arquivos
): { ok: boolean; error?: string } => {
  const { nome, cpf, email, celular } = dadosResponsavel;

  if (!nome || nome.length < 3) {
    return {
      ok: false,
      error: 'Nome do responsável deve ter no mínimo 3 caracteres',
    };
  }

  if (cpf.replace(/\D/g, '').length !== 11) {
    return { ok: false, error: 'CPF inválido' };
  }

  if (!email.includes('@')) {
    return { ok: false, error: 'Email inválido' };
  }

  if (celular.replace(/\D/g, '').length < 10) {
    return { ok: false, error: 'Celular inválido' };
  }

  if (!arquivos.doc_identificacao) {
    return { ok: false, error: 'Documento de identificação é obrigatório' };
  }

  return { ok: true };
};

export const gerarContratoSimulado = (params: {
  dadosTomador: DadosTomador;
  dadosResponsavel: DadosResponsavel;
  numeroFuncionarios: number;
  tipo: TipoEntidade;
}): string => {
  const { dadosTomador, dadosResponsavel, numeroFuncionarios, tipo } = params;

  if (
    !dadosTomador.nome ||
    !dadosTomador.cnpj ||
    !dadosTomador.endereco ||
    !dadosTomador.cidade ||
    !dadosTomador.estado ||
    !dadosTomador.email ||
    !dadosTomador.telefone ||
    !dadosResponsavel.nome ||
    !dadosResponsavel.cpf ||
    !dadosResponsavel.email
  ) {
    throw new Error('Dados incompletos para geração do contrato');
  }

  const dataAtual = new Date().toLocaleDateString('pt-BR');
  const tipoLabel =
    tipo === 'clinica' ? 'CLÍNICA DE MEDICINA OCUPACIONAL' : 'EMPRESA';

  return `
CONTRATO DE PRESTAÇÃO DE SERVIÇOS
PLATAFORMA QWORK – AVALIAÇÃO DE RISCO PSICOSSOCIAL ORGANIZACIONAL

CONTRATADA: MEUCLUBE.ONLINE BENEFÍCIOS E VANTAGENS LTDA., pessoa jurídica de direito privado, inscrita no CNPJ sob nº 21.020.277/0001-56, com sede na Rua Barão do Serro Azul, nº 198, 5º andar, Centro, Curitiba/PR, doravante denominada QWORK ou CONTRATADA.

CONTRATANTE: ${dadosTomador.nome}
CNPJ: ${dadosTomador.cnpj}
Tipo: ${tipoLabel}
Endereço: ${dadosTomador.endereco}, ${dadosTomador.cidade}/${dadosTomador.estado}
Email: ${dadosTomador.email}
Telefone: ${dadosTomador.telefone}

Representada por:
Nome: ${dadosResponsavel.nome}
CPF: ${dadosResponsavel.cpf}
Cargo: ${dadosResponsavel.cargo || 'Não informado'}
Email: ${dadosResponsavel.email}

Serviço: Avaliação de Risco Psicossocial Organizacional
Funcionários: ${numeroFuncionarios}

Data: ${dataAtual}

As partes celebram o presente contrato mediante as cláusulas e condições seguintes.

CLÁUSULA 1 – OBJETO

O presente contrato tem por objeto a disponibilização da plataforma digital QWORK, destinada à aplicação de questionário estruturado de avaliação psicossocial organizacional e geração de relatório analítico consolidado voltado à gestão preventiva de riscos psicossociais no ambiente de trabalho.

Parágrafo único. A ferramenta possui finalidade exclusivamente organizacional, estatística e preventiva, sendo utilizada como instrumento de apoio à gestão de riscos psicossociais, em conformidade com as diretrizes da Norma Regulamentadora nº 1 (NR-1).

CLÁUSULA 2 – NATUREZA DO SERVIÇO

A CONTRATANTE declara estar ciente de que:
I – a plataforma não realiza diagnóstico psicológico ou psiquiátrico individual;
II – não realiza atendimento clínico ou terapêutico;
III – não substitui avaliação médica ou psicológica;
IV – o relatório gerado possui natureza exclusivamente organizacional e coletiva.

CLÁUSULA 3 – FUNCIONAMENTO DA PLATAFORMA

A utilização da plataforma ocorrerá mediante:
I – cadastro da empresa contratante;
II – inclusão de colaboradores pela própria empresa;
III – acesso individual dos colaboradores mediante autenticação por CPF e data de nascimento;
IV – preenchimento do questionário psicossocial;
V – geração de relatório organizacional consolidado.

CLÁUSULA 4 – RESPONSABILIDADES DA CONTRATANTE

Compete à CONTRATANTE:
I – fornecer dados corretos de seus colaboradores;
II – informar os colaboradores sobre a finalidade da avaliação;
III – garantir que o acesso seja realizado pelo próprio colaborador;
IV – utilizar os relatórios exclusivamente para fins organizacionais e preventivos.

CLÁUSULA 5 – RESPONSABILIDADES DA QWORK

Compete à QWORK:
I – manter a plataforma em funcionamento;
II – garantir medidas técnicas razoáveis de segurança da informação;
III – gerar relatório organizacional consolidado com base nas respostas coletadas;
IV – tratar os dados conforme a legislação aplicável.

CLÁUSULA 6 – LIMITAÇÃO DE RESPONSABILIDADE

A QWORK não se responsabiliza por:
I – decisões administrativas tomadas pela empresa com base nos relatórios;
II – dados incorretos fornecidos pela empresa ou pelos colaboradores;
III – utilização inadequada das informações geradas pela plataforma.

CLÁUSULA 7 – PROTEÇÃO DE DADOS

O tratamento de dados observará a Lei nº 13.709/2018 (LGPD).
Parágrafo primeiro. A empresa contratante atua como Controladora dos dados pessoais de seus colaboradores.
Parágrafo segundo. A QWORK atua como Operadora da plataforma tecnológica, realizando o tratamento de dados conforme instruções da empresa contratante.

CLÁUSULA 8 – ACEITE ELETRÔNICO

O presente contrato será considerado aceito eletronicamente no momento do primeiro login do gestor da empresa na plataforma.

CLÁUSULA 9 – FORO

Fica eleito o foro da Comarca de Curitiba/PR.

_______________________________
CONTRATANTE
${dadosTomador.nome}

_______________________________
CONTRATADA
MEUCLUBE.ONLINE BENEFÍCIOS E VANTAGENS LTDA. (QWORK)
CNPJ: 21.020.277/0001-56

${dadosTomador.cidade}/${dadosTomador.estado}, ${dataAtual}
`.trim();
};
