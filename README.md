dataGPT para o Google Drive
===========================

Status: [![Status](https://img.shields.io/badge/status-active-success.svg)]()
GitHub Issues: [![GitHub Issues](https://img.shields.io/github/issues/seuusuario/dataGPT.svg)](https://github.com/seuusuario/dataGPT/issues)
GitHub Pull Requests: [![GitHub Pull Requests](https://img.shields.io/github/issues-pr/seuusuario/dataGPT.svg)](https://github.com/seuusuario/dataGPT/pulls)
License: [![License](https://img.shields.io/badge/license-MIT-blue.svg)](/LICENSE)

Uma aplicação para visualizar dados do Google Sheets compartilhados via Google Drive.

Tabela de Conteúdos
-------------------

- Sobre
- Primeiros Passos
- Deployment
- Uso
- Construído Usando
- TODO
- Contribuindo
- Autores
- Agradecimentos

Sobre
-----

O dataGPT para o Google Drive permite visualizar dados compartilhados via Google Drive. Você pode inserir um link de compartilhamento de um arquivo Google Sheets, escolher as colunas para os eixos X e Y de um gráfico, e visualizar os dados e o gráfico interativamente.

Primeiros Passos
----------------

Estas instruções irão ajudá-lo a obter uma cópia do projeto em execução na sua máquina local para fins de desenvolvimento e teste. Consulte a seção "Deployment" para notas sobre como implantar o projeto em um sistema ao vivo.

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

Criar um arquivo `config.py` com as configurações necessárias, incluindo a chave da API e a rede neural selecionada:

```python
# config.py
API_KEY = 'sua_chave_api_aqui'
NEURAL_NETWORK = 'rede_neural_selecionada'
```

Uso
---

Para executar a aplicação, use o seguinte comando:

```sh
streamlit run app.py
```

Abra o navegador e acesse `http://localhost:8501`.

Deployment
----------

Para implantar este projeto, siga as etapas abaixo.

### Configuração do Nginx

1. Instale o Nginx:

```sh
sudo apt update
sudo apt install nginx -y
```

2. Configure o Nginx:

```sh
sudo nano /etc/nginx/sites-available/dataGPT
```

Adicione a seguinte configuração:

```
server {
    listen 80;
    server_name free.datagpt.com.br;

    # Redireciona todas as solicitações HTTP para HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name free.datagpt.com.br;

    ssl_certificate /etc/letsencrypt/live/free.datagpt.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/free.datagpt.com.br/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://127.0.0.1:8501;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

3. Ative a configuração do Nginx:

```sh
sudo ln -s /etc/nginx/sites-available/dataGPT /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Configuração do Serviço Systemd

Crie um serviço systemd para garantir que a aplicação inicie automaticamente:

```sh
sudo nano /etc/systemd/system/datagpt.service
```

Adicione o seguinte conteúdo:

```
[Unit]
Description=Streamlit instance to serve dataGPT
After=network.target

[Service]
User=datagpt_user
Group=www-data
WorkingDirectory=/opt/dataGPT
ExecStart=/usr/local/bin/streamlit run /opt/dataGPT/app.py --server.port 8501 --server.address 0.0.0.0

[Install]
WantedBy=multi-user.target
```

Recarregue o systemd e inicie o serviço:

```sh
sudo systemctl daemon-reload
sudo systemctl start datagpt
sudo systemctl enable datagpt
```

Construído Usando
-----------------

- [Streamlit](https://streamlit.io/) - Framework
- [Plotly](https://plotly.com/python/) - Biblioteca de Gráficos
- [Pandas](https://pandas.pydata.org/) - Biblioteca de Análise de Dados
- [Python](https://www.python.org/) - Linguagem de Programação

Autores
-------

- [@m2f0](https://github.com/m2f0) - Ideia & Trabalho inicial

Veja também a lista de [colaboradores](https://github.com/seuusuario/dataGPT/graphs/contributors) que participaram deste projeto.

Agradecimentos
--------------

- [Streamlit](https://streamlit.io/)
- [Plotly](https://plotly.com/)
- [Pandas](https://pandas.pydata.org/)
- [GitHub](https://github.com/)
```
