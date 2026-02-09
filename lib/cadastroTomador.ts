'use strict';

import { formatarValor } from '@/lib/validacoes-contratacao';

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

export interface Plano {
  id: number;
  nome: string;
  descricao?: string;
  preco: number | string;
  tipo: string;
  caracteristicas?: Record<string, any>;
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

  // Se a flag de ambiente NEXT_PUBLIC_DISABLE_ANEXOS estiver ativa, não exigir anexos
  if (process.env.NEXT_PUBLIC_DISABLE_ANEXOS !== 'true') {
    if (!arquivos.cartao_cnpj || !arquivos.contrato_social) {
      return {
        ok: false,
        error: 'Cartão CNPJ e Contrato Social são obrigatórios',
      };
    }
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

  // Se a flag de ambiente NEXT_PUBLIC_DISABLE_ANEXOS estiver ativa, não exigir anexos
  if (process.env.NEXT_PUBLIC_DISABLE_ANEXOS !== 'true') {
    if (!arquivos.doc_identificacao) {
      return { ok: false, error: 'Documento de identificação é obrigatório' };
    }
  }

  return { ok: true };
};

export const gerarContratoSimulado = (params: {
  plano: Plano;
  dadosTomador: DadosTomador;
  dadosResponsavel: DadosResponsavel;
  numeroFuncionarios: number;
  tipo: TipoEntidade;
}): string => {
  const { plano, dadosTomador, dadosResponsavel, numeroFuncionarios, tipo } =
    params;

  if (!plano) return '';

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

  const precoNum = Number(plano.preco) || 0;

  return `\nCONTRATO DE PRESTAÇÃO DE SERVIÇOS - QWORK\n\nPelo presente instrumento particular de contrato de prestação de serviços, celebrado nesta data ${dataAtual}, entre:\n\ntomador: ${dadosTomador.nome}\nCNPJ: ${dadosTomador.cnpj}\nTipo: ${tipoLabel}\nEndereço: ${dadosTomador.endereco}, ${dadosTomador.cidade}/${dadosTomador.estado}\nEmail: ${dadosTomador.email}\nTelefone: ${dadosTomador.telefone}\n\nRepresentada por:\nNome: ${dadosResponsavel.nome}\nCPF: ${dadosResponsavel.cpf}\nCargo: ${dadosResponsavel.cargo || 'Não informado'}\nEmail: ${dadosResponsavel.email}\n\nCONTRATADA: QWORK LTDA\nCNPJ: 00.000.000/0001-00\nEndereço: [Endereço da QWork]\n\nCLÁUSULA PRIMEIRA - DO OBJETO\nO presente contrato tem por objeto a prestação de serviços de avaliação psicossocial baseada no questionário COPSOQ III, incluindo módulos de Jogos de Apostas e Endividamento Financeiro.\n\nCLÁUSULA SEGUNDA - DO PLANO CONTRATADO\nPlano: ${plano.nome}\nDescrição: ${plano.descricao || 'Plano de avaliação psicossocial'}\n${plano.tipo === 'fixo' ? `Valor unitário anual por funcionário: ${formatarValor(precoNum)}\nValor total anual (para ${numeroFuncionarios} funcionário(s)): ${formatarValor(precoNum * numeroFuncionarios)}` : `Valor: ${formatarValor(precoNum)}`}\nTipo: ${plano.tipo === 'fixo' ? 'Valor Fixo Anual por Funcionário' : 'Personalizado por Funcionário'}\n\nCLÁUSULA TERCEIRA - DOS SERVIÇOS\nA CONTRATADA se obriga a fornecer:\n- Acesso à plataforma web/mobile para aplicação das avaliações\n- Processamento automatizado dos questionários\n- Geração de relatórios e laudos técnicos\n- Suporte técnico conforme especificado no plano\n- Armazenamento seguro de dados conforme LGPD\n\nCLÁUSULA QUARTA - DAS OBRIGAÇÕES DA tomador\nA tomador se obriga a:\n- Fornecer informações corretas e atualizadas\n- Respeitar os termos de uso da plataforma\n- Efetuar os pagamentos nas datas acordadas\n- Manter confidencialidade das informações\n\nCLÁUSULA QUINTA - DO PAGAMENTO\nO pagamento será efetuado ${plano.tipo === 'fixo' ? 'anualmente' : 'conforme negociação do plano'}, através de boleto bancário, cartão de crédito ou transferência bancária, conforme opção da tomador.\n${plano.caracteristicas?.parcelas_max ? `Parcelamento: até ${plano.caracteristicas.parcelas_max}x sem juros.` : ''}\n\n\nCLÁUSULA SEXTA - DA VIGÊNCIA\nEste contrato tem vigência de 12 (doze) meses a partir da data de assinatura, renovando-se automaticamente por períodos iguais, salvo manifestação contrária com antecedência mínima de 30 (trinta) dias.\n\nCLÁUSULA SÉTIMA - DA PROTEÇÃO DE DADOS (LGPD)\nAs partes se comprometem a cumprir integralmente a Lei Geral de Proteção de Dados (Lei 13.709/2018), garantindo a segurança e privacidade dos dados pessoais tratados.\n\nCLÁUSULA OITAVA - DO FORO\nFica eleito o foro da comarca de [Cidade], para dirimir quaisquer questões oriundas deste contrato.\n\nE, por estarem assim justos e contratados, assinam o presente instrumento em 2 (duas) vias de igual teor e forma.\n\n[Cidade], ${dataAtual}\n\n_______________________________\ntomador\n${dadosTomador.nome}\n\n_______________________________\nCONTRATADA\nQWORK LTDA\n`.trim();
};
