from flask import Flask, request, send_from_directory
import os
from pitchModulation import pitch_shift
from timeModulation import time_stretch
from noiseCancellation import noise_cancel

app = Flask(__name__)  # Corrected
UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PROCESSED_FOLDER'] = PROCESSED_FOLDER

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return 'No file part'
    file = request.files['file']
    if file.filename == "":
        return 'No selected file'
    if file:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(filepath)
        return 'File uploaded successfully'

@app.route('/pitch_shift', methods=['POST'])
def handle_pitch_shift():
    file = request.files['file']
    n_steps = request.form['n_steps']
    output_path = os.path.join(app.config['PROCESSED_FOLDER'], file.filename)
    pitch_shift(filepath, int(n_steps), output_path)  # Corrected to use pitch_shift and filepath variable
    return send_from_directory(app.config['PROCESSED_FOLDER'], file.filename)

@app.route('/time_stretch', methods=['POST'])
def handle_time_stretch():
    file = request.files['file']
    rate = request.form['rate']
    output_path = os.path.join(app.config['PROCESSED_FOLDER'], file.filename)
    time_stretch(filepath, float(rate), output_path)  # Corrected to use the correct function and filepath variable
    return send_from_directory(app.config['PROCESSED_FOLDER'], file.filename)

if __name__ == '__main__':
    app.run(debug=True, port=8080)