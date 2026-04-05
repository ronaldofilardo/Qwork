const bcrypt = require('bcryptjs');
(async () => {
  const pw = process.argv[2] || '000170';
  const hash = await bcrypt.hash(pw, 10);
  console.log(hash);
})();
