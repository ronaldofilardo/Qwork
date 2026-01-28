/**
 * Configuração compartilhada para testes RH
 * Define tipos e mocks comuns usados em múltiplos testes
 */

import RhPage from '@/app/rh/page';

// Alias para compatibilidade com referências legadas em testes
export const ClinicaOverviewPage = RhPage;

// Mock session padrão para testes RH
export const mockSession = {
  cpf: '12345678900',
  nome: 'Gestor RH',
  perfil: 'rh' as const,
  clinica_id: 1,
};

// Mock empresas para testes
export const mockEmpresas = [
  {
    id: 1,
    nome: 'Empresa Teste 1',
    cnpj: '12345678000100',
    total_funcionarios: 25,
    total_avaliacoes: 30,
    avaliacoes_concluidas: 20,
    ativa: true,
    representante_nome: 'João',
    representante_fone: '11999999999',
    representante_email: 'joao@teste.com',
  },
  {
    id: 2,
    nome: 'Empresa Teste 2',
    cnpj: '98765432000199',
    total_funcionarios: 18,
    total_avaliacoes: 20,
    avaliacoes_concluidas: 15,
    ativa: true,
    representante_nome: 'Maria',
    representante_fone: '11888888888',
    representante_email: 'maria@teste.com',
  },
];
