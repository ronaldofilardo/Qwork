const { query } = require('./lib/infrastructure/database');
query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%contrat%'")
  .then(result => console.log(result.rows))
  .catch(console.error);