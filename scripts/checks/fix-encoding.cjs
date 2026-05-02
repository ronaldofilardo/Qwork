const { Client } = require("pg");

if (
  process.env.NODE_ENV === "test" ||
  process.env.CI === "true" ||
  process.env.CI
) {
  console.log(
    "Skipping script scripts/checks/fix-encoding in test/CI environment to avoid touching development DBs."
  );
  process.exit(0);
}

const client = new Client({
  connectionString: (process.env.LOCAL_DATABASE_URL ?? 'postgresql://postgres@localhost:5432/nr-bps_db'),
});

async function fixEncoding() {
  try {
    await client.connect();

    console.log("🔧 Corrigindo codificação de caracteres nos funcionários...");

    // Buscar funcionários com possíveis problemas de codificação
    const result = await client.query(`
      SELECT id, nome, setor, funcao, email
      FROM funcionarios
      WHERE nome LIKE '%Ã%'
        OR setor LIKE '%Ã%'
        OR funcao LIKE '%Ã%'
        OR nome LIKE '%●%'
        OR nome LIKE '%ª%'
        OR funcao LIKE '%ª%'
    `);

    console.log(
      `Encontrados ${result.rows.length} funcionários com possíveis problemas de codificação`
    );

    for (const func of result.rows) {
      // Corrigir codificação Latin-1 para UTF-8 e caracteres mal renderizados
      const nomeCorrigido = func.nome
        .replace(/Ã©/g, "é")
        .replace(/Ã¡/g, "á")
        .replace(/Ã­/g, "í")
        .replace(/Ã³/g, "ó")
        .replace(/Ãº/g, "ú")
        .replace(/Ã§/g, "ç")
        .replace(/Ã£/g, "ã")
        .replace(/Ãµ/g, "õ")
        .replace(/Ãª/g, "ê")
        .replace(/Ã¢/g, "â")
        .replace(/●/g, "é") // Andr● → André
        .replace(/ª/g, "á"); // Clªudia → Cláudia

      const setorCorrigido = func.setor
        ? func.setor
            .replace(/Ã©/g, "é")
            .replace(/Ã¡/g, "á")
            .replace(/Ã­/g, "í")
            .replace(/Ã³/g, "ó")
            .replace(/Ãº/g, "ú")
            .replace(/Ã§/g, "ç")
            .replace(/Ã£/g, "ã")
            .replace(/Ãµ/g, "õ")
            .replace(/Ãª/g, "ê")
            .replace(/Ã¢/g, "â")
        : func.setor;

      const funcaoCorrigida = func.funcao
        ? func.funcao
            .replace(/Ã©/g, "é")
            .replace(/Ã¡/g, "á")
            .replace(/Ã­/g, "í")
            .replace(/Ã³/g, "ó")
            .replace(/Ãº/g, "ú")
            .replace(/Ã§/g, "ç")
            .replace(/Ã£/g, "ã")
            .replace(/Ãµ/g, "õ")
            .replace(/Ãª/g, "ê")
            .replace(/Ã¢/g, "â")
            .replace(/ª/g, "á") // Secretªria → Secretária
        : func.funcao;

      if (
        nomeCorrigido !== func.nome ||
        setorCorrigido !== func.setor ||
        funcaoCorrigida !== func.funcao
      ) {
        await client.query(
          `
          UPDATE funcionarios
          SET nome = $1, setor = $2, funcao = $3, atualizado_em = CURRENT_TIMESTAMP
          WHERE id = $4
        `,
          [nomeCorrigido, setorCorrigido, funcaoCorrigida, func.id]
        );

        console.log(`✅ Corrigido: ${func.nome} -> ${nomeCorrigido}`);
      }
    }

    console.log("🎉 Correção de codificação concluída!");
    await client.end();
  } catch (err) {
    console.error("Erro:", err);
    process.exit(1);
  }
}

fixEncoding();
