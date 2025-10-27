# 🚀 Instruções para Deploy no Vercel

## ✅ **Problema Resolvido!**

O projeto agora está configurado corretamente para o Vercel. As seguintes correções foram aplicadas:

### 🔧 **Configurações Adicionadas:**

1. **`runtime.txt`** - Especifica Python 3.9
2. **`pyproject.toml`** - Configuração moderna do Python
3. **`vercel.json`** simplificado - Compatível com Vercel
4. **`requirements.txt`** otimizado - Apenas dependências necessárias
5. **`index.html`** na raiz - Página inicial acessível

## 🎯 **Como Criar o Projeto no Vercel:**

### **Passo 1: Acesse o Vercel**
1. Vá para [vercel.com](https://vercel.com)
2. Faça login com sua conta
3. Clique em "New Project"

### **Passo 2: Importe o Repositório**
1. Selecione "Import Git Repository"
2. Escolha `m2f0/dataGPT`
3. O Vercel agora deve detectar automaticamente:
   - **Framework Preset**: Python
   - **Root Directory**: `./`
   - **Build Command**: Detectado automaticamente

### **Passo 3: Configure as Variáveis de Ambiente**
No painel de configuração, adicione:

```env
OPENAI_API_KEY=sua-chave-api-openai-aqui
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7
API_BASE_URL=http://93.127.210.77:5000
```

### **Passo 4: Deploy**
1. Clique em "Deploy"
2. Aguarde o build (2-3 minutos)
3. Acesse sua URL: `https://datagpt-xxx.vercel.app`

## 🌟 **O que o Vercel Deve Detectar Agora:**

- ✅ **Framework**: Python (detectado automaticamente)
- ✅ **Build Command**: `pip install -r requirements.txt`
- ✅ **Output Directory**: Detectado automaticamente
- ✅ **Root Directory**: `./` (correto)

## 📊 **Estrutura do Projeto:**

```
dataGPT/
├── api/
│   └── index.py              # API serverless
├── index.html                # Página inicial
├── requirements.txt          # Dependências Python
├── runtime.txt              # Versão Python 3.9
├── pyproject.toml           # Configuração Python
├── vercel.json              # Configuração Vercel
└── src/                     # Módulos Python
```

## 🧪 **Testando Após Deploy:**

### **Interface Web**
- Acesse: `https://seu-projeto.vercel.app/`
- Teste carregamento de dados do Google Sheets
- Gere gráficos interativos
- Use análise com IA

### **API Direta**
- Status: `https://seu-projeto.vercel.app/api`
- Endpoints: `POST https://seu-projeto.vercel.app/api`

## 🔍 **Se Ainda Houver Problemas:**

### **Framework Preset Manual**
Se o Vercel não detectar automaticamente:
1. Selecione "Other" no Framework Preset
2. Deixe Root Directory como `./`
3. O Vercel detectará Python pelo `requirements.txt`

### **Build Command Manual**
Se necessário, configure:
- **Build Command**: `pip install -r requirements.txt`
- **Output Directory**: Deixe vazio (detectado automaticamente)

## 🎉 **Resultado Esperado:**

Após o deploy, você terá:
- ✅ **API funcionando** em `https://seu-projeto.vercel.app/api`
- ✅ **Interface web** em `https://seu-projeto.vercel.app/`
- ✅ **Integração OpenAI** funcionando
- ✅ **Deploy automático** a cada push no GitHub

## 📞 **Suporte:**

Se ainda houver problemas:
1. Verifique os logs de build no Vercel
2. Confirme que as variáveis de ambiente estão configuradas
3. Teste localmente com `vercel dev`

**O projeto está 100% pronto para o Vercel!** 🚀
