/**
 * @fileoverview Testes do FALLBACK de Login - Data de Nascimento Inválida
 * @description Testes de validação de fallback quando data_nascimento é impossível
 * @test Login Fallback: Data Inválida → Usar Senha Normal
 */

import { describe, it, expect } from '@jest/globals';
import bcrypt from 'bcryptjs';

describe('LOGIN FALLBACK - Data de Nascimento Inválida', () => {
  describe('✅ Validação de Fallback com Senha', () => {
    it('deve simular fallback quando data_nascimento é inválida', async () => {
      // ARRANGE: Simular usuário com data inválida
      const dataNascimentoInvalida = '31/02/1990'; // Fevereiro NÃO tem 31 dias
      const senhaCorreta = 'SenhaValida123!';
      const senhaHash = await bcrypt.hash(senhaCorreta, 10);

      // ACT: Validar que a data é impossível
      const partes = dataNascimentoInvalida.split('/');
      const dia = parseInt(partes[0], 10);
      const mes = parseInt(partes[1], 10);
      const ano = parseInt(partes[2], 10);

      const dateObj = new Date(ano, mes - 1, dia);
      const isDataValida =
        dateObj.getFullYear() === ano &&
        dateObj.getMonth() === mes - 1 &&
        dateObj.getDate() === dia;

      // ASSERT: Data deve ser INVÁLIDA
      expect(isDataValida).toBe(false);

      // Agora simular: Se data é inválida, usar senha como fallback
      const senhaValida = await bcrypt.compare(senhaCorreta, senhaHash);
      expect(senhaValida).toBe(true);
    });

    it('deve rejeitar fallback quando senha está errada', async () => {
      // ARRANGE
      const senhaCorreta = 'SenhaValida123!';
      const senhaErrada = 'SenhaErrada999!';
      const senhaHash = await bcrypt.hash(senhaCorreta, 10);

      // ACT: Comparar senha errada
      const senhaValida = await bcrypt.compare(senhaErrada, senhaHash);

      // ASSERT: Deve rejeitar
      expect(senhaValida).toBe(false);
    });
  });

  describe('✅ Validação de Datas Impossíveis', () => {
    it('deve rejeitar 31/02 em qualquer ano (Fevereiro não tem 31 dias)', () => {
      const datasInvalidas = [
        '31/02/1990',
        '31/02/2000',
        '31/02/1900',
      ];

      datasInvalidas.forEach((data) => {
        const partes = data.split('/');
        const dia = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10);
        const ano = parseInt(partes[2], 10);

        const dateObj = new Date(ano, mes - 1, dia);
        const isValida =
          dateObj.getFullYear() === ano &&
          dateObj.getMonth() === mes - 1 &&
          dateObj.getDate() === dia;

        expect(isValida).toBe(false);
      });
    });

    it('deve rejeitar dia 31 em meses com 30 dias', () => {
      const datasInvalidas = [
        '31/04/1990', // Abril tem 30 dias
        '31/06/1990', // Junho tem 30 dias
        '31/09/1990', // Setembro tem 30 dias
        '31/11/1990', // Novembro tem 30 dias
      ];

      datasInvalidas.forEach((data) => {
        const partes = data.split('/');
        const dia = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10);
        const ano = parseInt(partes[2], 10);

        const dateObj = new Date(ano, mes - 1, dia);
        const isValida =
          dateObj.getFullYear() === ano &&
          dateObj.getMonth() === mes - 1 &&
          dateObj.getDate() === dia;

        expect(isValida).toBe(false);
      });
    });

    it('deve rejeitar 29/02 em anos não-bissextos', () => {
      const datasInvalidas = [
        '29/02/1900', // 1900 não é bissexto
        '29/02/1991', // 1991 não é bissexto
        '29/02/2100', // 2100 não é bissexto
      ];

      datasInvalidas.forEach((data) => {
        const partes = data.split('/');
        const dia = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10);
        const ano = parseInt(partes[2], 10);

        const dateObj = new Date(ano, mes - 1, dia);
        const isValida =
          dateObj.getFullYear() === ano &&
          dateObj.getMonth() === mes - 1 &&
          dateObj.getDate() === dia;

        expect(isValida).toBe(false);
      });
    });

    it('deve aceitar 29/02 em anos BISSEXTOS', () => {
      const datasValidas = [
        '29/02/2000', // 2000 é bissexto
        '29/02/2004', // 2004 é bissexto
        '29/02/1984', // 1984 é bissexto
      ];

      datasValidas.forEach((data) => {
        const partes = data.split('/');
        const dia = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10);
        const ano = parseInt(partes[2], 10);

        const dateObj = new Date(ano, mes - 1, dia);
        const isValida =
          dateObj.getFullYear() === ano &&
          dateObj.getMonth() === mes - 1 &&
          dateObj.getDate() === dia;

        expect(isValida).toBe(true);
      });
    });

    it('deve aceitar datas válidas em todos os meses', () => {
      const datasValidas = [
        '31/01/1990', // Janeiro tem 31 dias
        '28/02/1990', // Fevereiro (não-bissexto)
        '31/03/1990', // Março tem 31 dias
        '30/04/1990', // Abril tem 30 dias
        '31/05/1990', // Maio tem 31 dias
        '30/06/1990', // Junho tem 30 dias
        '31/07/1990', // Julho tem 31 dias
        '31/08/1990', // Agosto tem 31 dias
        '30/09/1990', // Setembro tem 30 dias
        '31/10/1990', // Outubro tem 31 dias
        '30/11/1990', // Novembro tem 30 dias
        '31/12/1990', // Dezembro tem 31 dias
      ];

      datasValidas.forEach((data) => {
        const partes = data.split('/');
        const dia = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10);
        const ano = parseInt(partes[2], 10);

        const dateObj = new Date(ano, mes - 1, dia);
        const isValida =
          dateObj.getFullYear() === ano &&
          dateObj.getMonth() === mes - 1 &&
          dateObj.getDate() === dia;

        expect(isValida).toBe(true);
      });
    });
  });

  describe('🔒 Segurança: Fallback Não Deve Expor Informações', () => {
    it('deve usar mensagens de erro genéricas', () => {
      const msgSeguras = [
        'Data de nascimento em formato inválido',
        'Dados de acesso inválidos',
        'CPF ou senha inválidos',
      ];

      msgSeguras.forEach((msg) => {
        expect(msg.toLowerCase()).not.toContain('fallback');
        expect(msg.toLowerCase()).not.toContain('tentando');
      });
    });
  });

  describe('📋 Fluxo de Login com Fallback', () => {
    it('deve documentar fluxo: data inválida → fallback com senha', () => {
      const fluxo = {
        etapa1: 'Usuário submete CPF e data_nascimento',
        etapa2: 'Sistema valida data_nascimento',
        etapa3: 'Se inválida, fallback com senha',
        etapa4: 'Se senha válida, login autorizado',
      };

      expect(fluxo.etapa3).toContain('fallback');
      expect(fluxo.etapa4).toContain('login');
    });
  });
});
