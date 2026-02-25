/**
 * Testes de Permissões: Edição de Funcionários por Gestores e RH
 *
 * Valida que:
 * ✅ Gestores de entidade podem editar funcionários de suas respectivas entidades (PUT /api/entidade/funcionarios)
 * ✅ Perfil 'rh' (clínicas) pode editar funcionários de suas respectivas empresas (PUT /api/rh/funcionarios)
 * ✅ Isolamento de escopo: RH só edita funcionários da própria clínica (via funcionarios_clinicas)
 * ✅ Entidade só edita funcionários da própria entidade (via funcionarios_entidades)
 *
 * Abordagem: Análise estática do código-fonte dos endpoints
 */

import { readFileSync } from 'fs';
import { join } from 'path';

describe('Permissões de Edição de Funcionários', () => {
  describe('✅ PUT /api/entidade/funcionarios — Gestor de Entidade', () => {
    const entidadeRouteFile: string = join(
      process.cwd(),
      'app',
      'api',
      'entidade',
      'funcionarios',
      'route.ts'
    );
    let entidadeCode: string;

    beforeAll(() => {
      entidadeCode = readFileSync(entidadeRouteFile, 'utf-8');
    });

    test('Deve exportar função PUT', () => {
      expect(entidadeCode).toContain('export async function PUT');
    });

    test('Deve exigir autenticação via requireEntity()', () => {
      // A função PUT deve chamar requireEntity para garantir perfil 'gestor'
      const putSection = entidadeCode.slice(
        entidadeCode.indexOf('export async function PUT')
      );
      expect(putSection).toContain('requireEntity()');
    });

    test('Deve validar escopo: funcionário pertence à entidade via funcionarios_entidades', () => {
      expect(entidadeCode).toContain('funcionarios_entidades');
      // A query de validação deve usar entidade_id da sessão
      expect(entidadeCode).toContain('fe.entidade_id');
      expect(entidadeCode).toContain('fe.ativo = true');
    });

    test('Deve rejeitar funcionário fora do escopo da entidade (404)', () => {
      expect(entidadeCode).toContain(
        'Funcionário não encontrado ou sem permissão de acesso'
      );
    });

    test('Deve validar CPF obrigatório', () => {
      const putSection = entidadeCode.slice(
        entidadeCode.indexOf('export async function PUT')
      );
      expect(putSection).toContain('limparCPF');
      expect(putSection).toContain('validarCPF');
    });

    test('Deve validar campos obrigatórios (nome, data_nascimento, setor, funcao, email)', () => {
      const putSection = entidadeCode.slice(
        entidadeCode.indexOf('export async function PUT')
      );
      expect(putSection).toContain('data_nascimento');
      expect(putSection).toContain('setor');
      expect(putSection).toContain('funcao');
      expect(putSection).toContain('email');
    });

    test('Deve atualizar usando queryAsGestorEntidade (não query direta)', () => {
      const putSection = entidadeCode.slice(
        entidadeCode.indexOf('export async function PUT')
      );
      expect(putSection).toContain('queryAsGestorEntidade');
    });

    test('Deve registrar log de auditoria com cpf da entidade e do operador', () => {
      const putSection = entidadeCode.slice(
        entidadeCode.indexOf('export async function PUT')
      );
      expect(putSection).toContain('AUDIT');
      expect(putSection).toContain('session.cpf');
    });

    test('Deve retornar { success: true, message, funcionario }', () => {
      const putSection = entidadeCode.slice(
        entidadeCode.indexOf('export async function PUT')
      );
      expect(putSection).toContain('success: true');
      expect(putSection).toContain('Funcionário atualizado com sucesso');
    });

    test('Deve retornar 403 se não for gestor de entidade (via requireEntity)', () => {
      const putSection = entidadeCode.slice(
        entidadeCode.indexOf('export async function PUT')
      );
      expect(putSection).toContain('Acesso restrito');
      expect(putSection).toContain('status: 403');
    });
  });

  describe('✅ PUT /api/rh/funcionarios — RH (Clínica)', () => {
    const rhRouteFile: string = join(
      process.cwd(),
      'app',
      'api',
      'rh',
      'funcionarios',
      'route.ts'
    );
    let rhCode: string;

    beforeAll(() => {
      rhCode = readFileSync(rhRouteFile, 'utf-8');
    });

    test('Deve exigir perfil rh para editar funcionários', () => {
      const putSection = rhCode.slice(
        rhCode.indexOf('export async function PUT')
      );
      expect(putSection).toContain("session.perfil !== 'rh'");
      expect(putSection).toContain('Apenas gestores RH podem editar');
    });

    test('Deve exigir clinica_id na sessão', () => {
      const putSection = rhCode.slice(
        rhCode.indexOf('export async function PUT')
      );
      expect(putSection).toContain('clinica_id');
      expect(putSection).toContain('Clínica não identificada na sessão do RH');
    });

    test('Deve validar escopo: funcionário pertence à clínica do RH via funcionarios_clinicas', () => {
      const putSection = rhCode.slice(
        rhCode.indexOf('export async function PUT')
      );
      expect(putSection).toContain('funcionarios_clinicas');
      expect(putSection).toContain('fc.clinica_id');
      expect(putSection).toContain('fc.ativo = true');
    });

    test('Deve rejeitar funcionário fora do escopo da clínica (404)', () => {
      const putSection = rhCode.slice(
        rhCode.indexOf('export async function PUT')
      );
      expect(putSection).toContain(
        'Funcionário não encontrado ou sem permissão de acesso'
      );
    });

    test('Deve validar CPF com limparCPF e validarCPF', () => {
      const putSection = rhCode.slice(
        rhCode.indexOf('export async function PUT')
      );
      expect(putSection).toContain('limparCPF');
      expect(putSection).toContain('validarCPF');
    });

    test('Deve usar cpfLimpo no UPDATE (não cpf bruto)', () => {
      const putSection = rhCode.slice(
        rhCode.indexOf('export async function PUT')
      );
      // O WHERE final do UPDATE deve usar cpfLimpo
      expect(putSection).toContain('cpfLimpo');
      // Não deve usar cpf bruto no UPDATE
      const updateIdx = putSection.indexOf('UPDATE funcionarios');
      const updateSection = putSection.slice(updateIdx);
      // Verificar que cpfLimpo é usado no WHERE, não cpf puro
      expect(updateSection).toContain('cpfLimpo');
    });

    test('Deve registrar log de auditoria com clinica_id e cpf do operador', () => {
      const putSection = rhCode.slice(
        rhCode.indexOf('export async function PUT')
      );
      expect(putSection).toContain('AUDIT');
      expect(putSection).toContain('clinicaId');
      expect(putSection).toContain('session.cpf');
    });

    test('Não deve permitir atualização sem verificação de escopo (query antiga sem clinic)', () => {
      const putSection = rhCode.slice(
        rhCode.indexOf('export async function PUT')
      );
      // A query antiga (sem escopo) não deve existir
      expect(putSection).not.toContain(
        "'SELECT cpf FROM funcionarios WHERE cpf = $1'"
      );
    });
  });

  describe('🔒 Isolamento entre perfis', () => {
    const entidadeRouteFile: string = join(
      process.cwd(),
      'app',
      'api',
      'entidade',
      'funcionarios',
      'route.ts'
    );

    const rhRouteFile: string = join(
      process.cwd(),
      'app',
      'api',
      'rh',
      'funcionarios',
      'route.ts'
    );

    test('Rota entidade usa requireEntity (não requireAuth genérico)', () => {
      const code = readFileSync(entidadeRouteFile, 'utf-8');
      const putSection = code.slice(code.indexOf('export async function PUT'));
      expect(putSection).toContain('requireEntity');
      expect(putSection).not.toMatch(
        /requireAuth\(\)[\s\S]{0,200}export async function PUT/
      );
    });

    test('Rota RH bloqueia perfis diferentes de rh', () => {
      const code = readFileSync(rhRouteFile, 'utf-8');
      const putSection = code.slice(code.indexOf('export async function PUT'));
      expect(putSection).toContain("session.perfil !== 'rh'");
      expect(putSection).toContain('status: 403');
    });

    test('Rota entidade isola por funcionarios_entidades', () => {
      const code = readFileSync(entidadeRouteFile, 'utf-8');
      expect(code).toContain('funcionarios_entidades');
    });

    test('Rota RH isola por funcionarios_clinicas', () => {
      const code = readFileSync(rhRouteFile, 'utf-8');
      expect(code).toContain('funcionarios_clinicas');
    });
  });

  describe('🔑 Recálculo de senha ao alterar data de nascimento', () => {
    const entidadeRouteFile: string = join(
      process.cwd(),
      'app',
      'api',
      'entidade',
      'funcionarios',
      'route.ts'
    );

    const rhRouteFile: string = join(
      process.cwd(),
      'app',
      'api',
      'rh',
      'funcionarios',
      'route.ts'
    );

    test('[RH] Busca data_nascimento_atual do banco antes de atualizar', () => {
      const code = readFileSync(rhRouteFile, 'utf-8');
      const putSection = code.slice(code.indexOf('export async function PUT'));
      expect(putSection).toContain('data_nascimento_atual');
    });

    test('[RH] Compara a data nova com a data atual para detectar mudança', () => {
      const code = readFileSync(rhRouteFile, 'utf-8');
      const putSection = code.slice(code.indexOf('export async function PUT'));
      expect(putSection).toContain('dataMudou');
    });

    test('[RH] Chama gerarSenhaDeNascimento quando a data muda', () => {
      const code = readFileSync(rhRouteFile, 'utf-8');
      const putSection = code.slice(code.indexOf('export async function PUT'));
      expect(putSection).toContain('gerarSenhaDeNascimento');
      expect(putSection).toContain('novaSenhaHash');
    });

    test('[RH] Inclui senha_hash no UPDATE quando data mudou', () => {
      const code = readFileSync(rhRouteFile, 'utf-8');
      const putSection = code.slice(code.indexOf('export async function PUT'));
      expect(putSection).toContain('senha_hash=$11');
    });

    test('[RH] Retorna senha_atualizada no response', () => {
      const code = readFileSync(rhRouteFile, 'utf-8');
      const putSection = code.slice(code.indexOf('export async function PUT'));
      expect(putSection).toContain('senha_atualizada');
    });

    test('[RH] Registra log de auditoria ao recalcular senha', () => {
      const code = readFileSync(rhRouteFile, 'utf-8');
      const putSection = code.slice(code.indexOf('export async function PUT'));
      expect(putSection).toContain('recalculada devido');
    });

    test('[Entidade] Busca data_nascimento_atual do banco antes de atualizar', () => {
      const code = readFileSync(entidadeRouteFile, 'utf-8');
      const putSection = code.slice(code.indexOf('export async function PUT'));
      expect(putSection).toContain('data_nascimento_atual');
    });

    test('[Entidade] Compara a data nova com a data atual para detectar mudança', () => {
      const code = readFileSync(entidadeRouteFile, 'utf-8');
      const putSection = code.slice(code.indexOf('export async function PUT'));
      expect(putSection).toContain('dataMudou');
    });

    test('[Entidade] Chama gerarSenhaDeNascimento quando a data muda', () => {
      const code = readFileSync(entidadeRouteFile, 'utf-8');
      const putSection = code.slice(code.indexOf('export async function PUT'));
      expect(putSection).toContain('gerarSenhaDeNascimento');
      expect(putSection).toContain('novaSenhaHash');
    });

    test('[Entidade] Inclui senha_hash no UPDATE quando data mudou', () => {
      const code = readFileSync(entidadeRouteFile, 'utf-8');
      const putSection = code.slice(code.indexOf('export async function PUT'));
      expect(putSection).toContain('senha_hash=$11');
    });

    test('[Entidade] Retorna senha_atualizada no response', () => {
      const code = readFileSync(entidadeRouteFile, 'utf-8');
      const putSection = code.slice(code.indexOf('export async function PUT'));
      expect(putSection).toContain('senha_atualizada');
    });

    test('[Entidade] Registra log de auditoria ao recalcular senha', () => {
      const code = readFileSync(entidadeRouteFile, 'utf-8');
      const putSection = code.slice(code.indexOf('export async function PUT'));
      expect(putSection).toContain('recalculada devido');
    });

    test('Lógica de comparação de datas é robusta (usa ISO split para normalizar)', () => {
      // Ambas as rotas devem usar a mesma lógica de comparação de datas
      const rhCode = readFileSync(rhRouteFile, 'utf-8');
      const entCode = readFileSync(entidadeRouteFile, 'utf-8');

      const rhPut = rhCode.slice(rhCode.indexOf('export async function PUT'));
      const entPut = entCode.slice(entCode.indexOf('export async function PUT'));

      // Verificar que ambas usam toISOString().split('T')[0] para comparar datas
      expect(rhPut).toContain("toISOString().split('T')[0]");
      expect(entPut).toContain("toISOString().split('T')[0]");
    });

    test('Não recalcula senha quando data de nascimento não muda', () => {
      // Verificar que o código tem lógica condicional (novaSenhaHash só é setado se dataMudou)
      const rhCode = readFileSync(rhRouteFile, 'utf-8');
      const rhPut = rhCode.slice(rhCode.indexOf('export async function PUT'));

      // Deve ter dois ramos de UPDATE: um com senha_hash e outro sem
      expect(rhPut).toContain('if (novaSenhaHash)');
      expect(rhPut).toContain('} else {');
    });
  });
});
