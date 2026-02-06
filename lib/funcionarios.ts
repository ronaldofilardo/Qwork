/**
 * FASE 3: Backend Unificado - Gestão de Funcionários
 *
 * Módulo centralizado para criação e gestão de funcionários
 * com validação estrita de vínculos por tipo de usuário.
 */

import { query } from './db';
import { normalizeCPF, validarCPF } from './validators';
import bcrypt from 'bcryptjs';

// Tipos
export type UsuarioTipo =
  | 'funcionario_clinica'
  | 'funcionario_entidade'
  | 'rh'
  | 'gestor'
  | 'admin'
  | 'emissor';

export interface DadosFuncionarioBase {
  cpf: string;
  nome: string;
  email: string;
  senha?: string;
  data_nascimento?: string;
  setor?: string;
  funcao?: string;
  matricula?: string;
  nivel_cargo?: 'operacional' | 'gestao';
  turno?: string;
  escala?: string;
  ativo?: boolean;
}

export interface DadosFuncionarioClinica extends DadosFuncionarioBase {
  tipo: 'funcionario_clinica';
  empresa_id: number;
  clinica_id: number;
  entidade_id?: never;
}

export interface DadosFuncionarioEntidade extends DadosFuncionarioBase {
  tipo: 'funcionario_entidade';
  entidade_id: number;
  empresa_id?: never;
  clinica_id?: never;
}

export interface DadosGestorRH extends DadosFuncionarioBase {
  tipo: 'rh';
  clinica_id: number;
  entidade_id?: never;
  empresa_id?: never;
}

export interface DadosGestorEntidade extends DadosFuncionarioBase {
  tipo: 'gestor';
  entidade_id: number;
  clinica_id?: never;
  empresa_id?: never;
}

export interface DadosAdmin extends DadosFuncionarioBase {
  tipo: 'admin' | 'emissor';
  clinica_id?: never;
  entidade_id?: never;
  empresa_id?: never;
}

export type DadosFuncionario =
  | DadosFuncionarioClinica
  | DadosFuncionarioEntidade
  | DadosGestorRH
  | DadosGestorEntidade
  | DadosAdmin;

/**
 * Valida dados de funcionário de acordo com tipo
 */
function validarDadosFuncionario(dados: DadosFuncionario): void {
  // Validações comuns
  if (!dados.cpf || !dados.nome || !dados.email) {
    throw new Error('CPF, nome e email são obrigatórios');
  }

  const cpfLimpo = normalizeCPF(dados.cpf);
  if (!validarCPF(cpfLimpo)) {
    throw new Error('CPF inválido');
  }

  if (dados.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email)) {
    throw new Error('Email inválido');
  }

  // Validações específicas por tipo
  switch (dados.tipo) {
    case 'funcionario_clinica':
      if (!dados.empresa_id || !dados.clinica_id) {
        throw new Error(
          'Funcionário de clínica requer empresa_id e clinica_id'
        );
      }
      if (dados.entidade_id) {
        throw new Error('Funcionário de clínica não pode ter entidade_id');
      }
      if (!dados.setor || !dados.funcao) {
        throw new Error('Funcionário de clínica requer setor e função');
      }
      break;

    case 'funcionario_entidade':
      if (!dados.entidade_id) {
        throw new Error('Funcionário de entidade requer entidade_id');
      }
      if (dados.empresa_id || dados.clinica_id) {
        throw new Error(
          'Funcionário de entidade não pode ter empresa_id ou clinica_id'
        );
      }
      if (!dados.setor || !dados.funcao) {
        throw new Error('Funcionário de entidade requer setor e função');
      }
      break;

    case 'rh':
      if (!dados.clinica_id) {
        throw new Error('Gestor RH requer clinica_id');
      }
      if (dados.entidade_id || dados.empresa_id) {
        throw new Error('Gestor RH não pode ter entidade_id ou empresa_id');
      }
      break;

    case 'gestor':
      if (!dados.entidade_id) {
        throw new Error('Gestor de entidade requer entidade_id');
      }
      if (dados.clinica_id || dados.empresa_id) {
        throw new Error(
          'Gestor de entidade não pode ter clinica_id ou empresa_id'
        );
      }
      break;

    case 'admin':
    case 'emissor':
      if (dados.clinica_id || dados.entidade_id || dados.empresa_id) {
        throw new Error(
          'Admin/Emissor não pode ter vínculos (clinica_id, entidade_id, empresa_id)'
        );
      }
      break;

    default:
      throw new Error(`Tipo de usuário inválido: ${(dados as any).tipo}`);
  }
}

/**
 * Cria novo funcionário com validação estrita de vínculos
 */
