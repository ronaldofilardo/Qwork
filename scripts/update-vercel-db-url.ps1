$env:PGPASSWORD = if ($env:NEON_PASSWORD) { $env:NEON_PASSWORD } else { throw 'Set $env:NEON_PASSWORD before running' }
$dbUrl = $env:DATABASE_URL
echo $dbUrl | vercel env add DATABASE_URL production
Write-Host "Done"
