'use strict';

import { validarEmail } from '@/lib/validators';

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

export interface Plano {
  id: number;
  nome: string;
  tipo: 'fixo' | 'personalizado';
  descricao?: string;
  preco?: number;
  valor_por_funcionario?: number;
  limite_funcionarios?: number;
  ativo?: boolean;
  caracteristicas?: string[] | Record<string, any>;
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

  if (!validarEmail(email)) {
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

  if (!validarEmail(email)) {
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
CONTRATO DE PRESTAÇÃO DE SERVIÇOS - PLATAFORMA QWORK – AVALIAÇÃO DE RISCO PSICOSSOCIAL ORGANIZACIONAL

Pelo presente instrumento particular, de um lado, QWORK TECNOLOGIA E GESTÃO DE RISCOS LTDA, pessoa jurídica de direito privado, inscrita no CNPJ sob nº [●], com sede em [●], doravante denominada CONTRATADA, e, na qualidade de interveniente gestora, MEUCLUBE.ONLINE BENEFÍCIOS E VANTAGENS LTDA, pessoa jurídica de direito privado, inscrita no CNPJ sob nº 21.020.277/0001-56, com sede na Rua Barão do Serro Azul, nº 198, 5º andar, Centro, Curitiba/PR, doravante denominada GESTORA, e, de outro lado, a CONTRATANTE, pessoa jurídica que realiza cadastro e contratação da plataforma mediante aceite eletrônico, têm entre si justo e acordado o presente contrato, que se regerá pelas cláusulas seguintes:

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

CLÁUSULA 1 – DO OBJETO

O presente contrato tem por objeto a disponibilização da plataforma digital QWORK, destinada à aplicação de questionário estruturado de avaliação psicossocial organizacional, com posterior geração de relatório analítico consolidado, voltado à gestão preventiva de riscos psicossociais no ambiente de trabalho.

Parágrafo único. A ferramenta possui finalidade exclusivamente organizacional, estatística e preventiva, em conformidade com as diretrizes da Norma Regulamentadora nº 1 (NR-1), não possuindo caráter clínico ou assistencial.

CLÁUSULA 2 – DA NATUREZA DO SERVIÇO

A CONTRATANTE declara ciência de que:
I – a plataforma não realiza diagnóstico psicológico ou psiquiátrico individual;
II – não realiza atendimento clínico, terapêutico ou médico;
III – não substitui avaliação profissional individualizada;
IV – os relatórios gerados possuem natureza exclusivamente organizacional, coletiva e estatística.

CLÁUSULA 3 – DO FUNCIONAMENTO DA PLATAFORMA

A utilização da plataforma ocorrerá mediante:
I – cadastro da empresa CONTRATANTE;
II – inclusão dos colaboradores pela própria CONTRATANTE;
III – acesso individual mediante autenticação por CPF e data de nascimento;
IV – preenchimento do questionário psicossocial;
V – consolidação e tratamento dos dados coletados.

CLÁUSULA 4 – DA ADESÃO MÍNIMA E EMISSÃO DE RELATÓRIO

A CONTRATANTE declara ciência de que a geração do relatório organizacional consolidado está condicionada à participação mínima de 70% (setenta por cento) dos colaboradores cadastrados.
Parágrafo primeiro. O percentual mínimo estabelecido visa garantir consistência estatística e validade técnica dos dados.
Parágrafo segundo. O faturamento será realizado com base na totalidade dos colaboradores cadastrados, independentemente do percentual de adesão efetivamente atingido.
Parágrafo terceiro. A não obtenção do percentual mínimo de adesão não configura inadimplemento da CONTRATADA.
Parágrafo quarto. Compete exclusivamente à CONTRATANTE promover o engajamento dos colaboradores.

CLÁUSULA 5 – DAS RESPONSABILIDADES DA CONTRATANTE

Compete à CONTRATANTE:
I – fornecer dados corretos e atualizados;
II – comunicar adequadamente seus colaboradores;
III – garantir autenticidade das respostas;
IV – utilizar os relatórios exclusivamente para fins organizacionais;
V – adotar medidas internas decorrentes da análise dos resultados.

CLÁUSULA 6 – DAS RESPONSABILIDADES DA QWORK

Compete à CONTRATADA:
I – disponibilizar a plataforma em funcionamento regular;
II – adotar medidas técnicas razoáveis de segurança da informação;
III – processar os dados e gerar relatório consolidado;
IV – observar a legislação aplicável.

CLÁUSULA 7 – DA LIMITAÇÃO DE RESPONSABILIDADE

A QWORK não se responsabiliza por:
I – decisões administrativas da CONTRATANTE;
II – dados incorretos fornecidos;
III – uso inadequado das informações;
IV – ausência de adesão dos colaboradores;
V – resultados interpretativos adotados pela CONTRATANTE.

CLÁUSULA 8 – DA GESTÃO OPERACIONAL E COMERCIAL

A CONTRATANTE declara ciência de que a gestão operacional, comercial e administrativa da plataforma poderá ser realizada pela empresa MEUCLUBE.ONLINE BENEFÍCIOS E VANTAGENS LTDA, integrante do mesmo grupo econômico da CONTRATADA, sem que isso implique transferência de responsabilidade técnica ou jurídica pela prestação do serviço.

CLÁUSULA 9 – DA RESPONSABILIDADE PELO TRATAMENTO DE DADOS E SEGURANÇA DAS INFORMAÇÕES

A CONTRATANTE declara, para todos os fins, que atua na condição de Controladora dos dados pessoais de seus colaboradores, sendo integralmente responsável pela coleta, base legal, veracidade, legitimidade e segurança das informações inseridas na plataforma.
Parágrafo primeiro. Compete exclusivamente à CONTRATANTE adotar medidas administrativas, técnicas e organizacionais adequadas para garantir a proteção dos dados pessoais sob sua responsabilidade.
Parágrafo segundo. A CONTRATADA não será responsável por incidentes de segurança, vazamentos, acessos indevidos ou qualquer forma de uso inadequado dos dados que decorram de falha, negligência, imprudência ou descumprimento das obrigações legais por parte da CONTRATANTE.
Parágrafo terceiro. A CONTRATANTE se responsabiliza integralmente por quaisquer danos, prejuízos, sanções administrativas ou reclamações judiciais decorrentes do tratamento indevido dos dados sob sua responsabilidade, obrigando-se a ressarcir a CONTRATADA por eventuais prejuízos.
Parágrafo quarto. A CONTRATADA compromete-se a adotar medidas técnicas razoáveis de segurança da informação no âmbito da plataforma, limitadas à sua atuação como operadora, nos termos da Lei nº 13.709/2018.

CLÁUSULA 10 – DA NATUREZA JURÍDICA

O presente contrato possui natureza estritamente civil, inexistindo vínculo trabalhista, societário ou de representação entre as partes.

CLÁUSULA 11 – DO ACEITE ELETRÔNICO

O presente contrato será considerado integralmente aceito no momento do primeiro acesso à plataforma.

CLÁUSULA 12 – DA ASSINATURA DIGITAL

As partes reconhecem como válida a assinatura eletrônica, nos termos da MP nº 2.200-2/2001 e Lei nº 14.063/2020.

CLÁUSULA 13 – DO FORO

Fica eleito o foro da comarca de Curitiba/PR, com renúncia expressa de qualquer outro, por mais privilegiado que seja.

_______________________________
CONTRATANTE
${dadosTomador.nome}

_______________________________
CONTRATADA
QWORK TECNOLOGIA E GESTÃO DE RISCOS LTDA
CNPJ: [●]

${dadosTomador.cidade}/${dadosTomador.estado}, ${dataAtual}
`.trim();
};
