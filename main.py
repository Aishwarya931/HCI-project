from flask import Flask, jsonify, request, send_from_directory
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
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    # If the user does not select a file, the browser submits an
    # empty part without a filename.
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if 'n_steps' not in request.form:
        return jsonify({"error": "n_steps parameter is missing"}), 400
    
    try:
        n_steps = int(request.form['n_steps'])
    except ValueError:
        return jsonify({"error": "n_steps must be an integer"}), 400

    # Secure the filename before saving it
    # filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(filepath)
    
    output_filename = 'pitch_shifted_' + file.filename
    output_path = os.path.join(app.config['PROCESSED_FOLDER'], output_filename)
    
    # Call the pitch_shift function from pitchModulation.py
    try:
        pitch_shift(filepath, n_steps, output_path)
    except Exception as e:
        # Handle errors in pitch shifting process
        return jsonify({"error": "Error processing file", "details": str(e)}), 500
    
    # Return the processed file or a success message
    return send_from_directory(app.config['PROCESSED_FOLDER'], output_filename, as_attachment=True)

@app.route('/timestretch', methods=['POST'])
def handle_time_stretch():
    if 'file' not in request.files or 'rate' not in request.form:
        return 'Missing file or rate parameter', 400
    file = request.files['file']
    rate = request.form['rate']
    if file.filename == "":
        return 'No selected file', 400

    filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(filepath)

    output_path = os.path.join(app.config['PROCESSED_FOLDER'], 'time_stretched' + file.filename)
    time_stretch(filepath, float(rate), output_path)

    return send_from_directory(app.config['PROCESSED_FOLDER'], 'time_stretched' + file.filename, as_attachment=True)

@app.route('/noisecancel', methods=['POST'])
def handle_noise_cancel():
    if 'file' not in request.files:
        return 'Missing file', 400
    file = request.files['file']
    if file.filename == "":
        return 'No selected file', 400

    filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(filepath)

    output_path = os.path.join(app.config['PROCESSED_FOLDER'], 'noise_cancelled' + file.filename)
    noise_cancel(filepath, output_path)

    return send_from_directory(app.config['PROCESSED_FOLDER'], 'noise_cancelled' + file.filename, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True, port=8080)
