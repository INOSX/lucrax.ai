# Regras do Projeto Lucrax.ai

## 🔐 Variáveis de Ambiente

### Regra de Segurança: NÃO usar prefixo VITE_ para Supabase

**IMPORTANTE**: As variáveis do Supabase NÃO devem ter o prefixo `VITE_` porque isso as expõe no frontend, comprometendo a segurança.

### Variáveis Corretas:
- `SUPABASE_URL` (não `VITE_SUPABASE_URL`)
- `SUPABASE_ANON_KEY` (não `VITE_SUPABASE_ANON_KEY`)
- `OPENAI_API_KEY` (não `VITE_OPENAI_API_KEY`)

### Configuração no Vercel:
As variáveis de ambiente no Vercel devem estar configuradas em **MAIÚSCULAS**:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`

### Configuração no vite.config.js:
```javascript
define: {
  global: 'globalThis',
  'import.meta.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL),
  'import.meta.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY),
  'import.meta.env.OPENAI_API_KEY': JSON.stringify(process.env.OPENAI_API_KEY),
}
```

## 🚀 Deploy

### Branches:
- `develop` → Staging (staging.lucrax.ai)
- `main` → Production (lucrax.ai)

### Regra de Commit:
**SEMPRE DEVEMOS TRABALHAR NO BRANCH DEVELOP E SÓ FAZER COMIT E PUSH PARA O MAIN QUANDO EU MANDAR**

## 🛠️ Stack Tecnológica

- **Frontend**: Vite + React + TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Chart.js + react-chartjs-2
- **Backend**: Supabase
- **Deploy**: Vercel
- **Autenticação**: Supabase Auth

## 📁 Estrutura de Arquivos

```
src/
├── components/          # Componentes React
├── contexts/           # Contexts (Auth, etc.)
├── services/           # Serviços (Supabase, etc.)
├── config/             # Configurações
├── utils/              # Utilitários
└── env.d.ts           # Tipos TypeScript para env vars
```
