import React from 'react';
import { render, screen } from '@testing-library/react';
import EmpresasTable from '@/app/rh/components/EmpresasTable';
import FuncionariosTable from '@/components/lote/FuncionariosTable';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/app/rh/components/StatusBadge', () => ({
  __esModule: true,
  default: ({ status }: { status: string }) => <span>{status}</span>,
}));

jest.mock('@/components/lote/FiltroColuna', () => ({
  __esModule: true,
  default: () => <span>Filtro</span>,
}));

describe('Tabelas responsivas principais', () => {
  it('deve renderizar cards mobile para empresas', () => {
    render(
      <EmpresasTable
        empresas={[
          {
            id: 1,
            nome: 'Empresa Teste',
            cnpj: '12.345.678/0001-99',
            elegibilidade: {
              elegivel: true,
              count_elegiveis: 3,
              motivo_bloqueio: null,
            },
            lote_atual: {
              id: 42,
              status: 'liberado',
            },
            lote_anterior: null,
            laudos_status: {
              aguardando_emissao: 1,
              aguardando_pagamento: 0,
              pago: 0,
              laudo_emitido: 0,
            },
          },
        ]}
        selecionadas={new Set<number>()}
        onToggle={jest.fn()}
        onToggleAll={jest.fn()}
        onEditEmpresa={jest.fn()}
      />
    );

    expect(screen.getByText('Empresa / CNPJ')).toBeInTheDocument();
    expect(screen.getByText('Lote atual')).toBeInTheDocument();
  });

  it('deve renderizar cards mobile para funcionários do lote', () => {
    render(
      <FuncionariosTable
        variant="entidade"
        funcionariosFiltrados={
          [
            {
              nome: 'Maria da Silva',
              cpf: '123.456.789-00',
              nivel_cargo: 'operacional',
              avaliacao: {
                id: 10,
                status: 'iniciada',
                total_respostas: 5,
                data_conclusao: null,
                motivo_inativacao: null,
                inativada_em: null,
              },
            },
          ] as never
        }
        funcionariosTotal={1}
        lote={null}
        busca=""
        filtroStatus="todos"
        filtrosColuna={{ nome: [], cpf: [], nivel_cargo: [], status: [] }}
        setFiltrosColuna={jest.fn()}
        getValoresUnicos={jest.fn(() => [])}
        toggleFiltroColuna={jest.fn()}
        onInativar={jest.fn()}
        onResetar={jest.fn()}
      />
    );

    expect(screen.getByText('Funcionário')).toBeInTheDocument();
    expect(screen.getByText('Data de conclusão')).toBeInTheDocument();
  });
});
