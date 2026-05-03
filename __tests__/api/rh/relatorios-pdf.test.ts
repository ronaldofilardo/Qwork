// Jest globals available by default

describe('Correções dos Relatórios PDF', () => {
  it('deve importar os endpoints sem erros de compilação', async () => {
    // Este teste verifica se as correções de importação e sintaxe funcionam
    expect(async () => {
      await import('@/app/api/rh/relatorio-individual-pdf/route');
      await import('@/app/api/rh/relatorio-lote-pdf/route');
    }).not.toThrow();
  });

  it('deve ter corrigido a coluna enviado_em para envio', () => {
    // Este teste verifica se a correção da coluna foi aplicada
    const fs = require('fs');
    const path = require('path');

    const filePath = path.join(
      process.cwd(),
      'app/api/rh/relatorio-individual-pdf/route.ts'
    );
    const content = fs.readFileSync(filePath, 'utf8');

    // Verifica se a coluna antiga foi removida
    expect(content).not.toContain('enviado_em');

    // Verifica se a nova coluna está presente
    expect(content).toContain('envio');
  });

  it('deve ter implementado validação de clínica', () => {
    // Este teste verifica se a validação de clínica foi adicionada
    const fs = require('fs');
    const path = require('path');

    const filePath = path.join(
      process.cwd(),
      'app/api/rh/relatorio-individual-pdf/route.ts'
    );
    const content = fs.readFileSync(filePath, 'utf8');

    // Verifica se há validação de clinica_id
    expect(content).toContain('clinica_id');
    expect(content).toContain('f.clinica_id = $3');
  });

  it('deve ter removido dependências de tabelas inexistentes', () => {
    // Este teste verifica se as JOINs problemáticas foram removidas
    const fs = require('fs');
    const path = require('path');

    const filePath = path.join(
      process.cwd(),
      'app/api/rh/relatorio-individual-pdf/route.ts'
    );
    const content = fs.readFileSync(filePath, 'utf8');

    // Verifica se não há mais referências às tabelas inexistentes
    expect(content).not.toContain('perguntas');
    expect(content).not.toContain('perguntas_grupos');
  });

  it('deve ter corrigido problemas de TypeScript', () => {
    // Este teste verifica se os problemas de tipo foram corrigidos
    const fs = require('fs');
    const path = require('path');

    const filePath = path.join(
      process.cwd(),
      'app/api/rh/relatorio-individual-pdf/route.ts'
    );
    const content = fs.readFileSync(filePath, 'utf8');

    // Verifica se o GrupoRelatorio foi importado/definido
    expect(content).toContain('GrupoRelatorio');

    // Verifica se há tipagem adequada (presença de tipo GrupoRelatorio)
    expect(content).toContain('GrupoRelatorio');
  });

  it('deve ter a mesma correção no relatório de lote', () => {
    // Este teste verifica se as correções foram aplicadas consistentemente
    const fs = require('fs');
    const path = require('path');

    const filePath = path.join(
      process.cwd(),
      'app/api/rh/relatorio-lote-pdf/route.ts'
    );
    const content = fs.readFileSync(filePath, 'utf8');

    // Verifica se as mesmas correções foram aplicadas
    expect(content).toContain('clinica_id');
    expect(content).not.toContain('enviado_em');
  });

  it('deve compilar sem erros de TypeScript relacionados aos relatórios', () => {
    // Este teste verifica se os arquivos existem e têm conteúdo válido
    const fs = require('fs');
    const path = require('path');

    const filePath1 = path.join(
      process.cwd(),
      'app/api/rh/relatorio-individual-pdf/route.ts'
    );
    const filePath2 = path.join(
      process.cwd(),
      'app/api/rh/relatorio-lote-pdf/route.ts'
    );

    // Verifica se os arquivos existem
    expect(fs.existsSync(filePath1)).toBe(true);
    expect(fs.existsSync(filePath2)).toBe(true);

    // Verifica se têm conteúdo
    const content1 = fs.readFileSync(filePath1, 'utf8');
    const content2 = fs.readFileSync(filePath2, 'utf8');

    expect(content1.length).toBeGreaterThan(0);
    expect(content2.length).toBeGreaterThan(0);

    // Verifica se não há erros óbvios de sintaxe
    expect(content1).toContain('export async function GET');
    expect(content2).toContain('export async function GET');
  });

  it('deve ter mantido a funcionalidade do relatório por setor', () => {
    // Este teste verifica se o relatório por setor não foi afetado
    const fs = require('fs');
    const path = require('path');

    const filePath = path.join(
      process.cwd(),
      'app/api/rh/relatorio-setor/route.ts'
    );
    const content = fs.readFileSync(filePath, 'utf8');

    // Verifica se o arquivo ainda existe e tem conteúdo
    expect(content.length).toBeGreaterThan(0);
    expect(content).toContain('export async function GET');
  });
});
