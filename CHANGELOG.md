# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Não Lançado]

### Adicionado
- Sistema de regras MDC para o Cursor AI
- Guia de criação de novas regras
- Regras específicas para CHANGELOG

### Alterado
- Melhorada organização das regras do projeto
- Atualizada documentação de regras

### Corrigido
- Removidos arquivos de regras com formato incorreto
- Corrigida estrutura de diretórios de regras

## [2.6.0] - 2025-10-27

### Adicionado
- Integração completa com Supabase
- Suporte a OpenAI API (prioritário) e NNeural.io (fallback)
- Sistema modular de carregamento de dados
- Geração de gráficos com Plotly
- Validação robusta de entrada e segurança
- Deploy automatizado no Vercel
- Sistema de persistência de dados
- Histórico de análises
- Cache inteligente de dados
- Monitoramento e logs detalhados

### Alterado
- Refatorada arquitetura para modularidade
- Melhorada segurança com validação de entrada
- Otimizada performance de carregamento
- Atualizada documentação do projeto

### Corrigido
- Resolvidos problemas de encoding em scripts
- Corrigidas validações de URL do Google Sheets
- Resolvidos problemas de dependências

### Segurança
- Implementada sanitização de entrada do usuário
- Adicionada validação de URLs
- Melhorada gestão de chaves API
- Implementado Row Level Security no Supabase

## [2.5.0] - 2025-10-20

### Adicionado
- Integração inicial com NNeural.io
- Suporte básico a Google Sheets
- Interface Streamlit
- Geração de gráficos básicos

### Alterado
- Melhorada interface de usuário
- Otimizada performance de carregamento

### Corrigido
- Resolvidos bugs de carregamento de dados
- Corrigidas validações básicas

---

**Legenda:**
- **Adicionado**: Novas funcionalidades
- **Alterado**: Mudanças em funcionalidades existentes
- **Depreciado**: Funcionalidades que serão removidas
- **Removido**: Funcionalidades removidas
- **Corrigido**: Correções de bugs
- **Segurança**: Vulnerabilidades corrigidas
