// Script removido: este arquivo duplicava a geração de PDF de laudo usando dados do banco.
// Para testes e geração use a API do emissor (`/api/emissor/laudos/:loteId/pdf`) que utiliza
// o template canonical `lib/templates/laudo-html.ts -> gerarHTMLLaudoCompleto()`.

console.log(
  'scripts/checks/test-pdf-completo.cjs: script removido - use fluxo do emissor.'
);

testFullPDFGeneration();
