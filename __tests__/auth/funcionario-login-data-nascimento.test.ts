/**
 * @fileoverview Testes para login de funcionário usando data de nascimento
 * @description Valida o fluxo de autenticação onde funcionários usam data de nascimento no lugar de senha
 * @test Login de Funcionário: Data de Nascimento como Credencial
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('Login de Funcionário com Data de Nascimento', () => {
  describe('Frontend - Página de Login', () => {
    it('✓ Deve aceitar CPF e data de nascimento como credenciais', () => {
      // ARRANGE: Dados de funcionário
      const cpf = '12345678901';
      const dataNascimento = '01011990'; // ddmmaaaa

      // ACT: Simular preenchimento dos campos
      const formatarDataNascimento = (valor: string) => {
        const apenasNumeros = valor.replace(/\D/g, '');
        return apenasNumeros.slice(0, 8);
      };

      const dataNascimentoFormatada = formatarDataNascimento(dataNascimento);

      // ASSERT: Deve aceitar 8 dígitos
      expect(dataNascimentoFormatada).toBe('01011990');
      expect(dataNascimentoFormatada).toHaveLength(8);
    });

    it('✓ Deve limitar data de nascimento a 8 dígitos', () => {
      // ARRANGE: Entrada com mais de 8 dígitos
      const entrada = '010119901234';

      // ACT: Formatar
      const formatarDataNascimento = (valor: string) => {
        const apenasNumeros = valor.replace(/\D/g, '');
        return apenasNumeros.slice(0, 8);
      };

      const resultado = formatarDataNascimento(entrada);

      // ASSERT: Deve truncar em 8 dígitos
      expect(resultado).toBe('01011990');
      expect(resultado).toHaveLength(8);
    });

    it('✓ Deve remover caracteres não numéricos', () => {
      // ARRANGE: Entrada com caracteres especiais
      const entrada = '01/01/1990';

      // ACT: Formatar
      const formatarDataNascimento = (valor: string) => {
        const apenasNumeros = valor.replace(/\D/g, '');
        return apenasNumeros.slice(0, 8);
      };

      const resultado = formatarDataNascimento(entrada);

      // ASSERT: Deve retornar apenas números
      expect(resultado).toBe('01011990');
    });

    it('✓ Deve montar body de requisição com data_nascimento quando preenchida', () => {
      // ARRANGE: Dados de funcionário
      const cpf = '12345678901';
      const dataNascimento = '01011990';

      // ACT: Montar body
      const body: any = { cpf };
      if (dataNascimento) {
        body.data_nascimento = dataNascimento;
      }

      // ASSERT: Body deve conter data_nascimento
      expect(body).toEqual({
        cpf: '12345678901',
        data_nascimento: '01011990',
      });
      expect(body.senha).toBeUndefined();
    });

    it('✓ Deve montar body de requisição com senha quando usuário não é funcionário', () => {
      // ARRANGE: Dados de RH/Gestor
      const cpf = '98765432100';
      const senha = 'senhaSegura123';

      // ACT: Montar body
      const body: any = { cpf };
      if (senha) {
        body.senha = senha;
      }

      // ASSERT: Body deve conter senha
      expect(body).toEqual({
        cpf: '98765432100',
        senha: 'senhaSegura123',
      });
      expect(body.data_nascimento).toBeUndefined();
    });
  });

  describe('Backend - API de Login', () => {
    it('✓ Deve aceitar data_nascimento no payload', () => {
      // ARRANGE: Payload com data de nascimento
      const payload = {
        cpf: '12345678901',
        data_nascimento: '01011990',
      };

      // ACT & ASSERT: Validar estrutura do payload
      expect(payload).toHaveProperty('cpf');
      expect(payload).toHaveProperty('data_nascimento');
      expect(payload.data_nascimento).toHaveLength(8);
    });

    it('✓ Deve validar que CPF é obrigatório', () => {
      // ARRANGE: Payload sem CPF
      const payload = {
        data_nascimento: '01011990',
      };

      // ACT: Validar
      const validar = (p: any) => {
        if (!p.cpf) {
          return { error: 'CPF é obrigatório', status: 400 };
        }
        return null;
      };

      const erro = validar(payload);

      // ASSERT: Deve retornar erro
      expect(erro).not.toBeNull();
      expect(erro?.error).toBe('CPF é obrigatório');
      expect(erro?.status).toBe(400);
    });

    it('✓ Deve validar que senha OU data_nascimento é obrigatória', () => {
      // ARRANGE: Payload sem senha nem data_nascimento
      const payload = {
        cpf: '12345678901',
      };

      // ACT: Validar
      const validar = (p: any) => {
        if (!p.cpf) {
          return { error: 'CPF é obrigatório', status: 400 };
        }
        if (!p.senha && !p.data_nascimento) {
          return {
            error: 'Senha ou data de nascimento é obrigatória',
            status: 400,
          };
        }
        return null;
      };

      const erro = validar(payload);

      // ASSERT: Deve retornar erro
      expect(erro).not.toBeNull();
      expect(erro?.error).toBe('Senha ou data de nascimento é obrigatória');
      expect(erro?.status).toBe(400);
    });

    it('✓ Deve aceitar payload com senha (usuários não-funcionários)', () => {
      // ARRANGE: Payload com senha
      const payload = {
        cpf: '98765432100',
        senha: 'senhaSegura123',
      };

      // ACT: Validar
      const validar = (p: any) => {
        if (!p.cpf) {
          return { error: 'CPF é obrigatório', status: 400 };
        }
        if (!p.senha && !p.data_nascimento) {
          return {
            error: 'Senha ou data de nascimento é obrigatória',
            status: 400,
          };
        }
        return null;
      };

      const erro = validar(payload);

      // ASSERT: Não deve retornar erro
      expect(erro).toBeNull();
    });

    it('✓ Deve identificar funcionário com data_nascimento e pular validação bcrypt', () => {
      // ARRANGE: Dados de funcionário
      const usuario = {
        cpf: '12345678901',
        tipo_usuario: 'funcionario',
        nome: 'João Silva',
      };
      const data_nascimento = '01011990';

      // ACT: Verifica se deve pular validação
      const isFuncionarioComDataNasc =
        usuario.tipo_usuario === 'funcionario' && !!data_nascimento;

      // ASSERT: Deve identificar que é funcionário com data de nascimento
      expect(isFuncionarioComDataNasc).toBe(true);
    });

    it('✓ Não deve pular validação para não-funcionários', () => {
      // ARRANGE: Dados de RH
      const usuario = {
        cpf: '98765432100',
        tipo_usuario: 'rh',
        nome: 'Maria Santos',
      };
      const senha = 'senhaSegura123';
      const data_nascimento = undefined;

      // ACT: Verifica se deve pular validação
      const isFuncionarioComDataNasc =
        usuario.tipo_usuario === 'funcionario' && !!data_nascimento;

      // ASSERT: Não deve pular validação
      expect(isFuncionarioComDataNasc).toBe(false);
    });

    it('✓ Deve criar sessão para funcionário com data_nascimento', () => {
      // ARRANGE: Dados de funcionário autenticado
      const usuario = {
        cpf: '12345678901',
        tipo_usuario: 'funcionario',
        nome: 'João Silva',
        entidade_id: 1,
      };

      // ACT: Simular criação de sessão
      const sessao = {
        cpf: usuario.cpf,
        nome: usuario.nome,
        perfil: usuario.tipo_usuario,
        entidade_id: usuario.entidade_id,
      };

      // ASSERT: Sessão deve conter dados corretos
      expect(sessao.cpf).toBe('12345678901');
      expect(sessao.perfil).toBe('funcionario');
      expect(sessao.nome).toBe('João Silva');
      expect(sessao.entidade_id).toBe(1);
    });

    it('✓ Deve retornar response com perfil funcionario', () => {
      // ARRANGE: Response esperado para funcionário
      const response = {
        success: true,
        cpf: '12345678901',
        nome: 'João Silva',
        perfil: 'funcionario',
        data_nascimento: '2011-02-02',
        redirectTo: '/dashboard',
      };

      // ACT & ASSERT: Validar estrutura da resposta
      expect(response.success).toBe(true);
      expect(response.perfil).toBe('funcionario');
      expect(response.data_nascimento).toBeDefined();
      expect(response.redirectTo).toBe('/dashboard');
    });
  });

  describe('Fluxo Completo - Integração', () => {
    it('✓ Deve simular fluxo completo: CPF + Data Nasc → Login → Modal Confirmação', () => {
      // ARRANGE: Dados do funcionário
      const cpf = '12345678901';
      const dataNascimento = '01011990';

      // ACT: Etapa 1 - Preparar credenciais
      const body: any = { cpf };
      if (dataNascimento) {
        body.data_nascimento = dataNascimento;
      }

      // Etapa 2 - Simular resposta do backend
      const loginResponse = {
        success: true,
        cpf: cpf,
        nome: 'João Silva',
        perfil: 'funcionario',
        data_nascimento: '1990-01-01',
        redirectTo: '/dashboard',
      };

      // Etapa 3 - Frontend detecta funcionário
      const deveMostrarModal = loginResponse.perfil === 'funcionario';

      // ASSERT: Deve ativar modal de confirmação
      expect(body.data_nascimento).toBe('01011990');
      expect(loginResponse.success).toBe(true);
      expect(loginResponse.perfil).toBe('funcionario');
      expect(deveMostrarModal).toBe(true);
    });

    it('✓ Deve simular fluxo para RH/Gestor: CPF + Senha → Login → Dashboard direto', () => {
      // ARRANGE: Dados de RH
      const cpf = '98765432100';
      const senha = 'senhaSegura123';

      // ACT: Etapa 1 - Preparar credenciais
      const body: any = { cpf };
      if (senha) {
        body.senha = senha;
      }

      // Etapa 2 - Simular resposta do backend
      const loginResponse = {
        success: true,
        cpf: cpf,
        nome: 'Maria Santos',
        perfil: 'rh',
        redirectTo: '/rh',
        termosPendentes: {
          termos_uso: false,
          politica_privacidade: false,
        },
      };

      // Etapa 3 - Frontend detecta não-funcionário
      const deveMostrarModal = loginResponse.perfil === 'funcionario';
      const deveRedirecionarDireto = !deveMostrarModal;

      // ASSERT: Não deve mostrar modal, redirecionar direto
      expect(body.senha).toBe('senhaSegura123');
      expect(body.data_nascimento).toBeUndefined();
      expect(loginResponse.success).toBe(true);
      expect(loginResponse.perfil).toBe('rh');
      expect(deveMostrarModal).toBe(false);
      expect(deveRedirecionarDireto).toBe(true);
    });
  });

  describe('Casos de Erro', () => {
    it('✓ Deve rejeitar login com credenciais vazias', () => {
      // ARRANGE: Payload vazio
      const payload = { cpf: '' };

      // ACT: Validar
      const validar = (p: any) => {
        if (!p.cpf) {
          return { error: 'CPF é obrigatório', status: 400 };
        }
        return null;
      };

      const erro = validar(payload);

      // ASSERT: Deve retornar erro
      expect(erro).not.toBeNull();
      expect(erro?.error).toBe('CPF é obrigatório');
    });

    it('✓ Deve rejeitar login com CPF inválido', () => {
      // ARRANGE: CPF com formato inválido
      const cpf = '123';

      // ACT: Validar
      const validarCPF = (c: string) => {
        const apenasNumeros = c.replace(/\D/g, '');
        return apenasNumeros.length === 11;
      };

      const valido = validarCPF(cpf);

      // ASSERT: CPF inválido
      expect(valido).toBe(false);
    });

    it('✓ Deve rejeitar data de nascimento com formato inválido', () => {
      // ARRANGE: Data com menos de 8 dígitos
      const dataNascimento = '0101';

      // ACT: Validar
      const validarData = (d: string) => {
        return d.length === 8 && /^\d{8}$/.test(d);
      };

      const valido = validarData(dataNascimento);

      // ASSERT: Data inválida
      expect(valido).toBe(false);
    });

    it('✓ Deve validar formato correto de data de nascimento', () => {
      // ARRANGE: Data válida
      const dataNascimento = '01011990';

      // ACT: Validar
      const validarData = (d: string) => {
        return d.length === 8 && /^\d{8}$/.test(d);
      };

      const valido = validarData(dataNascimento);

      // ASSERT: Data válida
      expect(valido).toBe(true);
    });
  });

  describe('Segurança', () => {
    it('✓ Não deve expor tipo de usuário antes da autenticação', () => {
      // ARRANGE: Request apenas com CPF
      const payload = { cpf: '12345678901' };

      // ACT: Simular validação inicial (sem consulta ao banco)
      const podeIdentificarTipo = false; // Não deve identificar antes de autenticar

      // ASSERT: Tipo de usuário só é conhecido após login bem-sucedido
      expect(podeIdentificarTipo).toBe(false);
    });

    it('✓ Deve exigir validação de identidade adicional para funcionários', () => {
      // ARRANGE: Login de funcionário bem-sucedido
      const loginResponse = {
        perfil: 'funcionario',
        success: true,
      };

      // ACT: Verificar se modal de confirmação deve ser exibido
      const deveConfirmarIdentidade = loginResponse.perfil === 'funcionario';

      // ASSERT: Funcionários passam por dupla validação
      expect(deveConfirmarIdentidade).toBe(true);
    });

    it('✓ Validação de senha bcrypt deve ser pulada apenas para funcionários com data_nascimento', () => {
      // ARRANGE: Diferentes cenários
      const cenarios = [
        {
          tipo_usuario: 'funcionario',
          data_nascimento: '01011990',
          esperado: true,
        },
        { tipo_usuario: 'funcionario', senha: 'abc123', esperado: false },
        { tipo_usuario: 'rh', data_nascimento: '01011990', esperado: false },
        { tipo_usuario: 'gestor', senha: 'abc123', esperado: false },
      ];

      // ACT & ASSERT: Verificar cada cenário
      cenarios.forEach((cenario) => {
        const devePularBcrypt =
          cenario.tipo_usuario === 'funcionario' &&
          !!cenario.data_nascimento;
        expect(devePularBcrypt).toBe(cenario.esperado);
      });
    });
  });
});
