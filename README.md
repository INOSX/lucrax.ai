
dataGPT Open Source
===================

Status: [![Status](https://img.shields.io/badge/status-active-success.svg)]()
GitHub Issues: [![GitHub Issues](https://img.shields.io/github/issues/seuusuario/dataGPT.svg)](https://github.com/seuusuario/dataGPT/issues)
GitHub Pull Requests: [![GitHub Pull Requests](https://img.shields.io/github/issues-pr/seuusuario/dataGPT.svg)](https://github.com/seuusuario/dataGPT/pulls)
License: [![License](https://img.shields.io/badge/license-MIT-blue.svg)](/LICENSE)

Uma aplicação open source para visualizar e analisar dados do Google Sheets compartilhados via Google Drive.

## Lançamento da Nova Versão do dataGPT 2.3.8

Temos o prazer de anunciar o lançamento da versão 2.3.8 do dataGPT, nossa aplicação open source para visualização e análise de dados do Google Sheets compartilhados via Google Drive. Esta nova versão traz uma série de novos recursos e melhorias, além de correções de bugs importantes. 

### Novos Recursos

1. **Opção de Mostrar Totais nos Gráficos**
   - Agora é possível mostrar os totais acima das colunas e pontos em gráficos de barra, linha, dispersão e área. Esta funcionalidade permite uma visualização mais clara e imediata dos valores representados.

2. **Suporte a Novos Tipos de Gráficos**
   - Adicionamos suporte a novos tipos de gráficos, incluindo:
     - Histogramas
     - Boxplots
     - Heatmaps
     - Gráficos de violino

3. **Personalização Aprimorada de Gráficos**
   - **Escolha de Cores:** Agora é possível escolher a cor dos gráficos diretamente na interface do usuário.
   - **Labels Customizáveis:** Títulos e rótulos dos eixos podem ser personalizados para melhorar a clareza dos gráficos.

4. **Análise de Dados com IA**
   - **Integração com NNeural.io:** Melhoria na integração para enviar dados e gráficos para análise automática, proporcionando insights mais rápidos e precisos.

5. **Interface de Usuário Melhorada**
   - **Layout Responsivo:** Melhorias no layout para uma experiência de usuário mais fluida e responsiva.
   - **Novo Tema:** Implementação de um novo tema visual para tornar a aplicação mais atraente e fácil de usar.

### Bugs Corrigidos

1. **Correção de Bugs de Visualização**
   - **Correção na Exibição de Gráficos:** Corrigimos problemas onde gráficos não eram exibidos corretamente em determinadas condições.
   - **Ajuste na Renderização de Totais:** Correção de bugs que impediam a exibição correta dos totais nos gráficos.

2. **Melhorias na Carregamento de Dados**
   - **Correção na Leitura de Links do Google Drive:** Melhoramos a leitura e processamento de links de compartilhamento do Google Drive para evitar falhas de carregamento.
   - **Desempenho Aprimorado:** Otimização do processo de carregamento de dados, tornando a aplicação mais rápida e eficiente.

3. **Correções de Bugs na Integração com IA**
   - **Correção de Erros de Autenticação:** Solução de problemas de autenticação que impediam o envio de dados para análise pela NNeural.io.
   - **Melhoria no Tratamento de Erros:** Implementação de melhores mensagens de erro e tratamento de exceções para tornar a depuração mais fácil e eficaz.

Tabela de Conteúdos
-------------------

- [Sobre](#sobre)
- [Primeiros Passos](#primeiros-passos)
- [Uso](#uso)
- [Construído Usando](#construído-usando)
- [TODO](#todo)
- [Contribuindo](#contribuindo)
- [Autores](#autores)
- [Agradecimentos](#agradecimentos)

Sobre
-----

O dataGPT open source permite visualizar dados compartilhados via Google Drive. Você pode inserir um link de compartilhamento de um arquivo Google Sheets, escolher as colunas para os eixos X e Y de um gráfico, e visualizar os dados e o gráfico interativamente. Além disso, é possível utilizar inteligência artificial para analisar os gráficos gerados.

Primeiros Passos
----------------

Estas instruções irão ajudá-lo a obter uma cópia do projeto em execução na sua máquina local para fins de desenvolvimento e teste.

### Pré-requisitos

As coisas que você precisa para instalar o software e como instalá-las:

```bash
pip install -r requirements.txt
```

### Instalando

Um passo a passo da série de exemplos que informam como obter um ambiente de desenvolvimento em funcionamento:

Clonar o repositório:

```sh
git clone https://github.com/seuusuario/dataGPT.git
cd dataGPT
```

Instalar as dependências:

```sh
pip install -r requirements.txt
```

### Configuração do Ambiente

Criar um arquivo config.py com as configurações necessárias, incluindo a chave da API e a rede neural selecionada:

```python
# config.py
API_KEY = 'sua_chave_api_aqui'
NEURAL_NETWORK = 'rede_neural_selecionada'
```

Uso
----

Para executar a aplicação, use o seguinte comando:

```sh
streamlit run app.py
```

Abra o navegador e acesse [http://localhost:8501](http://localhost:8501).

### Como usar:

1. **Insira o link do arquivo Google Sheets compartilhado:**
   - Cole o link do arquivo no campo apropriado na barra lateral.
   
2. **Selecione as colunas para os eixos X e Y do gráfico:**
   - Escolha as colunas desejadas nos menus suspensos.

3. **Personalize o gráfico:**
   - Selecione o tipo de gráfico (Linha, Barra, Dispersão, etc.).
   - Opte por mostrar ou não os totais acima das colunas.
   - Defina o título do gráfico e os rótulos dos eixos.
   - Escolha a cor desejada para o gráfico.

4. **Visualize os dados carregados e o gráfico gerado:**
   - Veja uma prévia dos dados carregados e do gráfico na interface principal.

5. **Baixe o gráfico gerado como um arquivo HTML:**
   - Clique no botão de download para obter o gráfico em formato HTML.

6. **Análise de dados com IA:**
   - Clique no botão "Analisar Dados com IA" para enviar os dados e o gráfico para análise.

Construído Usando
-----------------

- [Streamlit](https://streamlit.io/) - Framework
- [Plotly](https://plotly.com/python/) - Biblioteca de Gráficos
- [Pandas](https://pandas.pydata.org/) - Biblioteca de Análise de Dados
- [Python](https://www.python.org/) - Linguagem de Programação

TODO
----

- Adicionar mais tipos de gráficos
- Melhorar a interface de usuário
- Implementar autenticação de usuário

Contribuindo
------------

Por favor, leia nosso Guia de Contribuição para detalhes sobre nosso código de conduta e o processo para enviar pull requests para nós.

Autores
-------

- [@m2f](https://github.com/m2f0) - Ideia & Trabalho inicial

Agradecimentos
--------------

- [Streamlit](https://streamlit.io/)
- [Plotly](https://plotly.com/python/)
- [Pandas](https://pandas.pydata.org/)
- [GitHub](https://www.python.org/)
