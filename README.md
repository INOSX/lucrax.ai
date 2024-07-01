
dataGPT Open Source
===================

Status: [![Status](https://img.shields.io/badge/status-active-success.svg)]()
GitHub Issues: [![GitHub Issues](https://img.shields.io/github/issues/seuusuario/dataGPT.svg)](https://github.com/seuusuario/dataGPT/issues)
GitHub Pull Requests: [![GitHub Pull Requests](https://img.shields.io/github/issues-pr/seuusuario/dataGPT.svg)](https://github.com/seuusuario/dataGPT/pulls)
License: [![License](https://img.shields.io/badge/license-MIT-blue.svg)](/LICENSE)

Uma aplicação open source para visualizar e analisar dados do Google Sheets compartilhados via Google Drive.

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

