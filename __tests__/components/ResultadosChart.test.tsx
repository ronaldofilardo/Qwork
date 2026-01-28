import { render, screen } from "@testing-library/react";
import ResultadosChart from "@/components/ResultadosChart";
import * as ReactChartjs2 from 'react-chartjs-2';

// Mock do Bar para capturar props
let lastBarProps: any = null;
jest.spyOn(ReactChartjs2, 'Bar').mockImplementation((props: any) => {
  lastBarProps = props;
  return <div data-testid="mock-chart">Mock Chart</div>;
});

// Mock dos dados de teste
const mockResultados = [
  {
    grupo: 1,
    dominio: 'Demandas do Trabalho',
    score: 75,
    categoria: "medio" as "baixo" | "medio" | "alto",
    tipo: "positiva" as "positiva" | "negativa",
  },
  {
    grupo: 2,
    dominio: 'Controle sobre o Trabalho',
    score: 45,
    categoria: "alto" as "baixo" | "medio" | "alto",
    tipo: "negativa" as "positiva" | "negativa",
  },
  {
    grupo: 3,
    dominio: 'Apoio Social',
    score: 60,
    categoria: "baixo" as "baixo" | "medio" | "alto",
    tipo: "positiva" as "positiva" | "negativa",
  },
];

describe("ResultadosChart", () => {
  it("deve renderizar o componente Chart", () => {
    render(<ResultadosChart resultados={mockResultados} />);
    // Verifica se o mock do chart está sendo renderizado
    const mockChart = screen.getByTestId("mock-chart");
    expect(mockChart).toBeInTheDocument();
  });

  it("deve renderizar mensagem amigável com dados vazios", () => {
    render(<ResultadosChart resultados={[]} />);
    expect(screen.getByText(/nenhum dado disponível/i)).toBeInTheDocument();
  });

  it("deve exibir barra cinza clara para score zero", () => {
    const mockComZero = [
      ...mockResultados,
      {
        grupo: 4,
        dominio: 'Jogos de Apostas',
        score: 0,
        categoria: "baixo" as "baixo" | "medio" | "alto",
        tipo: "negativa" as "positiva" | "negativa",
      },
    ];
    render(<ResultadosChart resultados={mockComZero} />);
    // O último grupo (score zero) deve ter cor de barra cinza clara
    const barColors = lastBarProps.data.datasets[0].backgroundColor;
    expect(barColors[barColors.length - 1]).toBe('#E5E7EB');
  });
});