# 🎯 IMPLEMENTAÇÃO: Integração Client-Side PDF Download

**Status:** Pronto para implementar  
**Prioridade:** ALTA  
**Tempo estimado:** 30 minutos

---

## 📋 O que fazer

Modificar o frontend do emissor para usar geração client-side quando o PDF não estiver disponível no servidor.

---

## 🔧 Mudanças Necessárias

### **Arquivo: `app/emissor/page.tsx`**

**Localização:** Função `handleDownloadLaudo`

**Código Atual:**

```typescript
const handleDownloadLaudo = async (lote: Lote) => {
  if (!lote.laudo?.id) {
    alert('Erro: ID do laudo inválido');
    return;
  }

  try {
    const response = await fetch(`/api/emissor/laudos/${lote.id}/download`);
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: 'Erro na resposta do servidor' }));
      alert(
        `Erro ao baixar laudo: ${errorData.error || 'Erro na resposta do servidor'}`
      );
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laudo-${lote.codigo || lote.id}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erro ao fazer download:', error);
    alert('Erro ao fazer download do laudo');
  }
};
```

**Código NOVO (com client-side fallback):**

```typescript
const handleDownloadLaudo = async (lote: Lote) => {
  if (!lote.laudo?.id) {
    alert('Erro: ID do laudo inválido');
    return;
  }

  try {
    // 1. Tentar download direto (se PDF existe no servidor)
    const response = await fetch(`/api/emissor/laudos/${lote.id}/download`);

    // 2. Verificar se recebeu PDF ou instrução para usar client-side
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/pdf')) {
      // PDF disponível - fazer download direto
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laudo-${lote.codigo || lote.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      return;
    }

    if (contentType?.includes('application/json')) {
      // Resposta JSON - verificar se deve usar client-side
      const data = await response.json();

      if (data.useClientSide && data.htmlEndpoint) {
        // 3. Usar geração client-side
        console.log(
          '[INFO] PDF não disponível no servidor. Usando geração client-side...'
        );

        // Buscar HTML do laudo
        const htmlResponse = await fetch(data.htmlEndpoint);

        if (!htmlResponse.ok) {
          throw new Error('Erro ao buscar HTML do laudo');
        }

        const htmlContent = await htmlResponse.text();

        // 4. Usar LaudoDownloadClient para gerar PDF no navegador
        // OPÇÃO A: Importar dinamicamente
        const { LaudoDownloadClient } =
          await import('@/components/pdf/LaudoDownloadClient');

        // OPÇÃO B: Chamar função de geração diretamente
        // (Implementar helper function abaixo)
        await gerarPDFClientSide(
          htmlContent,
          `laudo-${lote.codigo || lote.id}`,
          lote.id
        );

        return;
      }

      // Erro genérico
      alert(`Erro: ${data.error || 'Laudo não disponível'}`);
      return;
    }

    // Resposta inesperada
    throw new Error('Resposta inesperada do servidor');
  } catch (error) {
    console.error('Erro ao fazer download:', error);
    alert(
      `Erro ao fazer download do laudo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
};

