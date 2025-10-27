#!/bin/bash

# Script para deploy do dataGPT v2.6 no Vercel
echo "🚀 Deploy do dataGPT v2.6 no Vercel"
echo "=================================="

# Verificar se o Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI não encontrado. Instalando..."
    npm install -g vercel
fi

# Verificar se está logado no Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Fazendo login no Vercel..."
    vercel login
fi

# Verificar se o arquivo .env existe
if [ ! -f .env ]; then
    echo "⚠️  Arquivo .env não encontrado!"
    echo "📝 Criando arquivo .env baseado no exemplo..."
    cp config_example.env .env
    echo "✅ Arquivo .env criado. Configure suas credenciais antes de continuar."
    exit 1
fi

# Fazer deploy
echo "📦 Fazendo deploy..."
vercel --prod

echo "✅ Deploy concluído!"
echo "🌐 Acesse sua aplicação no URL fornecido pelo Vercel"
echo "📊 Teste a API em: https://seu-projeto.vercel.app/api"
echo "🖥️  Interface web em: https://seu-projeto.vercel.app/"
