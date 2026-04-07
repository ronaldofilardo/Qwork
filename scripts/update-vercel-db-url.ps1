$env:PGPASSWORD = "npg_J2QYqn5oxCzp"
$dbUrl = "postgresql://neondb_owner:npg_J2QYqn5oxCzp@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb_v2?sslmode=require&channel_binding=require"
echo $dbUrl | vercel env add DATABASE_URL production
Write-Host "Done"
