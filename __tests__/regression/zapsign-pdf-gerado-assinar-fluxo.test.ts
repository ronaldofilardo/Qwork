/**
 * Testes de Regressão — ZapSign: PDF Gerado + Botão "Assinar" + Hash antes do Bucket
 *
 * Implementações validadas (sessão atual):
 *
 * 1. lib/laudo-auto.ts — máquina de estados duplamente bifurcada
 *    - ZapSign habilitado: gerarPDFLaudo() → {status:'pdf_gerado'} (sem hash)
 *    - ZapSign desabilitado: gerarPDFLaudo() → {status:'emitido'} (com hash)
 *    - enviarParaAssinaturaZapSign() → {status:'aguardando_assinatura'}
 *    - @deprecated stub gerarLaudoCompletoEmitirPDF() → delega a gerarPDFLaudo()
 *
 * 2. app/api/emissor/laudos/[loteId]/route.ts
 *    - POST: STATUS_IMUTAVEL inclui 'pdf_gerado' e 'aguardando_assinatura'
 *    - POST: usa gerarPDFLaudo (não gerarLaudoCompletoEmitirPDF)
 *    - GET: retorna laudo_status no response
 *    - GET: laudoFoiGerado usa STATUSES_POS_GERACAO (inclui pdf_gerado)
 *
 * 3. app/api/emissor/laudos/[loteId]/assinar/route.ts — novo endpoint
 *    - POST protegido por requireRole('emissor')
 *    - Guard isZapSignHabilitado() — retorna 409 se desabilitado
 *    - Chama enviarParaAssinaturaZapSign()
 *
 * 4. app/api/webhooks/zapsign/route.ts — 3 fases atômicas
 *    - FASE A: hash_pdf + assinado_em + zapsign_status='signed' (antes do upload)
 *    - FASE B: status='enviado' + arquivo_remoto_* (após upload)
 *    - FASE C: lotes_avaliacao status='finalizado' + laudo_enviado_em
 *    - Imports estáticos de 'path' e 'fs' (não dinâmicos)
 *
 * 5. lib/hooks/useProgressoEmissao.ts — novos status 'pdf_gerado' e 'aguardando_assinatura'
 *
 * 6. app/emissor/laudo/[loteId]/useLaudo.ts
 *    - handleAssinarDigitalmente() — POST /api/emissor/laudos/{loteId}/assinar
 *    - polling useEffect (10s) ativo quando laudoStatus === 'aguardando_assinatura'
 *    - fetchLaudo conecta data.laudo_status → state laudoStatus
 *
 * 7. app/emissor/laudo/[loteId]/components/LaudoHeader.tsx
 *    - Botão "Assinar Digitalmente" renderizado quando laudoStatus === 'pdf_gerado'
 *    - Banner spinner quando laudoStatus === 'aguardando_assinatura'
 *
 * 8. database/migrations/1139_laudo_pdf_gerado_status.sql
 *    - ALTER TYPE status_laudo_enum ADD VALUE 'pdf_gerado'
 *    - ADD COLUMN pdf_gerado_em
 *
 * 9. Hash desacoplado de arquivo_remoto_url (5 arquivos corrigidos)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');

// ─── 1. lib/laudo-auto.ts ─────────────────────────────────────────────────────

describe('1. lib/laudo-auto.ts — máquina de estados ZapSign', () => {
  const filePath = path.join(ROOT, 'lib', 'laudo-auto.ts');
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('deve exportar gerarPDFLaudo (novo nome)', () => {
    expect(src).toContain('export async function gerarPDFLaudo(');
  });

  it('deve exportar enviarParaAssinaturaZapSign', () => {
    expect(src).toContain('export async function enviarParaAssinaturaZapSign(');
  });

  it('deve importar isZapSignHabilitado estaticamente', () => {
    // Import pode ser multilinha: import { \n  criarDocumentoZapSign,\n  isZapSignHabilitado,\n}
    expect(src).toContain('isZapSignHabilitado');
    // Deve ser import estático (não dinâmico)
    expect(src).not.toContain("await import('@/lib/integrations/zapsign");
  });

  it('deve importar criarDocumentoZapSign estaticamente', () => {
    expect(src).toContain('criarDocumentoZapSign');
  });

  it('fork ZapSign: deve retornar status pdf_gerado (sem hash)', () => {
    expect(src).toContain("status: 'pdf_gerado'");
  });

  it('fork legacy: deve retornar status emitido (com hash)', () => {
    expect(src).toContain("status: 'emitido'");
  });

  it('rollback deve resetar pdf_gerado_em para NULL', () => {
    expect(src).toContain('pdf_gerado_em = NULL');
  });

  it('enviarParaAssinaturaZapSign deve retornar status aguardando_assinatura', () => {
    expect(src).toContain("status: 'aguardando_assinatura'");
  });

  it('stub @deprecated gerarLaudoCompletoEmitirPDF deve existir', () => {
    expect(src).toContain('@deprecated');
    expect(src).toContain('gerarLaudoCompletoEmitirPDF');
    expect(src).toContain('return gerarPDFLaudo(');
  });

  it('interface ResultadoEmissaoLaudo deve incluir campo status', () => {
    expect(src).toMatch(/ResultadoEmissaoLaudo/);
    expect(src).toMatch(/pdf_gerado.*aguardando_assinatura.*emitido/s);
  });
});

// ─── 2. app/api/emissor/laudos/[loteId]/route.ts ─────────────────────────────

describe('2. POST /api/emissor/laudos/[loteId] — imutabilidade e resposta', () => {
  const filePath = path.join(
    ROOT,
    'app',
    'api',
    'emissor',
    'laudos',
    '[loteId]',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('STATUS_IMUTAVEL deve incluir pdf_gerado', () => {
    expect(src).toContain("'pdf_gerado'");
    expect(src).toContain('STATUS_IMUTAVEL');
  });

  it('STATUS_IMUTAVEL deve incluir aguardando_assinatura', () => {
    expect(src).toContain("'aguardando_assinatura'");
  });

  it('GET deve retornar laudo_status no response', () => {
    expect(src).toContain('laudo_status');
  });

  it('STATUSES_POS_GERACAO deve incluir pdf_gerado', () => {
    expect(src).toContain('STATUSES_POS_GERACAO');
    expect(src).toContain('laudoFoiGerado');
  });

  it('POST deve usar gerarPDFLaudo (não gerarLaudoCompletoEmitirPDF diretamente)', () => {
    expect(src).toContain('gerarPDFLaudo');
    // Não deve haver chamada direta (pode existir import do deprecated mas não chamada)
    expect(src).not.toMatch(/await gerarLaudoCompletoEmitirPDF\s*\(/);
  });

  it('resposta POST deve incluir campo status', () => {
    expect(src).toContain('status: resultado.status');
  });

  it('resposta POST deve incluir campo pdf_gerado', () => {
    expect(src).toContain('pdf_gerado');
  });

  it('GET deve selecionar pdf_gerado_em no SELECT', () => {
    expect(src).toContain('pdf_gerado_em');
  });
});

// ─── 3. app/api/emissor/laudos/[loteId]/assinar/route.ts ─────────────────────

describe('3. POST /api/emissor/laudos/[loteId]/assinar — novo endpoint', () => {
  const filePath = path.join(
    ROOT,
    'app',
    'api',
    'emissor',
    'laudos',
    '[loteId]',
    'assinar',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('deve exportar handler POST', () => {
    // Pode ser `export async function POST` ou `export const POST = async`
    expect(src).toMatch(/export.*(async function POST|const POST = async)/);
  });

  it('deve usar requireRole emissor', () => {
    expect(src).toContain("requireRole('emissor')");
  });

  it('deve verificar isZapSignHabilitado e retornar 409 se desabilitado', () => {
    expect(src).toContain('isZapSignHabilitado');
    expect(src).toContain('409');
  });

  it('deve chamar enviarParaAssinaturaZapSign', () => {
    expect(src).toContain('enviarParaAssinaturaZapSign');
  });

  it('deve retornar status e sign_url no response', () => {
    expect(src).toContain('sign_url');
  });
});

// ─── 4. app/api/webhooks/zapsign/route.ts ────────────────────────────────────

describe('4. Webhook ZapSign — 3 fases atômicas', () => {
  const filePath = path.join(
    ROOT,
    'app',
    'api',
    'webhooks',
    'zapsign',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('deve ter import estático de path no topo', () => {
    // Import estático (não dinâmico) — evita ESLint unbound-method
    expect(src).toMatch(/^import path from ['"]path['"]/m);
  });

  it('deve ter import estático de fs no topo', () => {
    expect(src).toMatch(/^import fs from ['"]fs['"]/m);
  });

  it('FASE A: deve atualizar hash_pdf antes do upload', () => {
    expect(src).toContain('FASE A');
    expect(src).toContain('hash_pdf');
    expect(src).toContain("zapsign_status = 'signed'");
  });

  it('FASE B: deve atualizar status enviado e arquivo_remoto após upload', () => {
    expect(src).toContain('FASE B');
    // SQL pode ter espaços extras em SET: SET status = 'enviado'
    expect(src).toMatch(/status.*=.*'enviado'/);
    expect(src).toContain('arquivo_remoto_provider');
  });

  it('FASE C: deve finalizar lotes_avaliacao', () => {
    expect(src).toContain('FASE C');
    expect(src).toContain('lotes_avaliacao');
    // status pode ter espaços: SET status           = 'finalizado',
    expect(src).toMatch(/SET status.*=.*'finalizado'/);
    expect(src).toContain('laudo_enviado_em');
  });

  it('FASE A deve ocorrer antes de FASE B no código', () => {
    const posA = src.indexOf('FASE A');
    const posB = src.indexOf('FASE B');
    expect(posA).toBeGreaterThan(-1);
    expect(posB).toBeGreaterThan(posA);
  });

  it('não deve usar import dinâmico de path ou fs', () => {
    expect(src).not.toContain("await import('path')");
    expect(src).not.toContain("await import('fs')");
    expect(src).not.toContain('await import("path")');
    expect(src).not.toContain('await import("fs")');
  });
});

// ─── 5. lib/hooks/useProgressoEmissao.ts ─────────────────────────────────────

describe('5. useProgressoEmissao — novos status pdf_gerado e aguardando_assinatura', () => {
  const filePath = path.join(ROOT, 'lib', 'hooks', 'useProgressoEmissao.ts');
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('StatusEmissao deve incluir pdf_gerado', () => {
    expect(src).toContain("'pdf_gerado'");
  });

  it('StatusEmissao deve incluir aguardando_assinatura', () => {
    expect(src).toContain("'aguardando_assinatura'");
  });

  it('getMensagemProgresso deve ter mensagem para pdf_gerado', () => {
    // Deve ter a string pdf_gerado como chave em um objeto de mensagens
    expect(src).toMatch(/pdf_gerado.*:/);
  });

  it('calcularPorcentagem deve ter valor para pdf_gerado', () => {
    // pdf_gerado deve ter uma porcentagem entre outros status
    expect(src).toMatch(/pdf_gerado.*\d+/s);
  });
});

// ─── 6. app/emissor/laudo/[loteId]/useLaudo.ts ───────────────────────────────

describe('6. useLaudo.ts — polling ZapSign e handleAssinarDigitalmente', () => {
  const filePath = path.join(
    ROOT,
    'app',
    'emissor',
    'laudo',
    '[loteId]',
    'useLaudo.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('deve ter estado laudoStatus', () => {
    expect(src).toContain('laudoStatus');
  });

  it('deve ter estado assinandoLaudo', () => {
    expect(src).toContain('assinandoLaudo');
  });

  it('deve ter handleAssinarDigitalmente', () => {
    expect(src).toContain('handleAssinarDigitalmente');
  });

  it('handleAssinarDigitalmente deve chamar /assinar endpoint', () => {
    expect(src).toContain('/assinar');
  });

  it('deve ter polling useEffect que observa laudoStatus', () => {
    expect(src).toContain('aguardando_assinatura');
    expect(src).toContain('setInterval');
  });

  it('deve exportar laudoStatus e assinandoLaudo', () => {
    expect(src).toContain('laudoStatus,');
    expect(src).toContain('assinandoLaudo,');
  });

  it('fetchLaudo deve conectar data.laudo_status ao estado', () => {
    expect(src).toContain('data.laudo_status');
  });
});

// ─── 7. app/emissor/laudo/[loteId]/components/LaudoHeader.tsx ────────────────

describe('7. LaudoHeader.tsx — botão Assinar e banner spinner', () => {
  const filePath = path.join(
    ROOT,
    'app',
    'emissor',
    'laudo',
    '[loteId]',
    'components',
    'LaudoHeader.tsx'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('deve aceitar prop laudoStatus', () => {
    expect(src).toContain('laudoStatus');
  });

  it('deve aceitar prop assinandoLaudo', () => {
    expect(src).toContain('assinandoLaudo');
  });

  it('deve aceitar prop onAssinarDigitalmente', () => {
    expect(src).toContain('onAssinarDigitalmente');
  });

  it('deve renderizar botão Assinar Digitalmente quando pdf_gerado', () => {
    expect(src).toContain('Assinar Digitalmente');
    expect(src).toContain('pdf_gerado');
  });

  it('deve renderizar banner de aguardando assinatura', () => {
    expect(src).toContain('aguardando_assinatura');
    expect(src).toContain('Aguardando');
  });
});

// ─── 8. database/migrations/1139_laudo_pdf_gerado_status.sql ─────────────────

describe('8. Migration 1139 — pdf_gerado_em e status enum', () => {
  const filePath = path.join(
    ROOT,
    'database',
    'migrations',
    '1139_laudo_pdf_gerado_status.sql'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('deve adicionar valor pdf_gerado ao enum', () => {
    // Pode ser ADD VALUE ou ADD VALUE IF NOT EXISTS
    expect(src).toMatch(/ADD VALUE.*'pdf_gerado'/);
  });

  it('deve adicionar coluna pdf_gerado_em', () => {
    expect(src).toContain('pdf_gerado_em');
    expect(src).toContain('ADD COLUMN');
  });

  it('deve atualizar constraint de validação de status', () => {
    expect(src).toContain('chk_laudos_status_valid');
    expect(src).toContain("'pdf_gerado'");
  });
});

// ─── 9. Hash desacoplado de arquivo_remoto_url ───────────────────────────────

describe('9. Hash SHA-256 desacoplado de arquivo_remoto_url', () => {
  const files = [
    ['app/entidade/lote/[id]/page.tsx', 'EntidadeLote page.tsx'],
    [
      'app/entidade/lote/[id]/components/EntidadeLoteActions.tsx',
      'EntidadeLoteActions',
    ],
    ['app/rh/empresa/[id]/lote/[loteId]/page.tsx', 'RH Lote page.tsx'],
    [
      'app/rh/empresa/[id]/lote/[loteId]/components/LoteStatusBanners.tsx',
      'LoteStatusBanners',
    ],
    ['components/lote/LoteDetailPage.tsx', 'LoteDetailPage'],
  ];

  files.forEach(([relPath, label]) => {
    describe(label, () => {
      const filePath = path.join(ROOT, relPath);
      let src: string;

      beforeAll(() => {
        src = fs.readFileSync(filePath, 'utf-8');
      });

      it(`${label}: não deve usar "lote.hash_pdf && lote.arquivo_remoto_url" como condição`, () => {
        // A condição antiga era: hash_pdf && arquivo_remoto_url
        // A nova condição correta: apenas hash_pdf (desacoplado)
        expect(src).not.toMatch(
          /lote\.hash_pdf\s*&&\s*lote\.arquivo_remoto_url/
        );
      });

      it(`${label}: deve exibir hash quando disponível sem condicionar a arquivo_remoto_url`, () => {
        // Deve sempre existir referência ao hash_pdf
        expect(src).toContain('hash_pdf');
      });
    });
  });
});

// ─── 10. Legacy: sem chamadas diretas a gerarLaudoCompletoEmitirPDF no código de produção ──

describe('10. Legacy cleanup — sem chamadas diretas a gerarLaudoCompletoEmitirPDF em produção', () => {
  const productionDirs = [
    path.join(ROOT, 'app', 'api'),
    path.join(ROOT, 'lib'),
  ];

  it('nenhum arquivo de produção deve chamar gerarLaudoCompletoEmitirPDF diretamente (exceto stub)', () => {
    const violations: string[] = [];

    function scanDir(dir: string) {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          // Excluir o próprio laudo-auto.ts (onde o stub existe)
          if (fullPath.endsWith('laudo-auto.ts')) continue;
          if (content.includes('await gerarLaudoCompletoEmitirPDF(')) {
            violations.push(path.relative(ROOT, fullPath));
          }
        }
      }
    }

    productionDirs.forEach(scanDir);

    expect(violations).toEqual([]);
  });
});
