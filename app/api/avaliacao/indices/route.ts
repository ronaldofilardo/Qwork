import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = getSession();
    if (!session || session.perfil !== "funcionario") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    // Para funcionários, retornar apenas o próprio índice
    const result = await query(
      `SELECT cpf, nome, indice_avaliacao, data_ultimo_lote
       FROM funcionarios
       WHERE cpf = $1`,
      [session.cpf]
    );

    return NextResponse.json({
      indices: result.rows,
    });
  } catch (error) {
    console.error("Erro ao buscar índices:", error);
    return NextResponse.json(
      { error: "Erro ao buscar índices" },
      { status: 500 }
    );
  }
}
