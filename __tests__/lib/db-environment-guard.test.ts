/**
 * Testes unitarios para lib/db/environment-guard.ts
 * (validateDbEnvironmentAccess)
 * Modulo puro sem side-effects — sem mocks necessarios.
 */
import { validateDbEnvironmentAccess } from '@/lib/db/environment-guard';

describe('validateDbEnvironmentAccess', () => {
  const cpf = '12345678901';

  describe('ambiente development', () => {
    it('deve permitir quando LOCAL_DATABASE_URL esta configurada', () => {
      process.env.LOCAL_DATABASE_URL = 'postgresql://localhost/nr-bps_db';
      const result = validateDbEnvironmentAccess(cpf, 'development');
      expect(result.allowed).toBe(true);
    });

    it('deve bloquear quando LOCAL_DATABASE_URL esta ausente', () => {
      const original = process.env.LOCAL_DATABASE_URL;
      delete process.env.LOCAL_DATABASE_URL;
      const result = validateDbEnvironmentAccess(cpf, 'development');
      expect(result.allowed).toBe(false);
      expect(result.reason).toMatch(/LOCAL_DATABASE_URL/);
      process.env.LOCAL_DATABASE_URL = original;
    });
  });

  describe('ambiente staging', () => {
    it('deve permitir quando STAGING_DATABASE_URL esta configurada', () => {
      process.env.STAGING_DATABASE_URL = 'postgresql://neon.tech/neondb_staging';
      const result = validateDbEnvironmentAccess(cpf, 'staging');
      expect(result.allowed).toBe(true);
    });

    it('deve bloquear quando STAGING_DATABASE_URL esta ausente', () => {
      const original = process.env.STAGING_DATABASE_URL;
      delete process.env.STAGING_DATABASE_URL;
      const result = validateDbEnvironmentAccess(cpf, 'staging');
      expect(result.allowed).toBe(false);
      expect(result.reason).toMatch(/STAGING_DATABASE_URL/);
      process.env.STAGING_DATABASE_URL = original;
    });
  });

  describe('ambiente production', () => {
    it('deve bloquear quando ALLOWED_PROD_EMISSORES_CPFS esta vazio', () => {
      const original = process.env.ALLOWED_PROD_EMISSORES_CPFS;
      delete process.env.ALLOWED_PROD_EMISSORES_CPFS;
      const result = validateDbEnvironmentAccess(cpf, 'production');
      expect(result.allowed).toBe(false);
      expect(result.reason).toMatch(/ALLOWED_PROD_EMISSORES_CPFS/);
      process.env.ALLOWED_PROD_EMISSORES_CPFS = original;
    });

    it('deve bloquear CPF nao autorizado', () => {
      process.env.ALLOWED_PROD_EMISSORES_CPFS = '99999999999,88888888888';
      const result = validateDbEnvironmentAccess(cpf, 'production');
      expect(result.allowed).toBe(false);
      expect(result.reason).toMatch(/permiss/);
    });

    it('deve permitir CPF autorizado', () => {
      process.env.ALLOWED_PROD_EMISSORES_CPFS = `${cpf},99999999999`;
      process.env.DATABASE_URL = 'postgresql://neon.tech/neondb';
      const result = validateDbEnvironmentAccess(cpf, 'production');
      expect(result.allowed).toBe(true);
    });

    it('deve normalizar CPF com pontuacao (123.456.789-01)', () => {
      const cpfComMascara = '123.456.789-01';
      const cpfLimpo = '12345678901';
      process.env.ALLOWED_PROD_EMISSORES_CPFS = cpfLimpo;
      process.env.DATABASE_URL = 'postgresql://neon.tech/neondb';
      const result = validateDbEnvironmentAccess(cpfComMascara, 'production');
      expect(result.allowed).toBe(true);
    });
  });
});
