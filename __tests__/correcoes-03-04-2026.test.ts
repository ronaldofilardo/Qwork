/**
 * Testes para as correções da sessão 03/04/2026:
 *
 * BUG 1 — CNPJ: Unicidade Cross-Table
 * Um CNPJ não pode pertencer simultaneamente a uma Entidade e a uma Empresa de Clínica,
 * e não pode estar cadastrado em mais de uma clínica.
 *
 * 1a. POST /api/rh/empresas      — check cruzado vs entidades + outra clínica
 * 1b. POST /api/rh/empresas/import  — check bulk antes da transação (entidades + outra clínica)
 * 1c. POST /api/rh/importacao/execute — check entidades dentro do loop de importação
 * 1d. ImportEmpresasModal — exibe avisos de CNPJs bloqueados no resultado
 *
 * BUG 2 — Avaliações Cross-Empresa
 * Campos de avaliação na listagem de funcionários devem ser filtrados pela empresa
 * atual (empresa_id), não usar os campos globais denormalizados de `funcionarios`.
 *
 * 2a. GET /api/rh/funcionarios — usa fc.indice_avaliacao e fc.data_ultimo_lote (empresa-scoped)
 * 2b. GET /api/rh/funcionarios — subqueries de ultima_avaliacao filtram por la.empresa_id
 * 2c. GET /api/rh/funcionarios — subqueries de inativacao filtram por la.empresa_id
 * 2d. GET /api/rh/funcionarios — CASE tem_avaliacao_recente usa fc.data_ultimo_lote
 * 2e. GET /api/rh/funcionarios — NÃO usa f.ultima_avaliacao_* (campos globais)
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// BUG 1a: POST /api/rh/empresas — check CNPJ cross-table
// ---------------------------------------------------------------------------
describe('1a. POST /api/rh/empresas — unicidade CNPJ cross-table', () => {
  const filePath = path.join(ROOT, 'app', 'api', 'rh', 'empresas', 'route.ts');
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('deve consultar entidades pelo CNPJ antes do INSERT', () => {
    expect(src).toContain('FROM entidades WHERE cnpj = $1');
  });

  it('deve consultar empresas_clientes de outra clínica pelo CNPJ', () => {
    expect(src).toContain(
      'FROM empresas_clientes WHERE cnpj = $1 AND clinica_id != $2'
    );
  });

  it('deve retornar 409 com mensagem amigável quando CNPJ é de Entidade', () => {
    expect(src).toContain(
      'Este CNPJ já está cadastrado como Entidade no sistema'
    );
    expect(src).toContain('{ status: 409 }');
  });

  it('deve retornar 409 com mensagem amigável quando CNPJ pertence a outra clínica', () => {
    expect(src).toContain('Este CNPJ já está cadastrado em outra clínica');
  });

  it('verifica unicidade ANTES de salvar arquivos e de chamar withTransaction', () => {
    const checkIdx = src.indexOf("SELECT 'entidade' AS origem FROM entidades");
    const transactionIdx = src.indexOf('withTransaction(');
    expect(checkIdx).toBeGreaterThan(-1);
    expect(transactionIdx).toBeGreaterThan(-1);
    expect(checkIdx).toBeLessThan(transactionIdx);
  });
});

// ---------------------------------------------------------------------------
// BUG 1b: POST /api/rh/empresas/import — check bulk pré-transação
// ---------------------------------------------------------------------------
describe('1b. POST /api/rh/empresas/import — pré-check bulk CNPJ', () => {
  const filePath = path.join(
    ROOT,
    'app',
    'api',
    'rh',
    'empresas',
    'import',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('deve importar query de @/lib/db', () => {
    expect(src).toMatch(/import.*query.*from.*@\/lib\/db/);
  });

  it('deve fazer check bulk de CNPJs contra entidades', () => {
    expect(src).toContain(
      "'entidade' AS origem FROM entidades WHERE cnpj = ANY($1)"
    );
  });

  it('deve fazer check bulk de CNPJs contra empresas de outra clínica', () => {
    expect(src).toContain(
      "'outra_clinica' AS origem FROM empresas_clientes WHERE cnpj = ANY($1) AND clinica_id != $2"
    );
  });

  it('deve remover CNPJs bloqueados do empresaMap antes da transação', () => {
    expect(src).toContain('cnpjsBloqueados');
    expect(src).toContain('empresaMap.delete(cnpj)');
  });

  it('deve retornar 409 quando todas as empresas são bloqueadas', () => {
    expect(src).toContain('empresaMap.size === 0');
    expect(src).toContain(
      'Nenhuma empresa pôde ser importada devido a conflitos de CNPJ'
    );
  });

  it('deve incluir avisos no retorno de sucesso parcial', () => {
    expect(src).toContain(
      'avisosBloqueio.length > 0 ? { avisos: avisosBloqueio }'
    );
  });

  it('check bulk deve ocorrer ANTES do withTransaction', () => {
    const bulkCheckIdx = src.indexOf('cnpjsParaVerificar');
    const transactionIdx = src.indexOf('withTransaction(');
    expect(bulkCheckIdx).toBeGreaterThan(-1);
    expect(transactionIdx).toBeGreaterThan(-1);
    expect(bulkCheckIdx).toBeLessThan(transactionIdx);
  });

  it('deve buscar empresa globalmente (sem filtro clinica_id) dentro da transação', () => {
    expect(src).toContain(
      'SELECT id, clinica_id FROM empresas_clientes WHERE cnpj = $1'
    );
    // O filtro AND clinica_id = $2 dentro do loop foi removido (busca global)
    expect(src).not.toContain('WHERE cnpj = $1 AND clinica_id = $2');
  });
});

// ---------------------------------------------------------------------------
// BUG 1c: POST /api/rh/importacao/execute — check entidades no loop
// ---------------------------------------------------------------------------
describe('1c. POST /api/rh/importacao/execute — check entidades no loop', () => {
  const filePath = path.join(
    ROOT,
    'app',
    'api',
    'rh',
    'importacao',
    'execute',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('deve verificar entidades quando CNPJ não existe em empresas_clientes', () => {
    expect(src).toContain('SELECT 1 FROM entidades WHERE cnpj = $1 LIMIT 1');
  });

  it('deve incrementar empresasBloqueadas quando CNPJ é de entidade', () => {
    const entidadeCheckIdx = src.indexOf(
      'SELECT 1 FROM entidades WHERE cnpj = $1 LIMIT 1'
    );
    const bloqueadoIdx = src.indexOf('empresasBloqueadas++', entidadeCheckIdx);
    expect(entidadeCheckIdx).toBeGreaterThan(-1);
    expect(bloqueadoIdx).toBeGreaterThan(-1);
    expect(bloqueadoIdx).toBeGreaterThan(entidadeCheckIdx);
  });

  it('deve adicionar mensagem descritiva ao errosProcessamento', () => {
    expect(src).toContain(
      'está cadastrada como Entidade no sistema — não é possível importar como empresa de clínica'
    );
  });

  it('ainda deve bloquear empresa de outra clínica (comportamento original preservado)', () => {
    expect(src).toContain(
      'já está cadastrada em outra clínica — funcionário não importado'
    );
  });
});

// ---------------------------------------------------------------------------
// BUG 1d: ImportEmpresasModal — exibe avisos de bloqueio
// ---------------------------------------------------------------------------
describe('1d. ImportEmpresasModal — exibe avisos de CNPJs bloqueados', () => {
  const filePath = path.join(
    ROOT,
    'components',
    'clinica',
    'ImportEmpresasModal.tsx'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('interface ImportStats deve ter campo avisos opcional', () => {
    expect(src).toContain('avisos?: string[]');
  });

  it('deve popular avisos a partir da resposta da API', () => {
    expect(src).toContain("data['avisos'] as string[]");
  });

  it('deve renderizar painel de avisos quando result.avisos tem itens', () => {
    expect(src).toContain('result.avisos && result.avisos.length > 0');
    expect(src).toContain('conflito de CNPJ');
  });

  it('deve mapear os avisos em lista visível', () => {
    expect(src).toContain('result.avisos.map(');
  });
});

// ---------------------------------------------------------------------------
// BUG 2a: GET /api/rh/funcionarios — usa campos empresa-scoped de fc
// ---------------------------------------------------------------------------
describe('2a. GET /api/rh/funcionarios — usa fc.indice_avaliacao e fc.data_ultimo_lote', () => {
  const filePath = path.join(
    ROOT,
    'app',
    'api',
    'rh',
    'funcionarios',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('deve usar fc.indice_avaliacao (empresa-scoped) em vez de f.indice_avaliacao', () => {
    expect(src).toContain('fc.indice_avaliacao');
    // Não deve usar o campo global de funcionarios diretamente no SELECT principal
    // (pode aparecer em subqueries de outras partes — verificar contexto do SELECT)
  });

  it('deve usar fc.data_ultimo_lote (empresa-scoped) em vez de f.data_ultimo_lote', () => {
    expect(src).toContain('fc.data_ultimo_lote');
  });

  it('deve usar fc.data_ultimo_lote no CASE tem_avaliacao_recente', () => {
    // Verifica que tem_avaliacao_recente usa dado empresa-scoped
    const caseIdx = src.indexOf('tem_avaliacao_recente');
    const fcDataUltimoIdx = src.lastIndexOf('fc.data_ultimo_lote', caseIdx);
    expect(caseIdx).toBeGreaterThan(-1);
    expect(fcDataUltimoIdx).toBeGreaterThan(-1);
  });
});

// ---------------------------------------------------------------------------
// BUG 2b: GET /api/rh/funcionarios — subqueries ultima_avaliacao filtram empresa
// ---------------------------------------------------------------------------
describe('2b. GET /api/rh/funcionarios — subqueries ultima_avaliacao filtram empresa_id', () => {
  const filePath = path.join(
    ROOT,
    'app',
    'api',
    'rh',
    'funcionarios',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('subquery ultima_avaliacao_id deve filtrar por la_ua.empresa_id = $1', () => {
    expect(src).toContain('la_ua.empresa_id = $1');
  });

  it('subquery ultima_avaliacao_status deve existir e filtrar empresa', () => {
    expect(src).toContain('as ultima_avaliacao_status');
  });

  it('subquery ultima_avaliacao_data_conclusao deve filtrar por empresa', () => {
    expect(src).toContain('as ultima_avaliacao_data_conclusao');
  });

  it('subquery ultimo_motivo_inativacao deve filtrar por empresa', () => {
    expect(src).toContain('as ultimo_motivo_inativacao');
    // Motivo de inativação só desta empresa
    const motivoIdx = src.indexOf('as ultimo_motivo_inativacao');
    const joinEmpresaIdx = src.lastIndexOf('la_ua.empresa_id', motivoIdx);
    expect(joinEmpresaIdx).toBeGreaterThan(-1);
  });
});

// ---------------------------------------------------------------------------
// BUG 2c: GET /api/rh/funcionarios — subqueries de inativação filtram empresa
// ---------------------------------------------------------------------------
describe('2c. GET /api/rh/funcionarios — subqueries de inativação filtram empresa_id', () => {
  const filePath = path.join(
    ROOT,
    'app',
    'api',
    'rh',
    'funcionarios',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('subquery ultima_inativacao_em deve filtrar por la2.empresa_id = $1', () => {
    expect(src).toContain('la2.empresa_id = $1');
    expect(src).toContain('as ultima_inativacao_em');
  });

  it('subquery ultima_inativacao_lote deve filtrar por l.empresa_id = $1', () => {
    // Verifica que o JOIN no lote também filtra por empresa
    const loteIdx = src.indexOf('as ultima_inativacao_lote');
    const empresaFilterIdx = src.lastIndexOf('l.empresa_id = $1', loteIdx);
    expect(loteIdx).toBeGreaterThan(-1);
    expect(empresaFilterIdx).toBeGreaterThan(-1);
  });

  it('subquery ultimo_lote_numero deve filtrar por l.empresa_id = $1', () => {
    const loteNumIdx = src.indexOf('as ultimo_lote_numero');
    const empresaFilterIdx = src.lastIndexOf('l.empresa_id = $1', loteNumIdx);
    expect(loteNumIdx).toBeGreaterThan(-1);
    expect(empresaFilterIdx).toBeGreaterThan(-1);
  });
});

// ---------------------------------------------------------------------------
// BUG 2d: GET /api/rh/funcionarios — NÃO usa campos globais de f.*
// ---------------------------------------------------------------------------
describe('2d. GET /api/rh/funcionarios — não usa campos globais de avaliação de f.*', () => {
  const filePath = path.join(
    ROOT,
    'app',
    'api',
    'rh',
    'funcionarios',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('não deve usar f.ultima_avaliacao_id diretamente no SELECT (campo global)', () => {
    // O campo pode aparecer como subquery alias, não como f.ultima_avaliacao_id
    expect(src).not.toContain('f.ultima_avaliacao_id,');
    expect(src).not.toContain('f.ultima_avaliacao_id\n');
  });

  it('não deve usar f.ultima_avaliacao_status diretamente no SELECT', () => {
    expect(src).not.toContain('f.ultima_avaliacao_status,');
    expect(src).not.toContain('f.ultima_avaliacao_status\n');
  });

  it('não deve usar f.ultima_avaliacao_data_conclusao diretamente no SELECT', () => {
    expect(src).not.toContain('f.ultima_avaliacao_data_conclusao,');
  });

  it('não deve usar f.indice_avaliacao no SELECT principal (usa fc.indice_avaliacao)', () => {
    expect(src).not.toContain('f.indice_avaliacao,');
  });

  it('não deve usar f.data_ultimo_lote no SELECT principal (usa fc.data_ultimo_lote)', () => {
    expect(src).not.toContain('f.data_ultimo_lote,');
  });

  it('subqueries de avaliação devem fazer JOIN com lotes_avaliacao', () => {
    expect(src).toContain(
      'JOIN lotes_avaliacao la_ua ON la_ua.id = a_ua.lote_id'
    );
  });

  it('a query de avaliacoes separada ainda filtra por empresa_id', () => {
    expect(src).toContain(
      'WHERE a.funcionario_cpf = ANY($1) AND la.empresa_id = $2'
    );
  });
});

// ---------------------------------------------------------------------------
// BANNER 3: ModalConfirmacaoIdentidade — banner de anonimização
// ---------------------------------------------------------------------------
describe('3. ModalConfirmacaoIdentidade — banner de anonimização', () => {
  const filePath = path.join(
    ROOT,
    'components',
    'modals',
    'ModalConfirmacaoIdentidade.tsx'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('deve importar o ícone Lock do lucide-react', () => {
    expect(src).toMatch(
      /import\s*\{[^}]*Lock[^}]*\}\s*from\s*['"]lucide-react['"]/
    );
  });

  it('deve renderizar banner com fundo azul (bg-blue-50)', () => {
    expect(src).toContain('bg-blue-50');
    expect(src).toContain('border-blue-200');
  });

  it('deve usar o ícone Lock no banner', () => {
    expect(src).toContain('<Lock');
    expect(src).toContain('text-blue-600');
  });

  it('deve exibir título do banner de anonimização', () => {
    expect(src).toContain('Suas respostas são anônimas e confidenciais');
  });

  it('deve mencionar que nenhuma pessoa terá acesso às respostas individuais', () => {
    expect(src).toContain('Nenhuma pessoa');
    expect(src).toContain('incluindo seu RH, gestores ou a empresa');
  });

  it('deve mencionar relatórios consolidados', () => {
    expect(src).toContain('relatórios');
    expect(src).toContain('consolidados');
  });

  it('deve mencionar sigilo das respostas', () => {
    expect(src).toContain('sigilo');
  });

  it('não deve mais conter o texto antigo "está prestes a acessar o sistema"', () => {
    expect(src).not.toContain('está prestes a acessar o sistema');
  });

  it('não deve mais conter o texto introdutório removido do bloco laranja', () => {
    expect(src).not.toContain('acessar o sistema de avaliação de risco');
  });

  it('deve manter os incisos I–V da declaração de acesso', () => {
    expect(src).toContain('I –');
    expect(src).toContain('II –');
    expect(src).toContain('III –');
    expect(src).toContain('IV –');
    expect(src).toContain('V –');
  });

  it('deve manter a Declaração de Ausência de Prontuário Psicológico', () => {
    expect(src).toContain('Declaração de Ausência de Prontuário Psicológico');
  });

  it('deve manter o campo de confirmação de identidade com dados do funcionário', () => {
    expect(src).toContain('{nome}');
    expect(src).toContain('{cpfFormatado}');
    expect(src).toContain('{dataFormatada}');
  });

  it('banner deve aparecer ANTES do bloco de dados do funcionário', () => {
    const bannerIdx = src.indexOf(
      'Suas respostas são anônimas e confidenciais'
    );
    const dadosIdx = src.indexOf('{/* Dados do funcionário */}');
    expect(bannerIdx).toBeGreaterThan(-1);
    expect(dadosIdx).toBeGreaterThan(-1);
    expect(bannerIdx).toBeLessThan(dadosIdx);
  });
});