// Helper function para geração client-side
async function gerarPDFClientSide(
  htmlContent: string,
  filename: string,
  loteId: number
) {
  // Importar dependências
  const { jsPDF } = await import('jspdf');
  const html2canvas = (await import('html2canvas')).default;

  // Criar iframe temporário
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.left = '-9999px';
  iframe.style.width = '210mm';
  iframe.style.height = '297mm';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    throw new Error('Não foi possível criar documento temporário');
  }

  doc.open();
  doc.write(htmlContent);
  doc.close();

  // Aguardar renderização
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Garantir carregamento de imagens
  const images = doc.querySelectorAll('img');
  await Promise.all(
    Array.from(images).map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete) resolve(true);
          else {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
          }
        })
    )
  );

  // Capturar canvas
  const canvas = await html2canvas(doc.body, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    windowWidth: 794,
    windowHeight: 1123,
  });

  // Gerar PDF
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const imgWidth = 210;
  const pageHeight = 297;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;

  let position = 0;
  const imgData = canvas.toDataURL('image/png');

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft >= 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  // Download
  pdf.save(`${filename}.pdf`);

  // Cleanup
  document.body.removeChild(iframe);

  console.log(`[SUCCESS] PDF gerado client-side: ${filename}.pdf`);
}
```

---

## ✅ Checklist de Teste

### Teste Local (deve funcionar)

```bash
cd c:\apps\QWork
pnpm dev
```

1. [ ] Acessar http://localhost:3000/emissor
2. [ ] Fazer login como emissor (CPF: 53051173991)
3. [ ] Clicar em "Baixar Laudo" de um lote emitido
4. [ ] Verificar se PDF é baixado corretamente
5. [ ] Abrir console do navegador - não deve ter erros

### Teste Vercel Preview

```bash
vercel --prod=false
```

1. [ ] Deploy para preview
2. [ ] Acessar URL do preview
3. [ ] Repetir testes acima
4. [ ] Verificar logs: https://vercel.com/ronaldofilardo/qwork/logs
5. [ ] Confirmar que não há erros de Chromium

### Teste Produção

```bash
vercel --prod
```

1. [ ] Deploy para produção
2. [ ] Acessar qwork-psi.vercel.app
3. [ ] Testar download de laudo existente
4. [ ] Testar download de laudo sem PDF (geração client-side)
5. [ ] Monitorar logs por 24h

---

## 🎨 Melhorias Opcionais (Fazer depois)

### 1. Loading State

```typescript
const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

// No handleDownloadLaudo:
setIsGeneratingPDF(true);
try {
  await gerarPDFClientSide(...);
} finally {
  setIsGeneratingPDF(false);
}

// No JSX:
{isGeneratingPDF && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-xl">
      <div className="flex items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span>Gerando PDF no navegador...</span>
      </div>
    </div>
  </div>
)}
```

### 2. Progress Bar

```typescript
// Durante geração:
const updateProgress = (step: string) => {
  console.log(`[PDF] ${step}`);
  // Atualizar UI com progress
};

updateProgress('Carregando HTML...');
updateProgress('Renderizando página...');
updateProgress('Capturando canvas...');
updateProgress('Gerando PDF...');
updateProgress('Concluído!');
```

### 3. Error Handling Detalhado

```typescript
catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

  // Log para debugging
  console.error('[PDF-ERROR]', {
    loteId: lote.id,
    error: errorMessage,
    stack: error instanceof Error ? error.stack : undefined,
  });

  // Mensagem amigável para usuário
  alert(
    `Não foi possível gerar o PDF.\n\n` +
    `Detalhes: ${errorMessage}\n\n` +
    `Por favor, tente novamente ou entre em contato com o suporte.`
  );
}
```

---

## 🔍 Debugging

### Verificar se HTML endpoint está funcionando:

```javascript
// No console do navegador:
fetch('/api/emissor/laudos/11/html')
  .then((r) => r.text())
  .then((html) => console.log(html.substring(0, 500)));
```

### Verificar resposta da rota /download:

```javascript
fetch('/api/emissor/laudos/11/download')
  .then((r) => r.json())
  .then((data) => console.log(data));
```

### Monitorar Vercel Logs:

```bash
vercel logs qwork-psi.vercel.app --follow
```

---

## 📊 Métricas de Sucesso

- [ ] 0 erros de Chromium nos logs da Vercel
- [ ] Download funciona em 100% dos casos
- [ ] Tempo médio de geração < 5 segundos
- [ ] Nenhum timeout (10s limite Vercel Free)
- [ ] Usuários conseguem baixar laudos sem erro

---

## 🆘 Rollback Plan

Se algo der errado:

1. Reverter commit:

```bash
git revert HEAD
git push origin main
```

2. Deploy da versão anterior:

```bash
vercel rollback <previous-deployment-url>
```

3. Verificar logs:

```bash
vercel logs --limit 100
```

---

## 📝 Notas Importantes

1. **LaudoDownloadClient já existe** - Componente está implementado e testado
2. **API /html já funciona** - Endpoint está pronto e retornando HTML
3. **Mudança mínima** - Só precisa modificar handleDownloadLaudo
4. **Compatível com existente** - Se PDF existe no servidor, funciona igual
5. **Fallback seguro** - Se falhar, mostra erro amigável

---

**Próximo passo:** Aplicar mudanças no `app/emissor/page.tsx` e testar localmente! 🚀
