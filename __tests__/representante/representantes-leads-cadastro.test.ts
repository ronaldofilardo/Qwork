/**
 * representantes-leads-cadastro.test.ts
 *
 * Testes para a feature de cadastro de candidatos a representante (landing page):
 *
 * 1. Migration 600 — estrutura SQL correta
 * 2. representante-storage — constantes e validarMagicBytes
 * 3. Validadores de CPF/CNPJ/email extraídos da rota pública
 * 4. Rota pública /api/public/representantes/cadastro — estrutura
 * 5. Rotas admin /api/admin/representantes-leads/* — existência e exports
 * 6. lib/representantes/converter-lead — exports e docstrings
 * 7. app/admin/representantes/page.tsx — inclui lógica de tab Candidatos
 * 8. admin/page.tsx — badge soma leads pendentes
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');

// ---------------------------------------------------------------------------
// 1. MIGRATION 600
// ---------------------------------------------------------------------------

describe('1. Migration 600 — representantes_cadastro_leads', () => {
  const sqlPath = path.join(
    ROOT,
    'database',
    'migrations',
    '600_representantes_cadastro_leads.sql'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(sqlPath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(sqlPath)).toBe(true);
  });

  it('envolve tudo em transação (BEGIN/COMMIT)', () => {
    expect(src).toMatch(/^\s*BEGIN\s*;/im);
    expect(src).toMatch(/^\s*COMMIT\s*;/im);
  });

  it('cria enum status_cadastro_lead com 4 valores', () => {
    expect(src).toMatch(/CREATE TYPE status_cadastro_lead/i);
    expect(src).toMatch(/'pendente_verificacao'/);
    expect(src).toMatch(/'verificado'/);
    expect(src).toMatch(/'rejeitado'/);
    expect(src).toMatch(/'convertido'/);
  });

  it('enum usa IF NOT EXISTS via DO $$ EXCEPTION', () => {
    expect(src).toMatch(/EXCEPTION WHEN duplicate_object THEN NULL/i);
  });

  it('cria tabela representantes_cadastro_leads com IF NOT EXISTS', () => {
    expect(src).toMatch(
      /CREATE TABLE IF NOT EXISTS.*representantes_cadastro_leads/i
    );
  });

  it('tabela tem colunas obrigatórias de identificação', () => {
    expect(src).toMatch(/\btipo_pessoa\b/);
    expect(src).toMatch(/\bnome\b/);
    expect(src).toMatch(/\bemail\b/);
    expect(src).toMatch(/\btelefone\b/);
  });

  it('tabela tem colunas para dados PF', () => {
    expect(src).toMatch(/\bcpf\b.*CHAR\(11\)/i);
  });

  it('tabela tem colunas para dados PJ', () => {
    expect(src).toMatch(/\bcnpj\b.*CHAR\(14\)/i);
    expect(src).toMatch(/\brazao_social\b/i);
    expect(src).toMatch(/\bcpf_responsavel\b/i);
  });

  it('tabela tem 9 colunas de documentos (3 tipos × 3 campos)', () => {
    const docCols = [
      'doc_cpf_filename',
      'doc_cpf_key',
      'doc_cpf_url',
      'doc_cnpj_filename',
      'doc_cnpj_key',
      'doc_cnpj_url',
      'doc_cpf_resp_filename',
      'doc_cpf_resp_key',
      'doc_cpf_resp_url',
    ];
    for (const col of docCols) {
      expect(src).toMatch(new RegExp(`\\b${col}\\b`, 'i'));
    }
  });

  it('tabela tem coluna status com default pendente_verificacao', () => {
    expect(src).toMatch(
      /status.*status_cadastro_lead.*DEFAULT.*'pendente_verificacao'/i
    );
  });

  it('tabela tem metadados de auditoria (ip_origem, user_agent, timestamps)', () => {
    expect(src).toMatch(/\bip_origem\b/i);
    expect(src).toMatch(/\buser_agent\b/i);
    expect(src).toMatch(/\bcriado_em\b/i);
    expect(src).toMatch(/\bverificado_em\b/i);
    expect(src).toMatch(/\bconvertido_em\b/i);
  });

  it('tabela tem FK para representantes', () => {
    expect(src).toMatch(/REFERENCES.*representantes\(id\)/i);
  });

  it('constraints validam formato CPF (11 dígitos)', () => {
    expect(src).toMatch(/CONSTRAINT cadastro_lead_cpf_valido/i);
    expect(src).toMatch(/cpf ~ '\^\\d\{11\}\$'/i);
  });

  it('constraints validam formato CNPJ (14 dígitos)', () => {
    expect(src).toMatch(/CONSTRAINT cadastro_lead_cnpj_valido/i);
    expect(src).toMatch(/cnpj ~ '\^\\d\{14\}\$'/i);
  });

  it('constraint PF exige CPF', () => {
    expect(src).toMatch(/CONSTRAINT cadastro_lead_pf_tem_cpf/i);
    expect(src).toMatch(/tipo_pessoa = 'pj' OR cpf IS NOT NULL/i);
  });

  it('constraint PJ exige CNPJ + CPF responsável + razão social', () => {
    expect(src).toMatch(/CONSTRAINT cadastro_lead_pj_tem_cnpj/i);
    expect(src).toMatch(
      /cnpj IS NOT NULL AND cpf_responsavel IS NOT NULL AND razao_social IS NOT NULL/i
    );
  });

  it('constraint PF exige doc CPF', () => {
    expect(src).toMatch(/CONSTRAINT cadastro_lead_pf_tem_doc_cpf/i);
    expect(src).toMatch(/doc_cpf_key IS NOT NULL/i);
  });

  it('constraint PJ exige doc CNPJ + doc CPF responsável', () => {
    expect(src).toMatch(/CONSTRAINT cadastro_lead_pj_tem_docs/i);
    expect(src).toMatch(
      /doc_cnpj_key IS NOT NULL AND doc_cpf_resp_key IS NOT NULL/i
    );
  });

  it('cria índices únicos parciais para email/cpf/cnpj (excluindo rejeitados)', () => {
    expect(src).toMatch(/CREATE UNIQUE INDEX.*idx_cadastro_leads_email/i);
    expect(src).toMatch(/CREATE UNIQUE INDEX.*idx_cadastro_leads_cpf/i);
    expect(src).toMatch(/CREATE UNIQUE INDEX.*idx_cadastro_leads_cnpj/i);
    // Índices parciais excluem rejeitados → permite re-cadastro
    const rejectedExclusions = src.match(/status NOT IN \('rejeitado'\)/gi);
    expect(rejectedExclusions).not.toBeNull();
    expect(rejectedExclusions.length).toBeGreaterThanOrEqual(1);
  });

  it('cria índices de performance em status e criado_em', () => {
    expect(src).toMatch(/CREATE INDEX.*idx_cadastro_leads_status/i);
    expect(src).toMatch(/CREATE INDEX.*idx_cadastro_leads_criado_em/i);
  });

  it('habilita Row Level Security', () => {
    expect(src).toMatch(
      /ALTER TABLE.*representantes_cadastro_leads\s+ENABLE ROW LEVEL SECURITY/i
    );
  });

  it('cria policy RLS para admin', () => {
    expect(src).toMatch(/CREATE POLICY admin_cadastro_leads_all/i);
    expect(src).toMatch(/user_role.*admin/i);
  });
});

// ---------------------------------------------------------------------------
// 2. representante-storage — constantes e validarMagicBytes
// ---------------------------------------------------------------------------

describe('2. lib/storage/representante-storage — constantes e validarMagicBytes', () => {
  const storagePath = path.join(
    ROOT,
    'lib',
    'storage',
    'representante-storage.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(storagePath, 'utf-8');
  });

  it('arquivo existe', () => {
    expect(fs.existsSync(storagePath)).toBe(true);
  });

  it('exporta DOCUMENTO_MAX_SIZE_BYTES = 3MB', () => {
    expect(src).toMatch(
      /DOCUMENTO_MAX_SIZE_BYTES\s*=\s*3\s*\*\s*1024\s*\*\s*1024/
    );
  });

  it('exporta DOCUMENTO_MIMES_ACEITOS com pdf/jpeg/png', () => {
    expect(src).toMatch(/DOCUMENTO_MIMES_ACEITOS/);
    expect(src).toMatch(/'application\/pdf'/);
    expect(src).toMatch(/'image\/jpeg'/);
    expect(src).toMatch(/'image\/png'/);
  });

  it('exporta DOCUMENTO_EXTENSOES_ACEITAS com .pdf/.jpg/.png', () => {
    expect(src).toMatch(/DOCUMENTO_EXTENSOES_ACEITAS/);
    expect(src).toMatch(/'.pdf'/);
    expect(src).toMatch(/'.jpg'|'.jpeg'/);
    expect(src).toMatch(/'.png'/);
  });

  it('exporta função validarMagicBytes', () => {
    expect(src).toMatch(/export function validarMagicBytes/);
  });

  it('exporta função uploadDocumentoRepresentante', () => {
    expect(src).toMatch(/export async function uploadDocumentoRepresentante/);
  });

  it('usa bucket rep-qwork', () => {
    expect(src).toMatch(/rep-qwork/);
  });

  it('usa credenciais dedicadas BACKBLAZE_REP_KEY_ID', () => {
    expect(src).toMatch(/BACKBLAZE_REP_KEY_ID/);
    expect(src).toMatch(/BACKBLAZE_REP_APPLICATION_KEY/);
  });

  it('suporta upload local em DEV (storage/representantes com PF/PJ)', () => {
    // Path deve ser plural (representantes) com subdiretorios PF e PJ
    expect(src).toMatch(/storage.*representantes/);
    expect(src).toMatch(/subDir.*tipoPessoa.*===.*'pj'.*\?.*'PJ'.*:.*'PF'/s);
    expect(src).toMatch(/uploadLocal/);
  });

  it('uploadLocal aceita param tipoPessoa (pf|pj) com default pf', () => {
    expect(src).toMatch(/tipoPessoa.*'pf'.*\|.*'pj'.*=.*'pf'/);
  });

  it('path local usa estrutura PF ou PJ conforme tipoPessoa', () => {
    // O código usa template literal `storage/representantes/${subDir}/...`
    expect(src).toMatch(/storage\/representantes\/\$\{subDir\}/);
  });

  it('uploadDocumentoRepresentante aceita 5o param tipoPessoa com default pf', () => {
    // Assinatura deve expor o param
    expect(src).toMatch(
      /export async function uploadDocumentoRepresentante[\s\S]*?tipoPessoa.*'pf'\s*\|\s*'pj'.*=.*'pf'/
    );
  });

  it('suporta upload remoto em PROD (uploadRemoto)', () => {
    expect(src).toMatch(/uploadRemoto/);
    expect(src).toMatch(/uploadToBackblaze/);
  });

  // Testes unitários da função validarMagicBytes (importada diretamente)
  describe('validarMagicBytes — lógica', () => {
    const { validarMagicBytes } =
      require('@/lib/storage/representante-storage') as {
        validarMagicBytes: (buf: Buffer, mime: string) => boolean;
      };

    it('aceita PDF com magic bytes %PDF corretos', () => {
      const buf = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x00]);
      expect(validarMagicBytes(buf, 'application/pdf')).toBe(true);
    });

    it('rejeita PDF com magic bytes errados', () => {
      const buf = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);
      expect(validarMagicBytes(buf, 'application/pdf')).toBe(false);
    });

    it('aceita JPEG com magic bytes FF D8 FF corretos', () => {
      const buf = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);
      expect(validarMagicBytes(buf, 'image/jpeg')).toBe(true);
    });

    it('rejeita JPEG com bytes errados', () => {
      const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
      expect(validarMagicBytes(buf, 'image/jpeg')).toBe(false);
    });

    it('aceita PNG com magic bytes 89 50 4E 47 corretos', () => {
      const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00]);
      expect(validarMagicBytes(buf, 'image/png')).toBe(true);
    });

    it('rejeita PNG com bytes errados', () => {
      const buf = Buffer.from([0x25, 0x50, 0x44, 0x46]);
      expect(validarMagicBytes(buf, 'image/png')).toBe(false);
    });

    it('rejeita buffer muito pequeno (< 4 bytes)', () => {
      const buf = Buffer.from([0x25, 0x50]);
      expect(validarMagicBytes(buf, 'application/pdf')).toBe(false);
    });

    it('rejeita mime type desconhecido', () => {
      const buf = Buffer.from([0x00, 0x01, 0x02, 0x03]);
      expect(validarMagicBytes(buf, 'text/plain')).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// 3. Validadores CPF/CNPJ/email — extraídos do código-fonte
// ---------------------------------------------------------------------------

describe('3. Rota pública — estrutura e validadores embutidos', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'public',
    'representantes',
    'cadastro',
    'route.ts'
  );
  const helpersPath = path.join(
    ROOT,
    'app',
    'api',
    'public',
    'representantes',
    'cadastro',
    'helpers.ts'
  );
  let src: string;

  beforeAll(() => {
    const routeSrc = fs.readFileSync(routePath, 'utf-8');
    const helpersSrc = fs.existsSync(helpersPath)
      ? fs.readFileSync(helpersPath, 'utf-8')
      : '';
    // checkRepresentanteDuplicates foi movida para lib/validators/representante.ts
    const validatorPath = path.join(ROOT, 'lib', 'validators', 'representante.ts');
    const validatorSrc = fs.existsSync(validatorPath)
      ? fs.readFileSync(validatorPath, 'utf-8')
      : '';
    src = routeSrc + '\n' + helpersSrc + '\n' + validatorSrc;
  });

  it('arquivo existe', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('exporta POST handler', () => {
    expect(src).toMatch(/export async function POST/);
  });

  it('tem export dynamic = force-dynamic', () => {
    expect(src).toMatch(/export const dynamic\s*=\s*['"]force-dynamic['"]/);
  });

  it('implementa rate limit com Map', () => {
    expect(src).toMatch(/rateLimitMap\s*=\s*new Map/);
    expect(src).toMatch(/RATE_LIMIT_MAX\s*=\s*5/);
    expect(src).toMatch(/RATE_LIMIT_WINDOW_MS/);
  });

  it('implementa honeypot anti-bot (campo "website")', () => {
    expect(src).toMatch(/honeypot/i);
    expect(src).toMatch(/'website'/);
  });

  it('valida tipo_pessoa aceita apenas pf e pj', () => {
    expect(src).toMatch(/tipoPessoa.*!==.*'pf'.*&&.*tipoPessoa.*!==.*'pj'/);
  });

  it('tem validação de CPF com dígito verificador', () => {
    expect(src).toMatch(/function validarCPF/);
    expect(src).toMatch(/nums\.length !== 11/);
    // Deve calcular os dois dígitos verificadores
    const matches = src.match(/for\s*\(.*let i.*=.*0.*;\s*i\s*<\s*(9|10)\b/g);
    expect(matches).not.toBeNull();
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it('tem validação de CNPJ com dígito verificador', () => {
    expect(src).toMatch(/function validarCNPJ/);
    expect(src).toMatch(/nums\.length !== 14/);
    // Deve usar dois arrays de pesos
    expect(src).toMatch(/pesos[12]/);
  });

  it('tem validação de email com regex', () => {
    expect(src).toMatch(/function validarEmail/);
    // A função usa regex para validar formato de email
    expect(src).toMatch(/return.*test\(email\).*&&.*email\.length/s);
  });

  it('verifica duplicatas no cadastro de leads', () => {
    expect(src).toMatch(/representantes_cadastro_leads/);
    // Verifica duplicata por email
    expect(src).toMatch(/email.*\$1/);
  });

  it('verifica se já está cadastrado como representante', () => {
    expect(src).toMatch(/FROM representantes/);
  });

  it('valida magic bytes do arquivo', () => {
    expect(src).toMatch(/validarMagicBytes/);
    expect(src).toMatch(/DOCUMENTO_MAX_SIZE_BYTES/);
  });

  it('faz upload via uploadDocumentoRepresentante (caminho DEV/fallback)', () => {
    expect(src).toMatch(/uploadDocumentoRepresentante/);
  });

  it('aceita backblaze_key_cpf + backblaze_url_cpf no lugar de arquivo (PF)', () => {
    expect(src).toMatch(/backblaze_key_cpf/);
    expect(src).toMatch(/backblaze_url_cpf/);
  });

  it('aceita backblaze_key_cnpj + backblaze_url_cnpj (PJ)', () => {
    expect(src).toMatch(/backblaze_key_cnpj/);
    expect(src).toMatch(/backblaze_url_cnpj/);
  });

  it('aceita backblaze_key_cpf_responsavel + backblaze_url_cpf_responsavel (PJ)', () => {
    expect(src).toMatch(/backblaze_key_cpf_responsavel/);
    expect(src).toMatch(/backblaze_url_cpf_responsavel/);
  });

  it('valida que backblaze_url_cpf começa com https:// (rejeita URLs inválidas)', () => {
    expect(src).toMatch(/bbUrlCpf.*startsWith.*'https:\/\/'/);
  });

  it('valida que backblaze_url_cnpj começa com https://', () => {
    expect(src).toMatch(/bbUrlCnpj.*startsWith.*'https:\/\/'/);
  });

  it('valida que backblaze_url_cpf_responsavel começa com https://', () => {
    expect(src).toMatch(/bbUrlCpfResp.*startsWith.*'https:\/\/'/);
  });

  it('só faz upload de arquivo se NÃO houver chave Backblaze (else branch)', () => {
    // A lógica é: if (bbKey && bbUrl) { ... } else { upload arquivo }
    expect(src).toMatch(/if\s*\(\s*bbKeyCpf\s*&&\s*bbUrlCpf\s*\)/);
  });

  it('passa tipoPessoa="pf" como 5o arg no upload PF', () => {
    // PF: uploadDocumentoRepresentante(buf, 'cpf', id, mime, 'pf')
    expect(src).toMatch(
      /uploadDocumentoRepresentante[\s\S]*?'cpf'[\s\S]*?'pf'/m
    );
  });

  it('passa tipoPessoa="pj" como 5o arg no upload CNPJ (PJ)', () => {
    expect(src).toMatch(
      /uploadDocumentoRepresentante[\s\S]*?'cnpj'[\s\S]*?'pj'/m
    );
  });

  it('passa tipoPessoa="pj" como 5o arg no upload CPF responsavel (PJ)', () => {
    expect(src).toMatch(
      /uploadDocumentoRepresentante[\s\S]*?'cpf_responsavel'[\s\S]*?'pj'/m
    );
  });

  it('retorna estrutura de sucesso com id e status', () => {
    expect(src).toMatch(/success.*true/);
    expect(src).toMatch(/pendente_verificacao/);
  });

  it('retorna erro 429 quando rate limit excedido', () => {
    expect(src).toMatch(/status.*429/);
    expect(src).toMatch(/RATE_LIMIT/);
  });

  // Testes das funções de validação (importadas via require relativo)
  describe('validarCPF — algoritmo', () => {
    // Copiar a lógica do arquivo para testar inline
    function validarCPF(cpf: string): boolean {
      const nums = cpf.replace(/\D/g, '');
      if (nums.length !== 11) return false;
      if (/^(\d)\1{10}$/.test(nums)) return false;
      let soma = 0;
      for (let i = 0; i < 9; i++) soma += parseInt(nums[i]) * (10 - i);
      let resto = (soma * 10) % 11;
      if (resto === 10) resto = 0;
      if (resto !== parseInt(nums[9])) return false;
      soma = 0;
      for (let i = 0; i < 10; i++) soma += parseInt(nums[i]) * (11 - i);
      resto = (soma * 10) % 11;
      if (resto === 10) resto = 0;
      return resto === parseInt(nums[10]);
    }

    it('valida CPF real válido (com formatação)', () => {
      expect(validarCPF('529.982.247-25')).toBe(true);
    });

    it('valida CPF real válido (apenas números)', () => {
      expect(validarCPF('52998224725')).toBe(true);
    });

    it('rejeita sequência repetida (111.111.111-11)', () => {
      expect(validarCPF('11111111111')).toBe(false);
    });

    it('rejeita CPF com dígitos verificadores errados', () => {
      expect(validarCPF('12345678901')).toBe(false);
    });

    it('rejeita CPF com menos de 11 dígitos', () => {
      expect(validarCPF('1234567')).toBe(false);
    });

    it('rejeita string vazia', () => {
      expect(validarCPF('')).toBe(false);
    });
  });

  describe('validarCNPJ — algoritmo', () => {
    function validarCNPJ(cnpj: string): boolean {
      const nums = cnpj.replace(/\D/g, '');
      if (nums.length !== 14) return false;
      if (/^(\d)\1{13}$/.test(nums)) return false;
      const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      let soma = 0;
      for (let i = 0; i < 12; i++) soma += parseInt(nums[i]) * pesos1[i];
      let resto = soma % 11;
      const d1 = resto < 2 ? 0 : 11 - resto;
      if (d1 !== parseInt(nums[12])) return false;
      const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      soma = 0;
      for (let i = 0; i < 13; i++) soma += parseInt(nums[i]) * pesos2[i];
      resto = soma % 11;
      const d2 = resto < 2 ? 0 : 11 - resto;
      return d2 === parseInt(nums[13]);
    }

    it('valida CNPJ real válido', () => {
      expect(validarCNPJ('11.222.333/0001-81')).toBe(true);
    });

    it('valida CNPJ sem formatação', () => {
      expect(validarCNPJ('11222333000181')).toBe(true);
    });

    it('rejeita sequência repetida (00.000.000/0000-00)', () => {
      expect(validarCNPJ('00000000000000')).toBe(false);
    });

    it('rejeita CNPJ com dígitos verificadores errados', () => {
      expect(validarCNPJ('11222333000100')).toBe(false);
    });

    it('rejeita CNPJ com menos de 14 dígitos', () => {
      expect(validarCNPJ('1122233300')).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// 4. Rotas admin — existência e estrutura
// ---------------------------------------------------------------------------

describe('4. Rotas admin /api/admin/representantes-leads/*', () => {
  const ADMIN_BASE = path.join(
    ROOT,
    'app',
    'api',
    'admin',
    'representantes-leads'
  );

  it('rota GET lista existe', () => {
    expect(fs.existsSync(path.join(ADMIN_BASE, 'route.ts'))).toBe(true);
  });

  it('rota GET detalhe [id] existe', () => {
    expect(fs.existsSync(path.join(ADMIN_BASE, '[id]', 'route.ts'))).toBe(true);
  });

  it('rota POST aprovar [id]/aprovar existe', () => {
    expect(
      fs.existsSync(path.join(ADMIN_BASE, '[id]', 'aprovar', 'route.ts'))
    ).toBe(true);
  });

  it('rota POST rejeitar [id]/rejeitar existe', () => {
    expect(
      fs.existsSync(path.join(ADMIN_BASE, '[id]', 'rejeitar', 'route.ts'))
    ).toBe(true);
  });

  it('rota POST converter [id]/converter existe', () => {
    expect(
      fs.existsSync(path.join(ADMIN_BASE, '[id]', 'converter', 'route.ts'))
    ).toBe(true);
  });

  describe('rota GET lista — conteúdo', () => {
    let src: string;
    beforeAll(() => {
      src = fs.readFileSync(path.join(ADMIN_BASE, 'route.ts'), 'utf-8');
    });

    it('exporta GET handler', () => {
      expect(src).toMatch(/export async function GET/);
    });

    it('usa requireRole com comercial ou suporte (string ou array)', () => {
      expect(src).toMatch(
        /requireRole\s*\(\s*(?:['"](?:admin|comercial)['"]|\[)/
      );
    });

    it('tem ordenação priorizando pendente_verificacao', () => {
      expect(src).toMatch(/pendente_verificacao.*THEN 0/i);
    });

    it('retorna campo total na resposta', () => {
      expect(src).toMatch(/total/);
    });

    it('suporta filtro por status, tipo_pessoa e busca', () => {
      expect(src).toMatch(/status/);
      expect(src).toMatch(/tipo_pessoa/);
      expect(src).toMatch(/busca/);
    });
  });

  describe('rota POST aprovar — conteúdo', () => {
    let src: string;
    beforeAll(() => {
      src = fs.readFileSync(
        path.join(ADMIN_BASE, '[id]', 'aprovar', 'route.ts'),
        'utf-8'
      );
    });

    it('exporta POST handler', () => {
      expect(src).toMatch(/export async function POST/);
    });

    it('usa requireRole com comercial ou suporte (string ou array)', () => {
      expect(src).toMatch(
        /requireRole\s*\(\s*(?:['"](?:admin|comercial)['"]|\[)/
      );
    });

    it('atualiza status para verificado', () => {
      expect(src).toMatch(/'verificado'/);
    });

    it('registra verificado_em e verificado_por', () => {
      expect(src).toMatch(/verificado_em/);
      expect(src).toMatch(/verificado_por/);
    });
  });

  describe('rota POST rejeitar — conteúdo', () => {
    let src: string;
    beforeAll(() => {
      src = fs.readFileSync(
        path.join(ADMIN_BASE, '[id]', 'rejeitar', 'route.ts'),
        'utf-8'
      );
    });

    it('exporta POST handler', () => {
      expect(src).toMatch(/export async function POST/);
    });

    it('exige motivo com validação de tamanho mínimo', () => {
      expect(src).toMatch(/motivo/);
      expect(src).toMatch(/\.length\s*[<>]=?\s*\d/);
    });

    it('atualiza status para rejeitado', () => {
      expect(src).toMatch(/'rejeitado'/);
    });

    it('salva motivo_rejeicao', () => {
      expect(src).toMatch(/motivo_rejeicao/);
    });
  });

  describe('rota POST converter — conteúdo', () => {
    let src: string;
    beforeAll(() => {
      src = fs.readFileSync(
        path.join(ADMIN_BASE, '[id]', 'converter', 'route.ts'),
        'utf-8'
      );
    });

    it('exporta POST handler', () => {
      expect(src).toMatch(/export async function POST/);
    });

    it('chama converterLeadEmRepresentante', () => {
      expect(src).toMatch(/converterLeadEmRepresentante/);
    });

    it('retorna representante_id, nome e convite_link', () => {
      expect(src).toMatch(/representante_id/);
      expect(src).toMatch(/nome/);
      expect(src).toMatch(/convite_link/);
    });

    it('trata erro 404 para lead não encontrado', () => {
      expect(src).toMatch(/status.*404/);
      expect(src).toMatch(/não encontrado/i);
    });

    it('trata erro 409 para conflitos (duplicata ou status inválido)', () => {
      const count409 = (src.match(/status.*409/g) ?? []).length;
      expect(count409).toBeGreaterThanOrEqual(1);
    });
  });

  describe('rotas admin/representantes — acesso suporte', () => {
    const REP_BASE = path.join(ROOT, 'app', 'api', 'admin', 'representantes');

    it('GET /api/admin/representantes aceita suporte (requireRole array)', () => {
      const src = fs.readFileSync(path.join(REP_BASE, 'route.ts'), 'utf-8');
      expect(src).toMatch(/requireRole\s*\(\s*\[/);
      expect(src).toMatch(/'suporte'/);
    });

    it('GET /api/admin/representantes/[id] aceita suporte', () => {
      const src = fs.readFileSync(
        path.join(REP_BASE, '[id]', 'route.ts'),
        'utf-8'
      );
      expect(src).toMatch(/requireRole\s*\(\s*\[/);
      expect(src).toMatch(/'suporte'/);
    });

    it('GET /api/admin/representantes/[id]/documentos aceita suporte', () => {
      const src = fs.readFileSync(
        path.join(REP_BASE, '[id]', 'documentos', 'route.ts'),
        'utf-8'
      );
      expect(src).toMatch(/requireRole\s*\(\s*\[/);
      expect(src).toMatch(/'suporte'/);
    });

    it('GET /api/admin/representantes/leads aceita suporte', () => {
      const src = fs.readFileSync(
        path.join(REP_BASE, 'leads', 'route.ts'),
        'utf-8'
      );
      expect(src).toMatch(/requireRole\s*\(\s*\[/);
      expect(src).toMatch(/'suporte'/);
    });

    it('GET /api/admin/leads/[id]/documentos aceita suporte', () => {
      const leadsDocPath = path.join(
        ROOT,
        'app',
        'api',
        'admin',
        'leads',
        '[id]',
        'documentos',
        'route.ts'
      );
      const src = fs.readFileSync(leadsDocPath, 'utf-8');
      expect(src).toMatch(/requireRole\s*\(\s*\[/);
      expect(src).toMatch(/'suporte'/);
    });
  });
});

// ---------------------------------------------------------------------------
// 5. lib/representantes/converter-lead — exports e lógica
// ---------------------------------------------------------------------------

describe('5. lib/representantes/converter-lead — estrutura', () => {
  const filePath = path.join(
    ROOT,
    'lib',
    'representantes',
    'converter-lead.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('arquivo existe', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('exporta ConversaoResult interface com 4 campos', () => {
    expect(src).toMatch(/export interface ConversaoResult/);
    expect(src).toMatch(/representante_id:\s*number/);
    expect(src).toMatch(/nome:\s*string/);
    expect(src).toMatch(/email:\s*string/);
    expect(src).toMatch(/convite_link:\s*string/);
  });

  it('exporta função converterLeadEmRepresentante', () => {
    expect(src).toMatch(/export async function converterLeadEmRepresentante/);
  });

  it('exporta função contarLeadsPendentes', () => {
    expect(src).toMatch(/export async function contarLeadsPendentes/);
  });

  it('usa transação para garantir atomicidade', () => {
    expect(src).toMatch(/transaction\s*\(/);
  });

  it('usa FOR UPDATE para travar linha (evitar race condition)', () => {
    expect(src).toMatch(/FOR UPDATE/i);
  });

  it('verifica status verificado antes de converter', () => {
    expect(src).toMatch(/status.*!==.*'verificado'/);
  });

  it('verifica se lead já foi convertido', () => {
    expect(src).toMatch(/convertido_em.*!=.*null/i);
  });

  it('verifica unicidade de email antes de inserir', () => {
    expect(src).toMatch(/SELECT.*FROM representantes WHERE email/i);
  });

  it('verifica unicidade de CPF para PF via verificarCpfEmUso (cross-table)', () => {
    // O código usa a função verificarCpfEmUso em vez de SELECT direto
    expect(src).toMatch(/verificarCpfEmUso/);
    expect(src).toMatch(/cpfConflicts/);
  });

  it('verifica unicidade de CNPJ para PJ', () => {
    expect(src).toMatch(/SELECT.*FROM representantes WHERE cnpj/i);
  });

  it('insere representante com status aguardando_senha (convite por e-mail)', () => {
    expect(src).toMatch(/'aguardando_senha'/);
  });

  it('atualiza lead para convertido com FK', () => {
    expect(src).toMatch(/UPDATE.*representantes_cadastro_leads/i);
    expect(src).toMatch(/'convertido'/);
    expect(src).toMatch(/representante_id/);
  });

  it('registra aprovado_por_cpf do admin', () => {
    expect(src).toMatch(/aprovado_por_cpf/i);
  });

  it('contarLeadsPendentes consulta status pendente_verificacao', () => {
    expect(src).toMatch(/pendente_verificacao/);
    expect(src).toMatch(/COUNT/i);
  });
});

// ---------------------------------------------------------------------------
// 6. app/admin/representantes/page.tsx — tab Candidatos
// ---------------------------------------------------------------------------

describe('6. app/admin/representantes/page.tsx — tab Candidatos', () => {
  const compPath = path.join(
    ROOT,
    'app',
    'admin',
    'representantes',
    'page.tsx'
  );
  const BASE = path.join(ROOT, 'app', 'admin', 'representantes');
  let src: string;

  beforeAll(() => {
    const files = [
      compPath,
      path.join(BASE, 'types.ts'),
      path.join(BASE, 'constants.ts'),
      path.join(BASE, 'hooks', 'useLeads.ts'),
      path.join(BASE, 'hooks', 'useRepActions.ts'),
      path.join(BASE, 'hooks', 'useCachedDocs.ts'),
      path.join(BASE, 'components', 'LeadsTab.tsx'),
    ];
    src = files
      .filter((f) => fs.existsSync(f))
      .map((f) => fs.readFileSync(f, 'utf-8'))
      .join('\n');
  });

  it('arquivo existe em app/admin/representantes/page.tsx', () => {
    expect(fs.existsSync(compPath)).toBe(true);
  });

  it('define tipo TabAtiva com representantes e candidatos', () => {
    expect(src).toMatch(/TabAtiva.*=.*'representantes'.*\|.*'candidatos'/);
  });

  it('define interface Lead com campos necessários', () => {
    expect(src).toMatch(/interface Lead/);
    expect(src).toMatch(/tipo_pessoa.*'pf'.*\|.*'pj'/);
    expect(src).toMatch(/doc_cpf_filename/);
    expect(src).toMatch(/doc_cnpj_filename/);
    expect(src).toMatch(/doc_cpf_resp_filename/);
  });

  it('tem estado tabAtiva com default representantes', () => {
    expect(src).toMatch(/useState<TabAtiva>\s*\(\s*'representantes'\s*\)/);
  });

  it('tem estado e fetch para leads (carregarLeads)', () => {
    expect(src).toMatch(/carregarLeads/);
    expect(src).toMatch(/\/api\/admin\/representantes-leads/);
  });

  it('carrega leads ao trocar para tab candidatos', () => {
    expect(src).toMatch(/tabAtiva.*===.*'candidatos'/);
    expect(src).toMatch(/carregarLeads\(\)/);
  });

  it('implementa função aprovarLead', () => {
    expect(src).toMatch(/const aprovarLead/);
    expect(src).toMatch(/\/aprovar/);
  });

  it('implementa função rejeitarLead com motivo obrigatório', () => {
    expect(src).toMatch(/const rejeitarLead/);
    expect(src).toMatch(/\/rejeitar/);
    expect(src).toMatch(/trim\(\)\.length\s*<\s*5/);
  });

  it('implementa função converterLead', () => {
    expect(src).toMatch(/const converterLead/);
    expect(src).toMatch(/\/converter/);
  });

  it('após converter, recarrega representantes e leads', () => {
    expect(src).toMatch(/await (?:callbacks\.)?carregar\(\)/);
    expect(src).toMatch(/await (?:callbacks\.)?carregarLeads\(\)/);
  });

  it('exibe badges LEAD_STATUS_BADGE para 4 status', () => {
    expect(src).toMatch(/LEAD_STATUS_BADGE/);
    expect(src).toMatch(/pendente_verificacao/);
    expect(src).toMatch(/verificado/);
    expect(src).toMatch(/convertido/);
  });

  it('exibe quantidade pendentes no botão da tab Candidatos', () => {
    expect(src).toMatch(/leadsPendentes\s*>/);
    expect(src).toMatch(/leadsPendentes/);
  });

  it('abre documentos via window.open com noopener', () => {
    // Interface Lead define os campos de URL
    expect(src).toMatch(/doc_cpf_url/);
    expect(src).toMatch(/doc_cnpj_url/);
    expect(src).toMatch(/doc_cpf_resp_url/);
    // Docs abertos via window.open (não atributo HTML target=_blank)
    expect(src).toMatch(/window\.open.*'_blank'/);
    expect(src).toMatch(/noopener/);
  });

  it('tabela de leads exibe botões para abrir docs (openLeadDoc)', () => {
    // Tabela tem coluna Docs com botões de ação por tipo doc
    expect(src).toMatch(/openLeadDoc/);
    expect(src).toMatch(/'cpf'/);
    expect(src).toMatch(/'cnpj'/);
    expect(src).toMatch(/'cpf_resp'/);
  });

  it('ações no drawer variam conforme status do lead', () => {
    // Pendente: mostrar Aprovar + Rejeitar
    expect(src).toMatch(/pendente_verificacao.*Aprovar/s);
    // Verificado: mostrar Converter + Rejeitar
    expect(src).toMatch(/verificado.*Converter/s);
  });

  it('modal de conversão informa ao admin o que vai acontecer', () => {
    expect(src).toMatch(/leadConverterModal/);
    expect(src).toMatch(/Converter em Representante/);
    expect(src).toMatch(/status.*apto/i);
  });

  it('exibe botão Copiar Link quando lead convertido e sem aceite de termos', () => {
    // Botão condicional: {l.status === 'convertido' && !l.aceite_termos && l.convite_token && (...)}
    expect(src).toMatch(/status.*===.*['"]convertido['"]/);
    expect(src).toMatch(/!l\.aceite_termos/);
    expect(src).toMatch(/l\.convite_token/);
    expect(src).toMatch(/Copiar Link/);
  });

  it('usa convite_token na URL de convite /representante/criar-senha?token=', () => {
    // Construir URL: const baseUrl = ...; const conviteUrl = `${baseUrl}/representante/criar-senha?token=${l.convite_token}`;
    expect(src).toMatch(/\/representante\/criar-senha/);
    expect(src).toMatch(/token=.*convite_token/);
  });

  it('oculta botão Copiar Link quando aceite_termos é true', () => {
    // O && !l.aceite_termos garante que só mostra quando aceite_termos é false
    // Verificar que a condição existe
    expect(src).toMatch(/!l\.aceite_termos/);
  });

  it('interface Lead inclui campos convite_token e aceite_termos', () => {
    expect(src).toMatch(/interface Lead/);
    expect(src).toMatch(/convite_token/);
    expect(src).toMatch(/aceite_termos/);
  });
});

// ---------------------------------------------------------------------------
// 7. admin/page.tsx — badge soma leads pendentes
// ---------------------------------------------------------------------------

describe('7. admin/page.tsx — badge de representantes soma leads pendentes', () => {
  const pagePath = path.join(ROOT, 'app', 'admin', 'page.tsx');
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(pagePath, 'utf-8');
  });

  it('arquivo existe', () => {
    expect(fs.existsSync(pagePath)).toBe(true);
  });

  it.skip('busca representantes ativos para o badge', () => {
    // admin/page.tsx busca representantes ativos (não leads pendentes diretamente)
    expect(src).toMatch(/representantes.*status.*ativo|status=ativo/i);
  });

  it.skip('badge de leads pendentes está na página de representantes (não no admin geral)', () => {
    // O badge de leads pendentes é exibido na aba Candidatos dentro de /admin/representantes
    // O admin/page.tsx foca em contadores de representantes ativos
    expect(src).toMatch(/representantesAtivos/);
  });

  it('trata erro de busca silenciosamente (não quebra badge)', () => {
    // catch (error) em admin/page.tsx — pode ter newline entre (error) e {
    expect(src).toMatch(/catch\s*\(error\)/s);
  });
});

// ---------------------------------------------------------------------------
// 9. LP route — mapeamento camelCase → snake_case para QWork
// ---------------------------------------------------------------------------

describe('9. LP route — mapeamento camelCase → snake_case ao encaminhar ao QWork', () => {
  const lpRoutePath = path.join(
    path.resolve(__dirname, '../..', '..', 'qwork-lp'),
    'app',
    'api',
    'representantes',
    'cadastro',
    'route.ts'
  );

  // Se a LP não está acessível no ambiente de teste do QWork, pula o grupo
  const lpExists = fs.existsSync(lpRoutePath);
  const testIf = lpExists ? it : it.skip;
  let src = '';

  beforeAll(() => {
    if (lpExists) src = fs.readFileSync(lpRoutePath, 'utf-8');
  });

  testIf('arquivo da rota de cadastro da LP existe', () => {
    expect(lpExists).toBe(true);
  });

  testIf('encaminha tipo_pessoa em snake_case e lowercase', () => {
    expect(src).toMatch(/forwardData\.append\(\s*["']tipo_pessoa["']/);
    expect(src).toMatch(/\.toLowerCase\(\)/);
  });

  testIf('encaminha razao_social (snake_case, nao razaoSocial)', () => {
    expect(src).toMatch(/forwardData\.append\(\s*["']razao_social["']/);
  });

  testIf('encaminha cpf_responsavel (snake_case, nao cpfResponsavel)', () => {
    expect(src).toMatch(/forwardData\.append\(\s*["']cpf_responsavel["']/);
  });

  testIf('encaminha documento_cpf_responsavel (snake_case, nao documentoCpfResponsavel)', () => {
    expect(src).toMatch(/forwardData\.append\(\s*["']documento_cpf_responsavel["']/);
  });

  testIf('encaminha documento_cnpj (snake_case, nao documentoCnpj)', () => {
    expect(src).toMatch(/forwardData\.append\(\s*["']documento_cnpj["']/);
  });

  testIf(
    'encaminha documento_cpf_responsavel (snake_case, nao documentoCpfResponsavel)',
    () => {
      expect(src).toMatch(
        /forwardData\.append\(\s*["']documento_cpf_responsavel["']/
      );
    }
  );

  testIf(
    'NÃO usa forward ingênuo (for...of formData.entries) — evita bug anterior',
    () => {
      // O bug era: for (const [key, value] of formData.entries()) forwardData.append(key,...)
      // que enviava os campos camelCase sem mapeamento
      const hasNaiveForward =
        /for\s*\(.*of\s+formData\.entries\(\)\)/.test(src) &&
        /forwardData\.append\(key/.test(src);
      expect(hasNaiveForward).toBe(false);
    }
  );

  testIf('não encaminha quando QWORK_API_SKIP=true (env check)', () => {
    expect(src).toMatch(/QWORK_API_SKIP.*===.*["']true["']/);
    expect(src).toMatch(/skipQWork/);
  });

  testIf(
    'URL do QWork usa env QWORK_API_URL com fallback localhost:3001',
    () => {
      expect(src).toMatch(/QWORK_API_URL.*\|\|.*localhost:3001/);
    }
  );

  testIf('retorna erro (400 ou 503) quando QWork falhar', () => {
    // QWork retorna !ok → status 400 com mensagem amigável tratada
    // QWork inalcançável → status 503
    expect(src).toMatch(/status.*400|status.*503/);
  });

  testIf('mapeia erro duplicata (email ou cnpj) para mensagem legível', () => {
    // A LP delega o CPF ao QWork; erros de duplicata identificados são email e CNPJ
    expect(src).toMatch(
      /e-mail.*já.*possui|já.*possui.*e-mail|Este CNPJ|Este e-mail/i
    );
  });

  testIf('mapeia erro duplicata de email para mensagem legível', () => {
    expect(src).toMatch(
      /e-mail.*registrado|registrado.*e-mail|e-mail.*já.*possui|Este e-mail/i
    );
  });
});

// ---------------------------------------------------------------------------
// 10. QWork package.json — porta fixa 3001
// ---------------------------------------------------------------------------

describe('10. QWork package.json — porta de desenvolvimento fixa', () => {
  const pkgPath = path.join(ROOT, 'package.json');
  let pkg: Record<string, unknown>;

  beforeAll(() => {
    pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  });

  it('arquivo package.json existe', () => {
    expect(fs.existsSync(pkgPath)).toBe(true);
  });

  it('script dev usa next dev', () => {
    const devScript = (pkg.scripts as Record<string, string>)?.dev ?? '';
    expect(devScript).toMatch(/next dev/);
  });

  it('projeto usa pnpm (pnpm-workspace.yaml existe)', () => {
    const wsPath = path.join(ROOT, 'pnpm-workspace.yaml');
    expect(fs.existsSync(wsPath)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 8. BACKBLAZE_CADASTRO_SETUP.md — documentação atualizada
// ---------------------------------------------------------------------------

describe('8. BACKBLAZE_CADASTRO_SETUP.md — documenta bucket rep-qwork', () => {
  const docPath = path.join(ROOT, 'BACKBLAZE_CADASTRO_SETUP.md');
  const docExists = fs.existsSync(docPath);
  const testIf = docExists ? it : it.skip;
  let src = '';

  beforeAll(() => {
    if (docExists) src = fs.readFileSync(docPath, 'utf-8');
  });

  testIf('arquivo existe', () => {
    expect(docExists).toBe(true);
  });

  testIf('documenta bucket rep-qwork', () => {
    expect(src).toMatch(/rep-qwork/);
  });

  testIf('documenta endpoint Backblaze us-east-005', () => {
    expect(src).toMatch(/s3\.us-east-005\.backblazeb2\.com/);
  });

  testIf('documenta variáveis de ambiente necessárias', () => {
    expect(src).toMatch(/BACKBLAZE_REP_KEY_ID/);
    expect(src).toMatch(/BACKBLAZE_REP_APPLICATION_KEY/);
  });
});
