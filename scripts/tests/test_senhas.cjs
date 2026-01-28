const bcrypt = require('bcryptjs');

async function testPasswords() {
  const hashes = [
    '$2a$06$eSfK/ZmLMeal4xTA93vYYeqrZ9LWZS4qGJDZFMUYgPVynNipjQFvO', // 87545772920
    '$2a$06$XTowlWdcwFqRVxkD8nrOgeOYHgGf/.tGDdOQFjKSPj83F7VjRhKoi', // 45678901234
    '$2a$06$Fh07zI4hBy0VSxFkZulytO2L0IE46z1IrEZuIq8TjNpk/WtvjQwCe'  // 56789012345
  ];

  const passwords = ['000170', '000133', '000144'];
  const cpfs = ['87545772920', '45678901234', '56789012345'];

  for (let i = 0; i < passwords.length; i++) {
    const isValid = await bcrypt.compare(passwords[i], hashes[i]);
    console.log(`CPF ${cpfs[i]} - Senha ${passwords[i]}: ${isValid ? 'VÁLIDA' : 'INVÁLIDA'}`);
  }
}

testPasswords();