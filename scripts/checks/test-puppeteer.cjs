// Teste simples do Puppeteer
const puppeteer = require("puppeteer");

async function testPuppeteer() {
  try {
    console.log("Iniciando teste do Puppeteer...");

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    console.log("Browser iniciado com sucesso");

    const page = await browser.newPage();
    await page.setContent("<h1>Teste Puppeteer</h1><p>Funcionando!</p>", {
      waitUntil: "networkidle0",
    });

    console.log("Página criada com sucesso");

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    console.log("PDF gerado com sucesso, tamanho:", pdfBuffer.length, "bytes");

    await browser.close();

    console.log("Teste concluído com sucesso!");
    return true;
  } catch (error) {
    console.error("Erro no teste do Puppeteer:", error);
    return false;
  }
}

testPuppeteer();
