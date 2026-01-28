const bcrypt = require('bcryptjs');

async function testHash() {
  console.log('=== TESTE DE HASH BCRYPT ===');

  const senha = '000170';
  console.log(`Senha original: ${senha}`);

  const hash = await bcrypt.hash(senha, 10);
  console.log(`Hash gerado: ${hash}`);
  console.log(`Comprimento: ${hash.length}`);

  // Testar comparação
  const isValid = await bcrypt.compare(senha, hash);
  console.log(`Comparação válida: ${isValid}`);

  // Testar com hash truncado (simulando o problema)
  const truncatedHash = hash.substring(0, 37);
  console.log(`\nHash truncado: ${truncatedHash}`);
  console.log(`Comprimento truncado: ${truncatedHash.length}`);

  const isValidTruncated = await bcrypt.compare(senha, truncatedHash);
  console.log(`Comparação com hash truncado: ${isValidTruncated}`);
}

testHash();
