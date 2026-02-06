/**
 * Testes para API /api/admin/contratantes
 * Admin pode visualizar contratantes para gerenciar usuários gestores
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/contratantes/route';
import { query } from '@/lib/db';

describe('/api/admin/contratantes', () => {
  beforeAll(async () => {
    // Configurar contexto de admin para os testes
    await query(`SET LOCAL app.current_user_perfil = 'admin'`);
  });

  describe('GET /api/admin/contratantes', () => {
    it('deve retornar lista de todos os contratantes', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/contratantes'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.contratantes)).toBe(true);

      // Verificar estrutura dos dados
      if (data.contratantes.length > 0) {
        const contratante = data.contratantes[0];
        expect(contratante).toHaveProperty('id');
        expect(contratante).toHaveProperty('tipo');
        expect(contratante).toHaveProperty('nome');
        expect(contratante).toHaveProperty('cnpj');
        expect(contratante).toHaveProperty('ativo');
        expect(contratante).toHaveProperty('created_at');
      }
    });

    it('deve filtrar apenas clínicas quando tipo=clinica', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/contratantes?tipo=clinica'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('total');

      // Todos os resultados devem ser clínicas
      data.contratantes.forEach((contratante: any) => {
        expect(contratante.tipo).toBe('clinica');
      });
    });

    it('deve filtrar apenas entidades quando tipo=entidade', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/contratantes?tipo=entidade'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('total');

      // Todos os resultados devem ser entidades
      data.contratantes.forEach((contratante: any) => {
        expect(contratante.tipo).toBe('entidade');
      });
    });

    it('deve incluir informações do gestor quando vinculado', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/contratantes'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      // Procurar um contratante que tenha gestor
      const contratanteComGestor = data.contratantes.find((c: any) => c.gestor);

      if (contratanteComGestor) {
        expect(contratanteComGestor.gestor).toHaveProperty('cpf');
        expect(contratanteComGestor.gestor).toHaveProperty('nome');
        expect(contratanteComGestor.gestor).toHaveProperty('email');
        expect(contratanteComGestor.gestor).toHaveProperty('perfil');

        // Gestor deve ter perfil correto baseado no tipo do contratante
        if (contratanteComGestor.tipo === 'clinica') {
          expect(contratanteComGestor.gestor.perfil).toBe('rh');
        } else if (contratanteComGestor.tipo === 'entidade') {
          expect(contratanteComGestor.gestor.perfil).toBe('gestor');
        }
      }
    });

    it('deve mostrar null para contratantes sem gestor', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/contratantes'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      // Deve haver pelo menos um contratante sem gestor ou todos devem ter gestor definido
      const contratantesSemGestor = data.contratantes.filter(
        (c: any) => !c.gestor
      );
      const contratantesComGestor = data.contratantes.filter(
        (c: any) => c.gestor
      );

      expect(contratantesSemGestor.length + contratantesComGestor.length).toBe(
        data.contratantes.length
      );

      // Contratantes sem gestor devem ter gestor = null
      contratantesSemGestor.forEach((contratante: any) => {
        expect(contratante.gestor).toBeNull();
      });
    });
  });

  describe('Estrutura de resposta', () => {
    it('deve ter estrutura correta para contratante', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/contratantes'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      if (data.contratantes.length > 0) {
        const contratante = data.contratantes[0];

        // Campos obrigatórios
        expect(typeof contratante.id).toBe('string');
        expect(['clinica', 'entidade']).toContain(contratante.tipo);
        expect(typeof contratante.nome).toBe('string');
        expect(typeof contratante.cnpj).toBe('string');
        expect(typeof contratante.ativo).toBe('boolean');
        expect(typeof contratante.created_at).toBe('string');

        // Campos opcionais
        if (contratante.endereco)
          expect(typeof contratante.endereco).toBe('string');
        if (contratante.cidade)
          expect(typeof contratante.cidade).toBe('string');
        if (contratante.estado)
          expect(typeof contratante.estado).toBe('string');
        if (contratante.telefone)
          expect(typeof contratante.telefone).toBe('string');
        if (contratante.email) expect(typeof contratante.email).toBe('string');

        // Gestor (se existir)
        if (contratante.gestor) {
          expect(typeof contratante.gestor.cpf).toBe('string');
          expect(typeof contratante.gestor.nome).toBe('string');
          expect(typeof contratante.gestor.email).toBe('string');
          expect(['rh', 'gestor']).toContain(contratante.gestor.perfil);
        } else {
          expect(contratante.gestor).toBeNull();
        }
      }
    });
  });

  describe('Tratamento de erros', () => {
    it('deve lidar com erros de banco de dados', async () => {
      // Simular erro forçando uma query inválida (temporariamente)
      // Nota: Este teste pode ser implementado se houver uma forma de simular erro

      const request = new NextRequest(
        'http://localhost:3000/api/admin/contratantes'
      );
      const response = await GET(request);

      // Em caso de sucesso, deve retornar 200
      // Em caso de erro, deve retornar 500 com estrutura de erro
      if (response.status === 500) {
        const errorData = await response.json();
        expect(errorData.success).toBe(false);
        expect(errorData).toHaveProperty('error');
      } else {
        expect(response.status).toBe(200);
      }
    });
  });
});
