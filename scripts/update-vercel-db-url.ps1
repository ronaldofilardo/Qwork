$env:PGPASSWORD = "REDACTED_NEON_PASSWORD"
$dbUrl = "postgresql://neondb_owner:REDACTED@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb_v2?sslmode=require&channel_binding=require"
echo $dbUrl | vercel env add DATABASE_URL production
Write-Host "Done"
