/**
 * TESTES: Configuração Emissor Local → Banco PROD
 *
 * Data: 17/02/2026
 * Objetivo: Validar que emissor local acessa banco Neon (PROD)
 *
 * Contexto:
 * - Pagamentos Asaas → Webhook → Neon (PROD)
 * - Emissor LOCAL → Neon (PROD) [CORREÇÃO APLICADA]
 * - Puppeteer roda local, mas dados vêm do Neon
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

describe('🔧 Emissor Local → Banco PROD', () => {
  describe('Validação de Configuração .env.local', () => {
    it('DEVE ter ALLOW_PROD_DB_LOCAL=true para modo emissor', () => {
      const envPath = path.join(__dirname, '../../.env.local');

      if (!fs.existsSync(envPath)) {
        throw new Error('.env.local não encontrado!');
      }

      const content = fs.readFileSync(envPath, 'utf-8');

      // Flag obrigatória para modo emissor local
      expect(content).toContain('ALLOW_PROD_DB_LOCAL=true');
    });

    it('DEVE ter EMISSOR_CPF definido como guard de segurança', () => {
      const envPath = path.join(__dirname, '../../.env.local');
      const content = fs.readFileSync(envPath, 'utf-8');

      // EMISSOR_CPF é obrigatório quando ALLOW_PROD_DB_LOCAL=true
      // Garante que apenas o emissor autorizado acessa o Neon em DEV
      expect(content).toContain('EMISSOR_CPF=53051173991');
    });

    it('NÃO DEVE ter LOCAL_DATABASE_URL apontando para neon.tech', () => {
      const envPath = path.join(__dirname, '../../.env.local');
      const content = fs.readFileSync(envPath, 'utf-8');

      // LOCAL_DATABASE_URL (quando presente) deve ser banco local ou estar ausente
      // A conexão ao Neon em modo emissor usa DATABASE_URL (do .env base)
      const localDbLine = content
        .split('\n')
        .find(
          (line) =>
            line.startsWith('LOCAL_DATABASE_URL=') && !line.startsWith('#')
        );

      if (localDbLine) {
        expect(localDbLine).not.toContain('neon.tech');
      }
      // Se LOCAL_DATABASE_URL não estiver em .env.local, OK — vem do .env base
    });

    it('.env base DEVE ter DATABASE_URL apontando para Neon', () => {
      // DATABASE_URL (Neon) é definido no .env base, não em .env.local
      // lib/db.ts usa DATABASE_URL quando ALLOW_PROD_DB_LOCAL=true
      const envBasePath = path.join(__dirname, '../../.env');

      if (!fs.existsSync(envBasePath)) {
        throw new Error('.env não encontrado!');
      }

      const content = fs.readFileSync(envBasePath, 'utf-8');

      // .env base deve ter DATABASE_URL apontando para Neon
      expect(content).toMatch(/DATABASE_URL=postgresql:\/\/neondb_owner/);
      expect(content).toContain('neon.tech');
    });

    it('DEVE ter configurações Backblaze de PROD', () => {
      const envPath = path.join(__dirname, '../../.env.local');
      const content = fs.readFileSync(envPath, 'utf-8');

      // Backblaze deve estar configurado (aceita com ou sem aspas nos valores)
      expect(content).toMatch(/BACKBLAZE_BUCKET=.?laudos-qwork.?/);
      expect(content).toContain('BACKBLAZE_KEY_ID');
      expect(content).toContain('BACKBLAZE_APPLICATION_KEY');
    });
  });

  describe('Validação de Configuração .env.emissor.local', () => {
    it('DEVE existir arquivo .env.emissor.local', () => {
      const envPath = path.join(__dirname, '../../.env.emissor.local');
      expect(fs.existsSync(envPath)).toBe(true);
    });

    it('DEVE ter configurações de banco Neon', () => {
      const envPath = path.join(__dirname, '../../.env.emissor.local');

      if (!fs.existsSync(envPath)) {
        throw new Error('.env.emissor.local não encontrado!');
      }

      const content = fs.readFileSync(envPath, 'utf-8');

      expect(content).toContain('ALLOW_PROD_DB_LOCAL=true');
      expect(content).toContain('neondb_owner');
      expect(content).toContain('neon.tech');
    });

    it('DEVE ter configurações do emissor', () => {
      const envPath = path.join(__dirname, '../../.env.emissor.local');
      const content = fs.readFileSync(envPath, 'utf-8');

      expect(content).toContain('EMISSOR_CPF=53051173991');
      expect(content).toContain('EMISSOR_EMAIL=emissor@qwork.com.br');
      expect(content).toContain('AUTO_LAUDO_LOCAL_ONLY=true');
    });

    it('DEVE ter configurações Puppeteer', () => {
      const envPath = path.join(__dirname, '../../.env.emissor.local');
      const content = fs.readFileSync(envPath, 'utf-8');

      expect(content).toContain('DEBUG_PUPPETEER');
      expect(content).toContain('PUPPETEER_HEADLESS');
      expect(content).toContain('SKIP_LAUDO_HASH');
    });

    it('DEVE ter configurações Backblaze de PROD', () => {
      const envPath = path.join(__dirname, '../../.env.emissor.local');
      const content = fs.readFileSync(envPath, 'utf-8');

      expect(content).toContain('LAUDOS_STORAGE=s3');
      expect(content).toContain('BACKBLAZE_BUCKET=laudos-qwork');
      expect(content).toContain('BACKBLAZE_ENDPOINT');
    });
  });

  describe('Validação de Lógica lib/db.ts', () => {
    it('DEVE suportar ALLOW_PROD_DB_LOCAL em desenvolvimento', () => {
      const dbPath = path.join(__dirname, '../../lib/db.ts');
      const content = fs.readFileSync(dbPath, 'utf-8');

      // Verificar se há lógica para ALLOW_PROD_DB_LOCAL
      expect(content).toContain('ALLOW_PROD_DB_LOCAL');
      expect(content).toMatch(/ALLOW_PROD_DB_LOCAL.*===.*'true'/);
    });

    it('DEVE ter mensagem de warning ao usar PROD localmente', () => {
      const dbPath = path.join(__dirname, '../../lib/db.ts');
      const content = fs.readFileSync(dbPath, 'utf-8');

      // Deve alertar quando usa banco PROD localmente
      expect(content).toContain('usando DATABASE_URL (produção) localmente');
    });
  });

  describe('Proteção de Segurança', () => {
    it('.env.local DEVE estar no .gitignore', () => {
      const gitignorePath = path.join(__dirname, '../../.gitignore');
      const content = fs.readFileSync(gitignorePath, 'utf-8');

      expect(content).toContain('.env.local');
    });

    it('.env.emissor.local NÃO DEVE ser commitado', () => {
      const gitignorePath = path.join(__dirname, '../../.gitignore');
      const content = fs.readFileSync(gitignorePath, 'utf-8');

      // Deve estar protegido por .env*.local ou .env.emissor.local
      const hasProtection =
        content.includes('.env.emissor.local') ||
        content.includes('.env*.local') ||
        content.includes('.env.*.local');

      expect(hasProtection).toBe(true);
    });

    it('NÃO DEVE ter credenciais hardcoded em arquivos de código', () => {
      const appPath = path.join(__dirname, '../../app');
      const libPath = path.join(__dirname, '../../lib');

      // Verificar alguns arquivos críticos
      const criticalFiles = [
        path.join(__dirname, '../../lib/db.ts'),
        path.join(__dirname, '../../lib/services/asaas-service.ts'),
      ];

      criticalFiles.forEach((filePath) => {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');

          // Não deve ter senhas hardcoded
          expect(content).not.toContain('npg_J2QYqn5oxCzp'); // senha Neon
          expect(content).not.toMatch(/password:.*123456/); // senha local
        }
      });
    });
  });

  describe('Documentação', () => {
    it('DEVE existir documento de correção', () => {
      const docPath = path.join(
        __dirname,
        '../../CORRECAO_EMISSOR_LOCAL_BANCO_PROD.md'
      );
      expect(fs.existsSync(docPath)).toBe(true);
    });

    it('Documento DEVE ter instruções de teste', () => {
      const docPath = path.join(
        __dirname,
        '../../CORRECAO_EMISSOR_LOCAL_BANCO_PROD.md'
      );
      const content = fs.readFileSync(docPath, 'utf-8');

      expect(content).toContain('COMO TESTAR');
      expect(content).toContain('pnpm dev');
      expect(content).toContain('emissor');
    });

    it('Documento DEVE explicar o fluxo', () => {
      const docPath = path.join(
        __dirname,
        '../../CORRECAO_EMISSOR_LOCAL_BANCO_PROD.md'
      );
      const content = fs.readFileSync(docPath, 'utf-8');

      expect(content).toContain('Pagamento');
      expect(content).toContain('Neon');
      expect(content).toContain('Emissor');
    });
  });
});