export async function criarFuncionario(dados: DadosFuncionario): Promise<any> {
  // Validar dados
  validarDadosFuncionario(dados);

  const cpfLimpo = normalizeCPF(dados.cpf);

  // Verificar se CPF já existe
  const cpfExists = await query(
    'SELECT cpf, usuario_tipo FROM funcionarios WHERE cpf = $1',
    [cpfLimpo]
  );

  if (cpfExists.rows.length > 0) {
    throw new Error(
      `CPF ${dados.cpf} já cadastrado como ${cpfExists.rows[0].usuario_tipo}`
    );
  }

  // Hash da senha
  const senhaHash = dados.senha
    ? await bcrypt.hash(dados.senha, 10)
    : await bcrypt.hash('123456', 10); // senha padrão

  // Preparar dados para INSERT
  const insertData = {
    cpf: cpfLimpo,
    nome: dados.nome,
    email: dados.email,
    senha_hash: senhaHash,
    usuario_tipo: dados.tipo,
    data_nascimento: dados.data_nascimento || null,
    setor: dados.setor || null,
    funcao: dados.funcao || null,
    matricula: dados.matricula || null,
    nivel_cargo: dados.nivel_cargo || null,
    turno: dados.turno || null,
    escala: dados.escala || null,
    ativo: dados.ativo !== false,
    // Vínculos condicionais
    empresa_id: 'empresa_id' in dados ? dados.empresa_id : null,
    clinica_id: 'clinica_id' in dados ? dados.clinica_id : null,
    entidade_id: 'entidade_id' in dados ? dados.entidade_id : null,
  };

  // INSERT unificado
  const result = await query(
    `INSERT INTO funcionarios (
      cpf, nome, email, senha_hash, usuario_tipo,
      data_nascimento, setor, funcao, matricula, nivel_cargo,
      turno, escala, ativo,
      empresa_id, clinica_id, entidade_id,
      criado_em, atualizado_em
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10,
      $11, $12, $13,
      $14, $15, $16,
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ) RETURNING 
      id, cpf, nome, email, usuario_tipo,
      data_nascimento, setor, funcao, matricula, nivel_cargo,
      empresa_id, clinica_id, entidade_id, ativo`,
    [
      insertData.cpf,
      insertData.nome,
      insertData.email,
      insertData.senha_hash,
      insertData.usuario_tipo,
      insertData.data_nascimento,
      insertData.setor,
      insertData.funcao,
      insertData.matricula,
      insertData.nivel_cargo,
      insertData.turno,
      insertData.escala,
      insertData.ativo,
      insertData.empresa_id,
      insertData.clinica_id,
      insertData.entidade_id,
    ]
  );

  console.log(`[FUNCIONARIOS] Criado: ${dados.tipo} - CPF ${cpfLimpo}`);

  return result.rows[0];
}

/**
 * Atualiza funcionário com validação de imutabilidade de vínculos
 */
export async function atualizarFuncionario(
  cpf: string,
  dados: Partial<DadosFuncionarioBase>
): Promise<any> {
  const cpfLimpo = normalizeCPF(cpf);

  // Buscar funcionário existente
  const existing = await query('SELECT * FROM funcionarios WHERE cpf = $1', [
    cpfLimpo,
  ]);

  if (existing.rows.length === 0) {
    throw new Error(`Funcionário não encontrado: ${cpf}`);
  }

  const _funcionario = existing.rows[0]; // Prefixo _ para indicar não usado diretamente

  // Campos permitidos para atualização
  const camposPermitidos = [
    'nome',
    'email',
    'data_nascimento',
    'setor',
    'funcao',
    'matricula',
    'nivel_cargo',
    'turno',
    'escala',
    'ativo',
  ];

  // Filtrar apenas campos permitidos
  const updates: any = {};
  for (const campo of camposPermitidos) {
    if (campo in dados) {
      updates[campo] = (dados as any)[campo];
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new Error('Nenhum campo válido para atualização');
  }

  // Construir query dinâmica
  const setClauses = Object.keys(updates).map(
    (key, idx) => `${key} = $${idx + 2}`
  );
  const values = [cpfLimpo, ...Object.values(updates)];

  const result = await query(
    `UPDATE funcionarios 
     SET ${setClauses.join(', ')}, atualizado_em = CURRENT_TIMESTAMP
     WHERE cpf = $1
     RETURNING id, cpf, nome, email, usuario_tipo, ativo`,
    values
  );

  console.log(`[FUNCIONARIOS] Atualizado: CPF ${cpfLimpo}`);

  return result.rows[0];
}

/**
 * Busca funcionários por tipo e vínculo
 */
export async function buscarFuncionariosPorVinculo(
  tipo: UsuarioTipo,
  vinculo: { clinica_id?: number; entidade_id?: number }
): Promise<any[]> {
  let whereClause = 'usuario_tipo = $1';
  const params: any[] = [tipo];

  if (tipo === 'funcionario_clinica' || tipo === 'rh') {
    if (!vinculo.clinica_id) {
      throw new Error('clinica_id é obrigatório para este tipo');
    }
    whereClause += ' AND clinica_id = $2';
    params.push(vinculo.clinica_id);
  }

  if (tipo === 'funcionario_entidade' || tipo === 'gestor') {
    if (!vinculo.entidade_id) {
      throw new Error('entidade_id é obrigatório para este tipo');
    }
    whereClause += ' AND entidade_id = $2';
    params.push(vinculo.entidade_id);
  }

  const result = await query(
    `SELECT 
      id, cpf, nome, email, usuario_tipo,
      data_nascimento, setor, funcao, matricula, nivel_cargo,
      empresa_id, clinica_id, entidade_id, ativo,
      criado_em, atualizado_em
     FROM funcionarios
     WHERE ${whereClause}
     ORDER BY nome`,
    params
  );

  return result.rows;
}

/**
 * Verifica se funcionário pertence a vínculo específico
 */
export async function verificarVinculo(
  cpf: string,
  vinculo: { clinica_id?: number; entidade_id?: number }
): Promise<boolean> {
  const cpfLimpo = normalizeCPF(cpf);

  const result = await query(
    `SELECT 1 FROM funcionarios 
     WHERE cpf = $1 
     AND (
       (clinica_id = $2 AND $2 IS NOT NULL)
       OR
       (entidade_id = $3 AND $3 IS NOT NULL)
     )`,
    [cpfLimpo, vinculo.clinica_id || null, vinculo.entidade_id || null]
  );

  return result.rows.length > 0;
}
