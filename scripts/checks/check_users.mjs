import { query } from "./lib/db.ts";

async function checkUsers() {
  try {
    const result = await query(
      "SELECT cpf, nome, perfil, ativo FROM funcionarios ORDER BY cpf"
    );
    console.log("Usuários existentes:");
    result.rows.forEach((user) => {
      console.log(
        `CPF: ${user.cpf}, Nome: ${user.nome}, Perfil: ${user.perfil}, Ativo: ${user.ativo}`
      );
    });
  } catch (error) {
    console.error("Erro:", error);
  }
}

checkUsers();
