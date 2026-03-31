/**
 * @file __tests__/api/public/representantes/cadastro/notificacoes-comercial.test.ts
 *
 * Testes para o passo 9 da rota POST /api/public/representantes/cadastro:
 * notificação de usuários `comercial` E `suporte` ao receber novo cadastro de representante.
 *
 * Estrutura atual do código:
 * - Função `notificarPerfil(tipoUsuario, destinatarioTipo, linkAcao, logTag)` encapsula o bloco
 * - Usa `destinatario_cpf` (TEXT) — NÃO mais `destinatario_id`
 * - INSERT individual por usuário (for..of), sem multi-row batch
 * - Chamada para 'comercial' e para 'suporte' separadamente
 * - Falha na notificação NÃO quebra o fluxo principal (try/catch interno)
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../../../../../');
const ROUTE_PATH = path.join(
  ROOT,
  'app/api/public/representantes/cadastro/route.ts'
);

let src: string;

beforeAll(() => {
  src = fs.readFileSync(ROUTE_PATH, 'utf-8');
});

// ── Estrutura do bloco de notificação ───────────────────────────────────────

describe('Notificação — estrutura do código (passo 9)', () => {
  it('arquivo rota existe', () => {
    expect(fs.existsSync(ROUTE_PATH)).toBe(true);
  });

  it('usa função notificarPerfil para encapsular a lógica', () => {
    expect(src).toMatch(/const notificarPerfil\s*=\s*async/);
  });

  it('cada chamada de notificarPerfil tem try/catch isolado', () => {
    expect(src).toMatch(/} catch \(notifErr\)\s*\{[\s\S]*?console\.error/m);
    // Não deve lançar o erro — apenas logar
    const catchSection = src.match(
      /} catch \(notifErr\)\s*\{([\s\S]+?)\n      \}/m
    );
    expect(catchSection?.[1]).not.toMatch(/throw\s+notifErr/);
  });

  it('notifica usuários do tipo comercial', () => {
    expect(src).toMatch(/notificarPerfil\s*\(\s*\n?\s*'comercial'/m);
  });

  it('notifica usuários do tipo suporte', () => {
    expect(src).toMatch(/notificarPerfil\s*\(\s*\n?\s*'suporte'/m);
  });

  it('mensagem menciona o solicitante', () => {
    expect(src).toMatch(/solicitou cadastro como representante/);
  });
});

// ── Coluna correta: destinatario_cpf (não destinatario_id) ──────────────────

describe('Notificação — usa destinatario_cpf (segurança de schema)', () => {
  it('INSERT usa destinatario_cpf (coluna real da tabela)', () => {
    expect(src).toMatch(/destinatario_cpf/);
  });

  it('NÃO usa destinatario_id (coluna obsoleta / inexistente)', () => {
    expect(src).not.toMatch(/destinatario_id/);
  });

  it('consulta CPF dos usuários na query SELECT', () => {
    expect(src).toMatch(/SELECT cpf FROM usuarios/);
  });
});

// ── INSERT seguro — sem interpolação de valores no SQL ───────────────────────

describe('Notificação — INSERT parametrizado', () => {
  it('INSERT usa placeholders $1..$6 (sem concatenação de valores)', () => {
    // O INSERT individual por usuário usa 6 parâmetros posicionais
    expect(src).toMatch(
      /INSERT INTO notificacoes[\s\S]+?\(\$1, \$2, \$3, \$4, \$5, \$6\)/m
    );
  });

  it('NÃO interpola linkAcao diretamente no SQL (sem template literal no VALUES)', () => {
    // Garante que link_acao é passado como parâmetro, não embutido no SQL
    expect(src).not.toMatch(/VALUES.*\$\{linkAcao\}/);
  });

  it('NÃO usa created_at / NOW() no INSERT (coluna criado_em tem DEFAULT NOW())', () => {
    // A tabela usa criado_em com DEFAULT, não created_at
    // O INSERT não deve incluir a coluna (valor automático)
    expect(src).not.toMatch(/created_at.*NOW\(\)/);
  });
});

// ── Links de ação corretos ───────────────────────────────────────────────────

describe('Notificação — links de ação', () => {
  it('link_acao do comercial aponta para cadastros do lead com leadId', () => {
    expect(src).toMatch(/\/comercial\/representantes\/cadastros\/\$\{leadId\}/);
  });

  it('link_acao do suporte está definido', () => {
    // Suporte tem link_acao configurado no segundo notificarPerfil
    expect(src).toMatch(/'suporte'[\s\S]{0,200}\/suporte/m);
  });
});