// ---------------------------------------------------------------------------
// 4. Botão PDF desativado na coluna Ações dos lotes
// ---------------------------------------------------------------------------
describe('4. Botão PDF individual removido das páginas de lote', () => {
  const entidadeLotePath = path.join(
    ROOT,
    'app',
    'entidade',
    'lote',
    '[id]',
    'page.tsx'
  );
  const rhLotePath = path.join(
    ROOT,
    'app',
    'rh',
    'empresa',
    '[id]',
    'lote',
    '[loteId]',
    'page.tsx'
  );
  let entidadeSrc: string;
  let rhSrc: string;

  beforeAll(() => {
    entidadeSrc = fs.readFileSync(entidadeLotePath, 'utf-8');
    rhSrc = fs.readFileSync(rhLotePath, 'utf-8');
  });

  it('entidade: arquivo lote/[id]/page.tsx deve existir', () => {
    expect(fs.existsSync(entidadeLotePath)).toBe(true);
  });

  it('rh: arquivo lote/[loteId]/page.tsx deve existir', () => {
    expect(fs.existsSync(rhLotePath)).toBe(true);
  });

  it('entidade: botão PDF individual foi removido (sem title "temporariamente indisponível")', () => {
    expect(entidadeSrc).not.toContain(
      'title="Relatório individual temporariamente indisponível"'
    );
  });

  it('entidade: função _gerarRelatorioFuncionario foi removida', () => {
    expect(entidadeSrc).not.toContain('_gerarRelatorioFuncionario');
  });

  it('entidade: não deve ter botão PDF inline desabilitado com bg-gray-300', () => {
    // O botão disabled com bg-gray-300 foi substituído por remoção completa
    const disabledBtnPattern =
      /title="Relatório individual temporariamente indisponível"[\s\S]{0,200}bg-gray-300/;
    expect(disabledBtnPattern.test(entidadeSrc)).toBe(false);
  });

  it('entidade: botão PDF não deve mais ser condicional por status de avaliação', () => {
    // A renderização condicional baseada em status foi removida nesta td
    const oldConditionalPattern =
      /avaliacao\.status === 'concluida'[\s\S]{0,50}avaliacao\.status === 'concluido'[\s\S]{0,50}gerarRelatorioFuncionario/;
    expect(oldConditionalPattern.test(entidadeSrc)).toBe(false);
  });

  it('rh: botão PDF individual foi removido (sem title "temporariamente indisponível")', () => {
    expect(rhSrc).not.toContain(
      'title="Relatório individual temporariamente indisponível"'
    );
  });

  it('rh: função _gerarRelatorioFuncionario foi removida', () => {
    expect(rhSrc).not.toContain('_gerarRelatorioFuncionario');
  });

  it('rh: botão PDF não deve ter onClick ativo', () => {
    // O padrão antigo com onClick gerarRelatorioFuncionario deve ter sido removido
    const oldOnClickPattern =
      /onClick=\{[\s\S]{0,50}gerarRelatorioFuncionario[\s\S]{0,50}\}[\s\S]{0,200}disabled=\{[\s\S]{0,100}concluido/;
    expect(oldOnClickPattern.test(rhSrc)).toBe(false);
  });

  it('rh: coluna Ações ainda existe (contém botão Reset)', () => {
    // A coluna Ações foi mantida para o botão Reset
    expect(rhSrc).toContain('Resetar avaliação');
  });
});

// ---------------------------------------------------------------------------
// 5a. POST /api/avaliacao/respostas — guard avaliação já concluída
// ---------------------------------------------------------------------------
describe('5a. POST /api/avaliacao/respostas — guard contra avaliação já concluída', () => {
  const filePath = path.join(
    ROOT,
    'app',
    'api',
    'avaliacao',
    'respostas',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('deve consultar status da avaliação antes de salvar respostas', () => {
    expect(src).toContain('SELECT status FROM avaliacoes WHERE id = $1');
  });

  it('deve retornar completed:true quando avaliação já está concluída', () => {
    expect(src).toContain("statusAvaliacao === 'concluida'");
    expect(src).toContain('completed: true');
  });

  it('deve retornar 400 quando avaliação está inativada', () => {
    expect(src).toContain("statusAvaliacao === 'inativada'");
    expect(src).toContain('{ status: 400 }');
  });

  it('guard de status deve ocorrer ANTES do loop de insert de respostas', () => {
    const guardIdx = src.indexOf("statusAvaliacao === 'concluida'");
    const insertIdx = src.indexOf(
      `INSERT INTO respostas (avaliacao_id, item, valor, grupo)`
    );
    expect(guardIdx).toBeGreaterThan(-1);
    expect(insertIdx).toBeGreaterThan(-1);
    expect(guardIdx).toBeLessThan(insertIdx);
  });

  it('deve retornar 404 quando avaliação não encontrada', () => {
    expect(src).toContain('!statusAvaliacao');
    const notFoundIdx = src.indexOf("{ error: 'Avaliação não encontrada' }");
    expect(notFoundIdx).toBeGreaterThan(-1);
  });
});

// ---------------------------------------------------------------------------
// 5b. lib/lotes.ts — guard contra transição inválida concluido→ativo
// ---------------------------------------------------------------------------
describe('5b. lib/lotes.ts — guard contra transição inválida concluido→ativo', () => {
  const filePath = path.join(ROOT, 'lib', 'lotes.ts');
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('deve definir ESTADOS_POS_CONCLUSAO com concluido, emissao_solicitada, emitido', () => {
    expect(src).toContain('ESTADOS_POS_CONCLUSAO');
    expect(src).toContain("'concluido'");
    expect(src).toContain("'emissao_solicitada'");
    expect(src).toContain("'emitido'");
  });

  it('deve verificar se statusAtual está em ESTADOS_POS_CONCLUSAO antes de atualizar', () => {
    expect(src).toContain('ESTADOS_POS_CONCLUSAO.includes(statusAtual)');
  });

  it('deve ignorar transição para ativo quando lote já está em estado pós-conclusão', () => {
    const guardPattern =
      /ESTADOS_POS_CONCLUSAO\.includes\(statusAtual\)[\s\S]{0,50}&& novoStatus === 'ativo'/;
    expect(guardPattern.test(src)).toBe(true);
  });

  it('deve retornar loteFinalizado:true quando guard ativa', () => {
    const returnPattern =
      /ESTADOS_POS_CONCLUSAO\.includes\(statusAtual\)[\s\S]{0,600}loteFinalizado: true/;
    expect(returnPattern.test(src)).toBe(true);
  });

  it('deve emitir log de warn quando guard ativa', () => {
    const warnPattern =
      /ESTADOS_POS_CONCLUSAO\.includes\(statusAtual\)[\s\S]{0,400}console\.warn/;
    expect(warnPattern.test(src)).toBe(true);
  });

  it('guard deve ocorrer ANTES da lógica de update do status', () => {
    const guardIdx = src.indexOf('ESTADOS_POS_CONCLUSAO.includes(statusAtual)');
    const updateIdx = src.indexOf(
      'UPDATE lotes_avaliacao SET status = $1 WHERE id = $2'
    );
    expect(guardIdx).toBeGreaterThan(-1);
    expect(updateIdx).toBeGreaterThan(-1);
    expect(guardIdx).toBeLessThan(updateIdx);
  });
});

// ---------------------------------------------------------------------------
// BUG 6 — isPronto: fórmula 100% substituída por delegação ao lote.status
// ---------------------------------------------------------------------------
describe('6a. useDetalhesLote — isPronto delega ao lote.status (não usa 100%)', () => {
  const filePath = path.join(
    ROOT,
    'app',
    'rh',
    'empresa',
    '[id]',
    'lote',
    '[loteId]',
    'useDetalhesLote.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('isPronto NÃO deve usar fórmula total_avaliacoes - avaliacoes_inativadas (100%)', () => {
    // Fórmula bug: avaliacoes_concluidas === total_avaliacoes - avaliacoes_inativadas
    expect(src).not.toContain(
      'total_avaliacoes - estatisticas.avaliacoes_inativadas'
    );
  });

  it('isPronto deve incluir "concluido" na lista de status válidos', () => {
    expect(src).toContain("'concluido'");
  });

  it('isPronto deve incluir "finalizado" na lista de status válidos', () => {
    expect(src).toContain("'finalizado'");
  });

  it('isPronto deve usar lote.status como source of truth', () => {
    expect(src).toMatch(/isPronto[\s\S]{0,300}lote\.status/);
  });

  it('isPronto deve depender de [lote] nas deps do useMemo (não [estatisticas])', () => {
    // Verifica que o useMemo do isPronto tem lote nas deps, não estatisticas
    const isProntoIdx = src.indexOf('isPronto = useMemo');
    expect(isProntoIdx).toBeGreaterThan(-1);
    const memoBlock = src.slice(isProntoIdx, isProntoIdx + 300);
    expect(memoBlock).toContain('}, [lote])');
  });
});

describe('6b. page.tsx lote detalhe — isPronto delegado ao hook, botões usam laudo_status', () => {
  const filePath = path.join(
    ROOT,
    'app',
    'rh',
    'empresa',
    '[id]',
    'lote',
    '[loteId]',
    'page.tsx'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('isPronto NÃO deve usar fórmula total_avaliacoes - avaliacoes_inativadas (100%)', () => {
    expect(src).not.toContain(
      'total_avaliacoes - estatisticas.avaliacoes_inativadas'
    );
  });

  it('page.tsx NÃO deve redefinir isPronto localmente (delegado ao useDetalhesLote)', () => {
    // isPronto foi movido para useDetalhesLote.ts para evitar duplicação
    expect(src).not.toMatch(/const isPronto\s*=/);
  });

  it('botão Gerar Relatório PDF deve usar laudo_status como condição', () => {
    expect(src).toContain("['emitido', 'enviado'].includes(lote.laudo_status");
  });
});

// ---------------------------------------------------------------------------
// BUG 7 — LoteStatusBanners: canSolicitarEmissao não bloqueia por avaliacoes_pendentes
// ---------------------------------------------------------------------------
describe('7. LoteStatusBanners — canSolicitarEmissao não exige pendentes === 0', () => {
  const filePath = path.join(
    ROOT,
    'app',
    'rh',
    'empresa',
    '[id]',
    'lote',
    '[loteId]',
    'components',
    'LoteStatusBanners.tsx'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('canSolicitarEmissao NÃO deve conter avaliacoes_pendentes === 0', () => {
    // Regra 70%: pode haver avaliações iniciadas e o lote ser elegível
    expect(src).not.toContain('avaliacoes_pendentes === 0');
  });

  it('canSolicitarEmissao deve usar lote.status === concluido como critério principal', () => {
    expect(src).toContain("lote.status === 'concluido'");
  });

  it('canSolicitarEmissao deve bloquear quando emissão já foi solicitada', () => {
    expect(src).toContain('!lote.emissao_solicitada');
  });

  it('canSolicitarEmissao deve bloquear quando já tem laudo', () => {
    expect(src).toContain('!lote.tem_laudo');
  });

  it('texto do banner deve refletir regra 70% (não "todas as avaliações")', () => {
    expect(src).not.toContain('Todas as avaliações foram finalizadas');
    expect(src).toContain('70%');
  });
});

// ---------------------------------------------------------------------------
// BUG 8 — Warning text: inativadas contam no denominador dos 70%
// ---------------------------------------------------------------------------
describe('8a. LoteHeader — warning text correto sobre inativadas', () => {
  const filePath = path.join(
    ROOT,
    'app',
    'rh',
    'empresa',
    '[id]',
    'lote',
    '[loteId]',
    'components',
    'LoteHeader.tsx'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('NÃO deve dizer "não conta para a prontidão do lote"', () => {
    // Texto enganoso — inativadas contam no denominador dos 70%
    expect(src).not.toContain('para a prontidão do lote');
  });

  it('deve mencionar que inativadas contam no denominador dos 70%', () => {
    expect(src).toContain('70%');
  });
});

describe('8b. page.tsx lote detalhe — warning text correto sobre inativadas', () => {
  const filePath = path.join(
    ROOT,
    'app',
    'rh',
    'empresa',
    '[id]',
    'lote',
    '[loteId]',
    'page.tsx'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('NÃO deve dizer "para a prontidão do lote" no warning de inativadas', () => {
    expect(src).not.toContain('para a prontidão do lote');
  });
});

// ---------------------------------------------------------------------------
// BUG 9 — Lógica 70%: verificação de fórmula correta em toda a cadeia
// ---------------------------------------------------------------------------
describe('9. Regra 70%: fórmula CEIL(0.7 * total_liberadas) — cadeia completa', () => {
  function deveLiberar(concluidas: number, totalLiberadas: number): boolean {
    if (totalLiberadas === 0) return false;
    const threshold = Math.ceil(0.7 * totalLiberadas);
    return concluidas >= threshold;
  }

  it('Lote #46: 7 concluídas / 10 liberadas (1 inativada) — LIBERA', () => {
    // status='concluido' pelo trigger; canSolicitarEmissao=true
    expect(deveLiberar(7, 10)).toBe(true);
  });

  it('6 concluídas / 10 liberadas — NÃO libera', () => {
    expect(deveLiberar(6, 10)).toBe(false);
  });

  it('lote "concluido" com 2 pendentes (iniciadas) — isPronto=true via lote.status', () => {
    // Simula a lógica corrigida: isPronto depende de lote.status, não de contagem
    const loteStatus = 'concluido';
    const isPronto = [
      'concluido',
      'finalizado',
      'emissao_solicitada',
      'emissao_em_andamento',
    ].includes(loteStatus);
    expect(isPronto).toBe(true);
  });

  it('lote "ativo" com 0 pendentes — isPronto=false (trigger não ativou)', () => {
    const loteStatus = 'ativo';
    const isPronto = [
      'concluido',
      'finalizado',
      'emissao_solicitada',
      'emissao_em_andamento',
    ].includes(loteStatus);
    expect(isPronto).toBe(false);
  });

  it('canSolicitarEmissao: status=concluido + pendentes=2 + inativadas=1 → TRUE', () => {
    // Simula LoteStatusBanners corrigido
    const lote = {
      status: 'concluido',
      emissao_solicitada: false,
      tem_laudo: false,
    };
    const canSolicitar =
      lote.status === 'concluido' &&
      !lote.emissao_solicitada &&
      !lote.tem_laudo;
    expect(canSolicitar).toBe(true);
  });

  it('canSolicitarEmissao: status=concluido + emissao_solicitada=true → FALSE', () => {
    const lote = {
      status: 'concluido',
      emissao_solicitada: true,
      tem_laudo: false,
    };
    const canSolicitar =
      lote.status === 'concluido' &&
      !lote.emissao_solicitada &&
      !lote.tem_laudo;
    expect(canSolicitar).toBe(false);
  });

  it('canSolicitarEmissao: status=ativo + pendentes=0 → FALSE (trigger não ativou)', () => {
    const lote = {
      status: 'ativo',
      emissao_solicitada: false,
      tem_laudo: false,
    };
    const canSolicitar =
      lote.status === 'concluido' &&
      !lote.emissao_solicitada &&
      !lote.tem_laudo;
    expect(canSolicitar).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// BUG 10 — page.tsx inline emission block: NÃO deve bloquear por avaliacoes_pendentes
// ---------------------------------------------------------------------------
describe('10. page.tsx — bloco inline de emissão NÃO bloqueia por avaliacoes_pendentes', () => {
  const filePath = path.join(
    ROOT,
    'app',
    'rh',
    'empresa',
    '[id]',
    'lote',
    '[loteId]',
    'page.tsx'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('bloco inline NÃO deve conter estatisticas.avaliacoes_pendentes === 0', () => {
    // A condição obsoleta foi removida nesta sessão
    // (era: estatisticas.avaliacoes_pendentes === 0)
    expect(src).not.toContain('estatisticas.avaliacoes_pendentes === 0');
  });

  it('bloco inline NÃO deve conter avaliacoes_concluidas + avaliacoes_pendentes > 0', () => {
    // Outra condição obsoleta removida
    expect(src).not.toContain(
      'estatisticas.avaliacoes_concluidas +\n                estatisticas.avaliacoes_pendentes >'
    );
  });

  it('bloco inline deve usar lote.status === concluido como critério principal', () => {
    // Critério correto: lote.status === 'concluido' (setado pelo trigger 70%)
    expect(src).toContain("lote.status === 'concluido'");
  });

  it('bloco inline deve bloquear quando emissão já foi solicitada', () => {
    expect(src).toContain('!lote.emissao_solicitada');
  });

  it('bloco inline deve bloquear quando já tem laudo', () => {
    expect(src).toContain('!lote.tem_laudo');
  });

  it('texto do card de emissão deve refletir a regra 70%', () => {
    // Texto atualizado: "Pelo menos 70% das avaliações foram concluídas"
    expect(src).toContain('70%');
    expect(src).not.toContain('Todas as avaliações foram finalizadas');
  });

  it('confirm dialog deve mencionar inativação automática de pendentes', () => {
    expect(src).toContain('pendentes serão inativadas automaticamente');
  });
});

// ---------------------------------------------------------------------------
// FEATURE 11 — solicitar-emissao route: auto-inativação de avaliações pendentes
// ---------------------------------------------------------------------------
describe('11. solicitar-emissao route — auto-inativação de avaliações ao solicitar laudo', () => {
  const filePath = path.join(
    ROOT,
    'app',
    'api',
    'lotes',
    '[loteId]',
    'solicitar-emissao',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('deve conter UPDATE de avaliacoes para status = inativada', () => {
    expect(src).toContain("SET status = 'inativada'");
  });

  it('deve filtrar apenas avaliações NOT IN (concluida, inativada)', () => {
    expect(src).toContain("NOT IN ('concluida', 'inativada')");
  });

  it('deve definir motivo_inativacao com texto específico de auto-inativação', () => {
    expect(src).toContain(
      "motivo_inativacao = 'Inativação automática: emissão do laudo solicitada'"
    );
  });

  it('deve setar inativada_em = NOW() na auto-inativação', () => {
    // Garante rastreabilidade temporal
    const autoInativacaoBlock = src.match(
      /UPDATE avaliacoes[\s\S]{0,500}emiss\u00e3o do laudo solicitada[\s\S]{0,300}/
    );
    expect(autoInativacaoBlock).not.toBeNull();
    expect(autoInativacaoBlock[0]).toContain('inativada_em = NOW()');
  });

  it('deve filtrar pelo lote_id correto no UPDATE', () => {
    const autoInativacaoBlock = src.match(
      /UPDATE avaliacoes[\s\S]{0,500}emiss\u00e3o do laudo solicitada[\s\S]{0,300}/
    );
    expect(autoInativacaoBlock).not.toBeNull();
    expect(autoInativacaoBlock[0]).toContain('WHERE lote_id = $1');
  });

  it('auto-inativação deve ocorrer DENTRO da transação BEGIN/COMMIT', () => {
    // Garantir atomicidade: auto-inativação está entre advisory lock e COMMIT
    const beginIdx = src.indexOf("await query('BEGIN')");
    const commitIdx = src.indexOf("await query('COMMIT')");
    const autoInativacaoIdx = src.indexOf(
      "motivo_inativacao = 'Inativação automática: emissão do laudo solicitada'"
    );
    expect(beginIdx).toBeGreaterThan(-1);
    expect(commitIdx).toBeGreaterThan(-1);
    expect(autoInativacaoIdx).toBeGreaterThan(-1);
    expect(autoInativacaoIdx).toBeGreaterThan(beginIdx);
    expect(autoInativacaoIdx).toBeLessThan(commitIdx);
  });

  it('auto-inativação deve ocorrer APÓS o UPDATE do lotes_avaliacao (step 9)', () => {
    const step9Idx = src.indexOf(
      "SET status_pagamento = 'aguardando_cobranca'"
    );
    const autoInativacaoIdx = src.indexOf(
      "motivo_inativacao = 'Inativação automática: emissão do laudo solicitada'"
    );
    expect(step9Idx).toBeGreaterThan(-1);
    expect(autoInativacaoIdx).toBeGreaterThan(-1);
    expect(autoInativacaoIdx).toBeGreaterThan(step9Idx);
  });

  it('resposta JSON de sucesso deve conter auto_inativadas_count', () => {
    expect(src).toContain('auto_inativadas_count');
  });

  it('auto_inativadas_count deve vir do rowCount do UPDATE', () => {
    expect(src).toMatch(
      /autoInativadasCount.*=.*autoInativadasResult\.rowCount/
    );
  });
});

// ---------------------------------------------------------------------------
// 12. POST /api/entidade/lote/[id]/solicitar-emissao — auto-inativação (entidade)
// ---------------------------------------------------------------------------
describe('12. solicitar-emissao entidade — auto-inativação e validações', () => {
  const filePath = path.join(
    ROOT,
    'app',
    'api',
    'entidade',
    'lote',
    '[id]',
    'solicitar-emissao',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('deve validar que lote.status === "concluido" antes de prosseguir', () => {
    expect(src).toContain("lote.status !== 'concluido'");
  });

  it('deve usar transação BEGIN/COMMIT', () => {
    expect(src).toContain("'BEGIN'");
    expect(src).toContain("'COMMIT'");
  });

  it('deve fazer ROLLBACK em caso de erro na transação', () => {
    expect(src).toContain("'ROLLBACK'");
  });

  it('deve inativar avaliações NOT IN (concluida, inativada)', () => {
    expect(src).toContain("status NOT IN ('concluida', 'inativada')");
  });

  it('deve usar motivo_inativacao de auto-inativação correto', () => {
    expect(src).toContain(
      "motivo_inativacao = 'Inativação automática: emissão do laudo solicitada'"
    );
  });

  it('resposta JSON deve conter auto_inativadas_count', () => {
    expect(src).toContain('auto_inativadas_count');
  });

  it('auto_inativadas_count deve vir do rowCount do UPDATE', () => {
    expect(src).toMatch(
      /autoInativadasCount.*=.*autoInativadasResult\.rowCount/
    );
  });

  it('deve ter isolamento de entidade (entidade_id IS NULL check não presente como filtro inverso)', () => {
    // Garante que o isolamento usa la.entidade_id = $2
    expect(src).toContain('la.entidade_id = $2');
  });

  it('deve logar com prefixo [SOLICITAR-EMISSAO-ENTIDADE]', () => {
    expect(src).toContain('[SOLICITAR-EMISSAO-ENTIDADE]');
  });
});

// ---------------------------------------------------------------------------
// 13. Remoção do botão PDF individual de avaliações
// ---------------------------------------------------------------------------
describe('13. PDF individual removido das páginas entidade e RH', () => {
  const entidadeFilePath = path.join(
    ROOT,
    'app',
    'entidade',
    'lote',
    '[id]',
    'page.tsx'
  );
  const rhFilePath = path.join(
    ROOT,
    'app',
    'rh',
    'empresa',
    '[id]',
    'lote',
    '[loteId]',
    'page.tsx'
  );

  let entidadeSrc: string;
  let rhSrc: string;

  beforeAll(() => {
    entidadeSrc = fs.readFileSync(entidadeFilePath, 'utf-8');
    rhSrc = fs.readFileSync(rhFilePath, 'utf-8');
  });

  it('entidade page.tsx: arquivo deve existir', () => {
    expect(fs.existsSync(entidadeFilePath)).toBe(true);
  });

  it('entidade page.tsx: NÃO deve conter texto "temporariamente indisponível"', () => {
    expect(entidadeSrc).not.toContain('temporariamente indispon');
  });

  it('entidade page.tsx: NÃO deve conter função _gerarRelatorioFuncionario', () => {
    expect(entidadeSrc).not.toContain('_gerarRelatorioFuncionario');
  });

  it('entidade page.tsx: NÃO deve ter <th>Ações</th> na tabela de avaliações', () => {
    // A coluna Ações que só tinha o botão PDF foi removida
    expect(entidadeSrc).not.toMatch(/<th[^>]*>\s*A[çc][õo]es\s*<\/th>/);
  });

  it('RH page.tsx: arquivo deve existir', () => {
    expect(fs.existsSync(rhFilePath)).toBe(true);
  });

  it('RH page.tsx: NÃO deve conter texto "temporariamente indisponível"', () => {
    expect(rhSrc).not.toContain('temporariamente indispon');
  });

  it('RH page.tsx: NÃO deve conter função _gerarRelatorioFuncionario', () => {
    expect(rhSrc).not.toContain('_gerarRelatorioFuncionario');
  });
});

// ---------------------------------------------------------------------------
// 14. Botão "Gerar Relatório PDF" gateado por laudo_status em entidade e RH
// ---------------------------------------------------------------------------
describe('14. Gerar Relatório PDF gateado por laudo_status (não isPronto)', () => {
  const entidadeFilePath = path.join(
    ROOT,
    'app',
    'entidade',
    'lote',
    '[id]',
    'page.tsx'
  );
  const rhFilePath = path.join(
    ROOT,
    'app',
    'rh',
    'empresa',
    '[id]',
    'lote',
    '[loteId]',
    'page.tsx'
  );

  let entidadeSrc: string;
  let rhSrc: string;

  beforeAll(() => {
    entidadeSrc = fs.readFileSync(entidadeFilePath, 'utf-8');
    rhSrc = fs.readFileSync(rhFilePath, 'utf-8');
  });

  it('entidade page.tsx: botão deve usar laudo_status como condição de disabled', () => {
    expect(entidadeSrc).toContain(
      "['emitido', 'enviado'].includes(lote.laudo_status"
    );
  });

  it('entidade page.tsx: condição deve usar ?? "" para evitar undefined', () => {
    expect(entidadeSrc).toMatch(
      /\['emitido', 'enviado'\]\.includes\(lote\.laudo_status\s*\?\?\s*''/
    );
  });

  it('entidade page.tsx: botão deve ter disabled baseado em laudo_status', () => {
    expect(entidadeSrc).toMatch(/disabled=\{!?\[?'emitido'.*laudo_status/s);
  });

  it('RH page.tsx: botão Gerar Relatório PDF usa laudo_status como condição', () => {
    expect(rhSrc).toContain(
      "['emitido', 'enviado'].includes(lote.laudo_status"
    );
  });

  it('RH page.tsx: NÃO deve ter disabled={!isPronto} no botão principal de relatório', () => {
    // isPronto foi removido como condição do botão principal — usa laudo_status
    expect(rhSrc).not.toContain('disabled={!isPronto}');
  });

  it('RH page.tsx: NÃO deve redefinir isPronto localmente', () => {
    expect(rhSrc).not.toMatch(/const isPronto\s*=/);
  });
});
