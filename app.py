from flask import Flask, request, render_template, jsonify, send_from_directory, redirect, url_for
from werkzeug.utils import secure_filename
from shapely.geometry import Polygon
import os
import fitz  # PyMuPDF

app = Flask(__name__)

# === Configs Gerais ===
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# === Fnc Auxiliares ===

def is_allowed_file(filename_raw):
    """Verifica se a extensao do arquivo é permitida (PDF)."""
    return '.' in filename_raw and filename_raw.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def extract_text_from_polygon(pdf_path, polygon_points):
    """Recebe o caminho do PDF e coordenadas normalizadas do poligono, retorna lista de textos por pag."""
    doc = fitz.open(pdf_path)
    extracted = []

    for page in doc:
        # Converte pontos normalizados p/ coords reais da pag
        scaled_pts = [
            fitz.Point(pt['x'] * page.rect.width, pt['y'] * page.rect.height)
            for pt in polygon_points
        ]

        if len(scaled_pts) < 3:
            extracted.append("[área inválida]")
            continue

        region_poly = Polygon([(pt.x, pt.y) for pt in scaled_pts]).buffer(1)
        words = page.get_text("words")

        matched = [
            word[4]
            for word in words
            if region_poly.intersects(
                Polygon([
                    (word[0], word[1]),
                    (word[2], word[1]),
                    (word[2], word[3]),
                    (word[0], word[3])
                ])
            )
        ]

        extracted.append(" ".join(matched).strip() or "[sem texto]")

    return extracted


# === Rotas ===

@app.route('/')
def upload_page():
    """Pag inicial com o form de upload."""
    return render_template('upload.html')


@app.route('/upload', methods=['POST'])
def handle_upload():
    if 'pdf_file' not in request.files:
        return redirect(url_for('upload_page', error='Nenhum arquivo enviado'))

    uploaded_file = request.files['pdf_file']

    if uploaded_file.filename == '':
        return redirect(url_for('upload_page', error='Nenhum arquivo selecionado'))

    if not is_allowed_file(uploaded_file.filename):
        return redirect(url_for('upload_page', error='Arquivo inválido. Envie um PDF'))

    safe_filename = secure_filename(uploaded_file.filename)
    full_path = os.path.join(app.config['UPLOAD_FOLDER'], safe_filename)
    uploaded_file.save(full_path)

    return redirect(url_for('view_pdf', filename=safe_filename))


@app.route('/uploads/<path:filename>')
def serve_pdf(filename):
    """leitura  do arquivo"""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


@app.route('/view')
def view_pdf():
    filename = request.args.get('filename')
    if not filename or not os.path.exists(os.path.join(UPLOAD_FOLDER, filename)):
        return redirect(url_for('upload_page', error='Arquivo não encontrado'))

    return render_template('view.html', filename=filename)


@app.route('/extract', methods=['POST'])
def extract_text():
    """fnc de  extracao. Recebe o poligono e arquivo e retorna em json os textos extraidos """
    try:
        data = request.get_json()
        polygon = data['polygon']
        filename = data['filename']

        pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        result = extract_text_from_polygon(pdf_path, polygon)

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)