import { requireRole } from "@/lib/session";
import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import {
  gerarDadosGeraisEmpresa,
  calcularScoresPorGrupo,
  gerarInterpretacaoRecomendacoes,
  gerarObservacoesConclusao,
} from "@/lib/laudo-calculos";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { loteId: string } }
) {
  try {
    const session = await requireRole("emissor");
    const loteId = parseInt(params.loteId);

    if (isNaN(loteId)) {
      return NextResponse.json(
        { error: "ID de lote inválido" },
        { status: 400 }
      );
    }

    // Verificar se lote existe e buscar dados
    const loteResult = await query(
      `
      SELECT 
        l.id,
        l.codigo,
        l.titulo,
        l.liberado_em,
        l.empresa_id,
        e.nome as empresa_nome,
        e.cnpj as empresa_cnpj,
        e.endereco as empresa_endereco,
        l.clinica_id,
        c.nome as clinica_nome,
        c.endereco as clinica_endereco,
        c.telefone as clinica_telefone,
        c.email as clinica_email
      FROM lotes_avaliacao l
      JOIN empresas_clientes e ON l.empresa_id = e.id
      JOIN clinicas c ON l.clinica_id = c.id
      WHERE l.id = $1 AND l.clinica_id = (SELECT clinica_id FROM funcionarios WHERE cpf = $2)
    `,
      [loteId, session.cpf]
    );

    if (loteResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Lote não encontrado" },
        { status: 404 }
      );
    }

    const lote = loteResult.rows[0];

    // Verificar se há laudo associado
    const laudoResult = await query(
      "SELECT id, status FROM laudos WHERE lote_id = $1",
      [loteId]
    );

    if (
      laudoResult.rows.length === 0 ||
      laudoResult.rows[0].status !== "enviado"
    ) {
      return NextResponse.json(
        {
          error: "Laudo não encontrado ou não foi enviado ainda",
        },
        { status: 404 }
      );
    }

    // Gerar dados das etapas
    const etapa1 = await gerarDadosGeraisEmpresa(loteId);
    const etapa2 = await calcularScoresPorGrupo(loteId);
    const etapa3 = gerarInterpretacaoRecomendacoes(lote.empresa_nome, etapa2);
    const etapa4 = gerarObservacoesConclusao();

    const laudoData = {
      etapa1: {
        clinicaNome: lote.clinica_nome,
        clinicaEndereco: lote.clinica_endereco,
        clinicaTelefone: lote.clinica_telefone,
        clinicaEmail: lote.clinica_email,
        empresaAvaliada: lote.empresa_nome,
        empresaCnpj: lote.empresa_cnpj,
        empresaEndereco: lote.empresa_endereco,
        setorAvaliado: "Geral",
        responsavelTecnico: session.nome || "Coordenador Responsável Técnico",
        registroProfissional: "CRP/CRM XXXXX",
        dataAvaliacao: lote.liberado_em,
        totalFuncionarios: etapa1.totalFuncionariosAvaliados,
        gestao: etapa1.amostra.gestao,
        operacional: etapa1.amostra.operacional,
      },
      etapa2: etapa2.map((grupo) => ({
        grupoId: grupo.grupo,
        grupoTitulo: grupo.dominio,
        dominio: grupo.descricao,
        mediaNumerica: grupo.media,
        classificacao:
          grupo.categoriaRisco === "baixo"
            ? "Excelente (Baixo Risco)"
            : grupo.categoriaRisco === "medio"
            ? "Monitorar (Médio Risco)"
            : "Atenção (Alto Risco)",
        corClassificacao:
          grupo.classificacaoSemaforo === "verde"
            ? "#10b981"
            : grupo.classificacaoSemaforo === "amarelo"
            ? "#f59e0b"
            : "#ef4444",
      })),
      etapa3: [
        ...(etapa3.gruposExcelente || []).map((g: any) => ({
          grupoId: g.grupo,
          grupoTitulo: g.dominio,
          interpretacao:
            "Os resultados indicam um baixo risco psicossocial, com condições organizacionais favoráveis ao bem-estar dos trabalhadores.",
          recomendacoes: [
            "Manter as boas práticas atuais",
            "Comunicação aberta entre equipes e gestores",
            "Políticas de reconhecimento e valorização profissional",
            "Programas de qualidade de vida",
          ],
        })),
        ...(etapa3.gruposMonitoramento || []).map((g: any) => ({
          grupoId: g.grupo,
          grupoTitulo: g.dominio,
          interpretacao:
            "Nível moderado de risco psicossocial identificado, requerendo atenção preventiva.",
          recomendacoes: [
            "Reuniões de alinhamento sobre papéis e responsabilidades",
            "Adequação das cargas e jornadas de trabalho",
            "Programas de apoio psicológico ou rodas de conversa",
            "Monitoramento contínuo",
          ],
        })),
        ...(etapa3.gruposAltoRisco || []).map((g: any) => ({
          grupoId: g.grupo,
          grupoTitulo: g.dominio,
          interpretacao:
            "Alto risco psicossocial detectado, demandando intervenções imediatas e estruturadas.",
          recomendacoes: [
            "Intervenção imediata com apoio especializado",
            "Revisão das demandas e processos de trabalho",
            "Programas de suporte psicológico intensivo",
            "Avaliações de acompanhamento periódicas",
            "Ações preventivas estruturadas",
          ],
        })),
      ],
      etapa4: {
        observacoes: etapa4.observacoesLaudo || "Sem observações adicionais.",
        conclusao: etapa4.textoConclusao,
        dataEmissao: new Date().toISOString(),
      },
    };

    return NextResponse.json(laudoData, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar dados do laudo:", error);
    return NextResponse.json(
      {
        error: "Erro ao buscar dados do laudo",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
