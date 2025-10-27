dataGPT Open Source
===================

Status: [![Status](https://img.shields.io/badge/status-active-success.svg)]()
GitHub Issues: [![GitHub Issues](https://img.shields.io/github/issues/m2f0/dataGPT.svg)](https://github.com/m2f0/dataGPT/issues)
GitHub Pull Requests: [![GitHub Pull Requests](https://img.shields.io/github/issues-pr/m2f0/dataGPT.svg)](https://github.com/m2f0/dataGPT/pulls)
License: [![License](https://img.shields.io/badge/license-MIT-blue.svg)](/LICENSE)


Uma aplicação open source para visualizar e analisar dados do Google Sheets compartilhados via Google Drive.

## Lançamento da Nova Versão do dataGPT 2.6 - Melhorada

Temos o prazer de anunciar o lançamento da versão 2.6 melhorada do dataGPT, nossa aplicação open source para visualização e análise de dados do Google Sheets compartilhados via Google Drive. Esta nova versão traz uma série de novos recursos, melhorias significativas de segurança, validação e organização do código, além de correções de bugs importantes.

### 🚀 Principais Melhorias Implementadas

#### Arquitetura e Organização
- **Código Consolidado**: Unificação dos arquivos duplicados em uma estrutura modular
- **Configuração Centralizada**: Todas as configurações em um único arquivo `config.py`
- **Validação Robusta**: Sistema completo de validação de dados e segurança
- **Tratamento de Erros**: Melhor tratamento de exceções e mensagens de erro claras

#### Segurança Aprimorada
- **Validação de Entrada**: Sanitização de URLs e dados de entrada
- **Validação de API**: Verificação de chaves API e configurações
- **Proteção XSS**: Sanitização de conteúdo HTML para prevenir ataques
- **Validação de Dados**: Verificação rigorosa de DataFrames e colunas

#### Performance e Confiabilidade
- **Cache Inteligente**: Sistema de cache para tokens e análises
- **Timeouts Configuráveis**: Controle de tempo limite para requisições
- **Retry Logic**: Lógica de retry para requisições falhadas
- **Validação de URLs**: Verificação robusta de URLs do Google Sheets

### Novos Recursos

#### 🗄️ Persistência de Dados com Supabase

O dataGPT v2.6 agora inclui persistência completa de dados usando Supabase:

- ✅ **Histórico de análises** - Todas as análises ficam salvas
- ✅ **Configurações reutilizáveis** - Salve e reutilize configurações de gráficos
- ✅ **Cache inteligente** - Dados importados são armazenados
- ✅ **Monitoramento** - Logs detalhados de uso e performance

**Projeto Supabase**: `hwfnntgacsebqrprqzzm.supabase.co` ✅ **Ativo e funcionando**

#### Opção de Mostrar Totais nos Gráficos

Agora é possível mostrar os totais acima das colunas e pontos em gráficos de barra, linha, dispersão e área. Esta funcionalidade permite uma visualização mais clara e imediata dos valores representados.

#### Suporte a Novos Tipos de Gráficos

Adicionamos suporte a novos tipos de gráficos, incluindo:
- Histogramas
- Boxplots
- Heatmaps
- Gráficos de violino

#### Personalização Aprimorada de Gráficos

- **Escolha de Cores**: Agora é possível escolher a cor dos gráficos diretamente na interface do usuário.
- **Labels Customizáveis**: Títulos e rótulos dos eixos podem ser personalizados para melhorar a clareza dos gráficos.

#### Análise de Dados com IA

- **Integração com NNeural.io**: Melhoria na integração para enviar dados e gráficos para análise automática, proporcionando insights mais rápidos e precisos.

### Interface de Usuário Melhorada

- **Layout Responsivo**: Melhorias no layout para uma experiência de usuário mais fluida e responsiva.
- **Novo Tema**: Implementação de um novo tema visual para tornar a aplicação mais atraente e fácil de usar.

### Bugs Corrigidos

#### Correção de Bugs de Visualização

- **Correção na Exibição de Gráficos**: Corrigimos problemas onde gráficos não eram exibidos corretamente em determinadas condições.
- **Ajuste na Renderização de Totais**: Correção de bugs que impediam a exibição correta dos totais nos gráficos.

#### Melhorias na Carregamento de Dados

- **Correção na Leitura de Links do Google Drive**: Melhoramos a leitura e processamento de links de compartilhamento do Google Drive para evitar falhas de carregamento.
- **Desempenho Aprimorado**: Otimização do processo de carregamento de dados, tornando a aplicação mais rápida e eficiente.

#### Correções de Bugs na Integração com IA

- **Correção de Erros de Autenticação**: Solução de problemas de autenticação que impediam o envio de dados para análise pela NNeural.io.
- **Melhoria no Tratamento de Erros**: Implementação de melhores mensagens de erro e tratamento de exceções para tornar a depuração mais fácil e eficaz.



## Tabela de Conteúdos

- [Sobre](#sobre)
- [Primeiros Passos](#primeiros-passos)
- [Uso](#uso)
- [Construído Usando](#construído-usando)
- [TODO](#todo)
- [Contribuindo](#contribuindo)
- [Autores](#autores)
- [Agradecimentos](#agradecimentos)

## Sobre

O dataGPT open source permite visualizar dados compartilhados via Google Drive. Você pode inserir um link de compartilhamento de um arquivo Google Sheets, escolher as colunas para os eixos X e Y de um gráfico, e visualizar os dados e o gráfico interativamente. Além disso, é possível utilizar inteligência artificial para analisar os gráficos gerados.

## Primeiros Passos

Estas instruções irão ajudá-lo a obter uma cópia do projeto em execução na sua máquina local para fins de desenvolvimento e teste.

### Pré-requisitos

As coisas que você precisa para instalar o software e como instalá-las:

```bash
pip install -r requirements.txt
```

Instalando
Um passo a passo da série de exemplos que informam como obter um ambiente de desenvolvimento em funcionamento:

### Clonar o repositório:

```bash
git clone https://github.com/seuusuario/dataGPT.git

cd dataGPT
```

### Instalar as dependências:

```bash
pip install -r requirements.txt
```

### Configuração do Ambiente

Criar um arquivo config.py com as configurações necessárias, incluindo a chave da API e a rede neural selecionada:

```bash
# config.py
API_KEY = 'sua_chave_api_aqui'
NEURAL_NETWORK = 'rede_neural_selecionada'
```

### Uso

#### Versão Melhorada (Recomendada)

Para executar a versão melhorada da aplicação:

```bash
# Usando o script de inicialização (recomendado)
python run_app.py

# Ou diretamente com Streamlit
streamlit run app_improved.py
```

#### Versão Original

Para executar a versão original:

```bash
streamlit run app.py
```

#### Script de Inicialização

O script `run_app.py` oferece várias opções:

```bash
# Verificar dependências e configuração
python run_app.py --check-only

# Instalar dependências automaticamente
python run_app.py --install

# Executar testes
python run_app.py --test

# Usar versão original
python run_app.py --use-original

# Especificar porta personalizada
python run_app.py --port 8502
```

Abra o navegador e acesse http://localhost:8501.

### Como usar:

Insira o link do arquivo Google Sheets compartilhado:

Cole o link do arquivo no campo apropriado na barra lateral.
Selecione as colunas para os eixos X e Y do gráfico:

Escolha as colunas desejadas nos menus suspensos.
Personalize o gráfico:

Selecione o tipo de gráfico (Linha, Barra, Dispersão, etc.).
Opte por mostrar ou não os totais acima das colunas.
Defina o título do gráfico e os rótulos dos eixos.
Escolha a cor desejada para o gráfico.
Visualize os dados carregados e o gráfico gerado:

Veja uma prévia dos dados carregados e do gráfico na interface principal.
Baixe o gráfico gerado como um arquivo HTML:

Clique no botão de download para obter o gráfico em formato HTML.
Análise de dados com IA:

Clique no botão "Analisar Dados com IA" para enviar os dados e o gráfico para análise.

### Usando a Imagem Docker

Você pode utilizar a imagem Docker dataGPT disponibilizada no GitHub Container Registry para rodar a aplicação em qualquer ambiente que suporte Docker. Siga as instruções abaixo para autenticar, puxar e executar a imagem.

### Passos
Autenticação no GitHub Container Registry

Primeiro, você precisa se autenticar no GitHub Container Registry. Utilize seu Personal Access Token (PAT) do GitHub.

```bash
echo YOUR_GITHUB_PAT | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

Substitua YOUR_GITHUB_PAT pelo token que você gerou e YOUR_GITHUB_USERNAME pelo seu nome de usuário do GitHub.

### Puxar a Imagem Docker

Utilize o comando docker pull para puxar a imagem do GitHub Container Registry.

```bash
docker pull ghcr.io/m2f0/datagpt:latest
```
### Executar a Imagem Docker

Depois de puxar a imagem, você pode executá-la como um container Docker

```bash
docker run -p 8501:8501 ghcr.io/m2f0/datagpt:latest
```

Isso irá mapear a porta 8501 do host para a porta 8501 do container, permitindo que você acesse a aplicação no seu navegador em http://localhost:8501.

- Construído Usando
Streamlit - Framework
- Plotly - Biblioteca de Gráficos
- Pandas - Biblioteca de Análise de Dados
- Python - Linguagem de Programação
- Matplotlib - Biblioteca de Gráficos
- Seaborn - Biblioteca de Gráficos

### TODO

Adicionar mais tipos de gráficos
Melhorar a interface de usuário
Implementar autenticação de usuário
Contribuindo
Por favor, leia nosso Guia de Contribuição para detalhes sobre nosso código de conduta e o processo para enviar pull requests para nós.

### Autores
@m2f0 - Ideia & Trabalho inicial

### Agradecimentos
Streamlit

Plotly

Pandas

GitHub
