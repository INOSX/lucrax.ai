# Script PowerShell para deploy do Lucrax.ai no Vercel
Write-Host "🚀 Deploy do Lucrax.ai no Vercel" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Verificar se o Vercel CLI está instalado
try {
    $vercelVersion = vercel --version
    Write-Host "✅ Vercel CLI encontrado: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI não encontrado. Instalando..." -ForegroundColor Red
    npm install -g vercel
}

# Verificar se está logado no Vercel
try {
    $user = vercel whoami
    Write-Host "✅ Logado como: $user" -ForegroundColor Green
} catch {
    Write-Host "🔐 Fazendo login no Vercel..." -ForegroundColor Yellow
    vercel login
}

# Verificar se o arquivo .env existe
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Arquivo .env não encontrado!" -ForegroundColor Yellow
    Write-Host "📝 Criando arquivo .env baseado no exemplo..." -ForegroundColor Yellow
    Copy-Item "config_example.env" ".env"
    Write-Host "✅ Arquivo .env criado. Configure suas credenciais antes de continuar." -ForegroundColor Green
    exit 1
}

# Fazer deploy
Write-Host "📦 Fazendo deploy de preview (staging)..." -ForegroundColor Blue
vercel --confirm --scope inosx

Write-Host "📦 Fazendo deploy de produção..." -ForegroundColor Blue
vercel --prod --confirm --scope inosx

Write-Host "✅ Deploy concluído!" -ForegroundColor Green
Write-Host "🌐 Produção: https://lucrax.ai" -ForegroundColor Cyan
Write-Host "🧪 Staging: https://staging.lucrax.ai" -ForegroundColor Cyan
Write-Host "📊 API: https://lucrax.ai/api" -ForegroundColor Cyan
