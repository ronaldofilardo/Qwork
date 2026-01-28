import bcrypt from 'bcryptjs';

async function generateHash() {
  const hash = await bcrypt.hash('Qwork@2026', 10);
  console.log(hash);
}

generateHash();
