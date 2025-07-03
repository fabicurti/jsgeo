markdown
# JSGeo PDF Extractor

Este é um projeto Flask + JavaScript para visualização e extração de texto de arquivos PDF com seleção por polígono.

## 🔧 Tecnologias utilizadas

- Flask (Python)
- PyMuPDF (`fitz`) para leitura de PDFs
- Shapely para interseção geométrica
- PDF.js para renderização no navegador
- Alpine.js para reatividade
- Bootstrap 5 para layout

## 🚀 Como rodar localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/fabicurti/jsgeo.git
   cd jsgeo
   
2. Crie um ambiente virtual (opcional, mas recomendado):
   ```bash
    python -m venv venv
    source venv/bin/activate  # ou venv\Scripts\activate no Windows   

3. Instale as dependências:
   ```bash
    pip install -r requirements.txt
   
4. Rode o servidor:
   ```bash
    python app.py

5. Acesse no navegador:
http://127.0.0.1:5000



## 📂 Estrutura
app.py: backend Flask

templates/: HTMLs com Jinja2

static/js/view.js: lógica de visualização e extração

uploads/: onde os PDFs enviados são salvos


## ✨ Funcionalidades
Upload de arquivos PDF

Visualização com navegação entre páginas

Seleção de área com clique (polígono)

Extração de texto da área selecionada

Layout responsivo com Bootstrap


## 📄 Licença
Este projeto é apenas para fins de teste e demonstração.
