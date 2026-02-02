/**
 * Teste de Integração: Fix Vercel Chromium - Client-side PDF Generation
 * Valida toda a cadeia de fallback: download → HTML → client-side
 * Referência: ANALYSIS-VERCEL-PDF-ISSUE.md e IMPLEMENTATION-CLIENT-SIDE-PDF.md
 */

import fs from 'fs';
import path from 'path';

describe('Integração: Fix Vercel Chromium - Fallback Client-side', () => {
  // ============================================================================
  // TESTE: Validar arquitetura completa
  // ============================================================================
  describe('Arquitetura: Endpoints e componentes existem', () => {
    it('deve existir endpoint /download com fallback client-side', () => {
      const downloadRoute = path.join(
        process.cwd(),
        'app/api/emissor/laudos/[loteId]/download/route.ts'
      );
      expect(fs.existsSync(downloadRoute)).toBe(true);

      const content = fs.readFileSync(downloadRoute, 'utf-8');
      expect(content).toContain('useClientSide');
      expect(content).toContain('htmlEndpoint');
    });

    it('deve existir endpoint /html para servir HTML do laudo', () => {
      const htmlRoute = path.join(
        process.cwd(),
        'app/api/emissor/laudos/[loteId]/html/route.ts'
      );
      expect(fs.existsSync(htmlRoute)).toBe(true);

      const content = fs.readFileSync(htmlRoute, 'utf-8');
      expect(content).toContain('gerarHTMLLaudoCompleto');
    });

    it('deve existir endpoint /pdf para emergências', () => {
      const pdfRoute = path.join(
        process.cwd(),
        'app/api/emissor/laudos/[loteId]/pdf/route.ts'
      );
      expect(fs.existsSync(pdfRoute)).toBe(true);

      const content = fs.readFileSync(pdfRoute, 'utf-8');
      expect(content).toContain('getPuppeteerInstance');
      // PDF route é para geração server-side quando necessário
    });

    it('deve ter componente EmissorDashboard com gerarPDFClientSide', () => {
      const emissorPage = path.join(process.cwd(), 'app/emissor/page.tsx');
      expect(fs.existsSync(emissorPage)).toBe(true);

      const content = fs.readFileSync(emissorPage, 'utf-8');
      expect(content).toContain('gerarPDFClientSide');
      expect(content).toContain('handleDownloadLaudo');
    });

    it('deve ter componente LaudoDownloadClient (legado mas funcional)', () => {
      const clientComponent = path.join(
        process.cwd(),
        'components/pdf/LaudoDownloadClient.tsx'
      );
      expect(fs.existsSync(clientComponent)).toBe(true);

      const content = fs.readFileSync(clientComponent, 'utf-8');
      expect(content).toContain('jsPDF');
      expect(content).toContain('html2canvas');
    });
  });

  // ============================================================================
  // TESTE: Validar fluxo de dados entre endpoints
  // ============================================================================
  describe('Fluxo: Download → HTML → Client-side', () => {
    it('/download deve retornar JSON apontando para /html quando PDF não existe', () => {
      const downloadRoute = fs.readFileSync(
        path.join(
          process.cwd(),
          'app/api/emissor/laudos/[loteId]/download/route.ts'
        ),
        'utf-8'
      );

      // Verificar lógica de fallback
      expect(downloadRoute).toContain('readFile'); // usa fs/promises
      expect(downloadRoute).toContain('useClientSide: true');
      expect(downloadRoute).toContain('/html');
    });

    it('/html deve retornar HTML completo do laudo', () => {
      const htmlRoute = fs.readFileSync(
        path.join(
          process.cwd(),
          'app/api/emissor/laudos/[loteId]/html/route.ts'
        ),
        'utf-8'
      );

      // Verificar headers corretos
      expect(htmlRoute).toContain('text/html');
      expect(htmlRoute).toContain('gerarHTMLLaudoCompleto');
    });

    it('EmissorDashboard deve detectar JSON e chamar gerarPDFClientSide', () => {
      const emissorPage = fs.readFileSync(
        path.join(process.cwd(), 'app/emissor/page.tsx'),
        'utf-8'
      );

      // Verificar detecção de content-type
      expect(emissorPage).toContain(
        "contentType?.includes('application/json')"
      );
      expect(emissorPage).toContain('data.useClientSide');
      expect(emissorPage).toContain('data.htmlEndpoint');

      // Verificar chamada para geração client-side
      expect(emissorPage).toContain('await gerarPDFClientSide');
    });
  });

  // ============================================================================
  // TESTE: Validar implementação de gerarPDFClientSide
  // ============================================================================
  describe('Implementação: gerarPDFClientSide completa', () => {
    it('deve importar jsPDF e html2canvas dinamicamente', () => {
      const emissorPage = fs.readFileSync(
        path.join(process.cwd(), 'app/emissor/page.tsx'),
        'utf-8'
      );

      expect(emissorPage).toContain("await import('jspdf')");
      expect(emissorPage).toContain("await import('html2canvas')");
    });

    it('deve criar iframe temporário invisível', () => {
      const emissorPage = fs.readFileSync(
        path.join(process.cwd(), 'app/emissor/page.tsx'),
        'utf-8'
      );

      expect(emissorPage).toContain("createElement('iframe')");
      expect(emissorPage).toContain("position = 'absolute'");
      expect(emissorPage).toContain("left = '-9999px'");
    });

    it('deve aguardar carregamento de imagens', () => {
      const emissorPage = fs.readFileSync(
        path.join(process.cwd(), 'app/emissor/page.tsx'),
        'utf-8'
      );

      expect(emissorPage).toContain("querySelectorAll('img')");
      expect(emissorPage).toContain('img.complete');
      expect(emissorPage).toContain('img.onload');
    });

    it('deve capturar canvas com html2canvas', () => {
      const emissorPage = fs.readFileSync(
        path.join(process.cwd(), 'app/emissor/page.tsx'),
        'utf-8'
      );

      expect(emissorPage).toContain('await html2canvas');
      expect(emissorPage).toContain('scale: 2');
      expect(emissorPage).toContain('useCORS: true');
    });

    it('deve gerar PDF com jsPDF em formato A4', () => {
      const emissorPage = fs.readFileSync(
        path.join(process.cwd(), 'app/emissor/page.tsx'),
        'utf-8'
      );

      expect(emissorPage).toContain('new jsPDF');
      expect(emissorPage).toContain("orientation: 'portrait'");
      expect(emissorPage).toContain("format: 'a4'");
      expect(emissorPage).toContain('pdf.addImage');
      expect(emissorPage).toContain('pdf.save');
    });

    it('deve limpar iframe após geração', () => {
      const emissorPage = fs.readFileSync(
        path.join(process.cwd(), 'app/emissor/page.tsx'),
        'utf-8'
      );

      expect(emissorPage).toContain('removeChild(iframe)');
    });

    it('deve ter logs de debugging', () => {
      const emissorPage = fs.readFileSync(
        path.join(process.cwd(), 'app/emissor/page.tsx'),
        'utf-8'
      );

      expect(emissorPage).toContain('[PDF] Iniciando geração client-side');
      expect(emissorPage).toContain('[PDF] HTML renderizado no iframe');
      expect(emissorPage).toContain('[PDF] Canvas capturado');
      expect(emissorPage).toContain('[SUCCESS] PDF gerado e baixado');
    });
  });

  // ============================================================================
  // TESTE: Validar tratamento de erros
  // ============================================================================
  describe('Segurança: Tratamento de erros', () => {
    it('handleDownloadLaudo deve validar laudo.id antes de fazer fetch', () => {
      const emissorPage = fs.readFileSync(
        path.join(process.cwd(), 'app/emissor/page.tsx'),
        'utf-8'
      );

      expect(emissorPage).toContain('if (!lote.laudo?.id)');
      expect(emissorPage).toContain('Erro: ID do laudo inválido');
    });

    it('deve capturar erros na geração client-side', () => {
      const emissorPage = fs.readFileSync(
        path.join(process.cwd(), 'app/emissor/page.tsx'),
        'utf-8'
      );

      // Verificar try-catch em gerarPDFClientSide
      const funcMatch = emissorPage.match(
        /gerarPDFClientSide[\s\S]*?catch\s*\(/
      );
      expect(funcMatch).toBeTruthy();
      expect(emissorPage).toContain('[PDF-ERROR]');
    });

    it('deve exibir mensagem de erro amigável ao usuário', () => {
      const emissorPage = fs.readFileSync(
        path.join(process.cwd(), 'app/emissor/page.tsx'),
        'utf-8'
      );

      expect(emissorPage).toContain('downloadError');
      expect(emissorPage).toContain('alert(');
      expect(emissorPage).toContain('Erro ao fazer download do laudo');
    });
  });

  // ============================================================================
  // TESTE: Validar que Puppeteer só é usado em emergências
  // ============================================================================
  describe('Restrição: Puppeteer apenas para emergências', () => {
    it('/download NÃO deve usar Puppeteer', () => {
      const downloadRoute = fs.readFileSync(
        path.join(
          process.cwd(),
          'app/api/emissor/laudos/[loteId]/download/route.ts'
        ),
        'utf-8'
      );

      expect(downloadRoute).not.toContain('puppeteer');
      expect(downloadRoute).not.toContain('getPuppeteerInstance');
    });

    it('/pdf deve ter Puppeteer apenas para emergências', () => {
      const pdfRoute = fs.readFileSync(
        path.join(
          process.cwd(),
          'app/api/emissor/laudos/[loteId]/pdf/route.ts'
        ),
        'utf-8'
      );

      expect(pdfRoute).toContain('getPuppeteerInstance');
      // Endpoint /pdf é em si uma rota de emergência/manual
    });

    it('Emissor page deve priorizar client-side', () => {
      const emissorPage = fs.readFileSync(
        path.join(process.cwd(), 'app/emissor/page.tsx'),
        'utf-8'
      );

      // Verificar que tenta download direto primeiro
      expect(emissorPage).toContain('await fetch');
      expect(emissorPage).toContain("contentType?.includes('application/pdf')");

      // Mas tem fallback client-side
      expect(emissorPage).toContain('useClientSide');
      expect(emissorPage).toContain('gerarPDFClientSide');
    });
  });

  // ============================================================================
  // TESTE: Validar documentação
  // ============================================================================
  describe('Documentação: Arquivos de análise', () => {
    it('deve existir ANALYSIS-VERCEL-PDF-ISSUE.md', () => {
      const analysisFile = path.join(
        process.cwd(),
        'ANALYSIS-VERCEL-PDF-ISSUE.md'
      );
      expect(fs.existsSync(analysisFile)).toBe(true);

      const content = fs.readFileSync(analysisFile, 'utf-8');
      expect(content).toContain('Vercel');
      expect(content).toContain('Chromium');
      expect(content).toContain('client-side');
    });

    it('deve existir IMPLEMENTATION-CLIENT-SIDE-PDF.md', () => {
      const implFile = path.join(
        process.cwd(),
        'IMPLEMENTATION-CLIENT-SIDE-PDF.md'
      );
      expect(fs.existsSync(implFile)).toBe(true);

      const content = fs.readFileSync(implFile, 'utf-8');
      expect(content).toContain('jsPDF');
      expect(content).toContain('html2canvas');
    });
  });

  // ============================================================================
  // TESTE: Validar dependências instaladas
  // ============================================================================
  describe('Dependências: jsPDF e html2canvas', () => {
    it('package.json deve ter jsPDF', () => {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
      );

      const hasJsPDF =
        packageJson.dependencies?.jspdf || packageJson.devDependencies?.jspdf;
      expect(hasJsPDF).toBeTruthy();
    });

    it('package.json deve ter html2canvas', () => {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
      );

      const hasHtml2Canvas =
        packageJson.dependencies?.html2canvas ||
        packageJson.devDependencies?.html2canvas;
      expect(hasHtml2Canvas).toBeTruthy();
    });

    it('package.json deve manter @sparticuz/chromium (para emergências)', () => {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
      );

      const hasChromium =
        packageJson.dependencies?.['@sparticuz/chromium'] ||
        packageJson.devDependencies?.['@sparticuz/chromium'];
      expect(hasChromium).toBeTruthy();
    });
  });

  // ============================================================================
  // TESTE: Validar compatibilidade Vercel
  // ============================================================================
  describe('Vercel: Compatibilidade com serverless', () => {
    it('/download não deve escrever em filesystem', () => {
      const downloadRoute = fs.readFileSync(
        path.join(
          process.cwd(),
          'app/api/emissor/laudos/[loteId]/download/route.ts'
        ),
        'utf-8'
      );

      // Não deve criar/escrever arquivos (apenas ler se existir)
      expect(downloadRoute).not.toContain('writeFileSync');
      expect(downloadRoute).not.toContain('mkdirSync');
      expect(downloadRoute).not.toContain('fs.writeFile');
    });

    it('gerarPDFClientSide deve ser 100% client-side (sem Node APIs)', () => {
      const emissorPage = fs.readFileSync(
        path.join(process.cwd(), 'app/emissor/page.tsx'),
        'utf-8'
      );

      const funcStart = emissorPage.indexOf('gerarPDFClientSide');
      const funcEnd = emissorPage.indexOf('};', funcStart) + 2;
      const funcCode = emissorPage.substring(funcStart, funcEnd);

      // Não deve usar Node.js APIs
      expect(funcCode).not.toContain('fs.');
      expect(funcCode).not.toContain('require(');
      expect(funcCode).not.toContain('process.');

      // Deve usar browser APIs
      expect(funcCode).toContain('document.');
      // window pode não aparecer explicitamente se usar URL.createObjectURL
    });
  });
});
