from flash import Flask, request, sendfromdirectory
import os
from pitchModulation import pitch_shift
from timeModulation import time_stretch
from noiseCancellation import noise_cancel

app = Flask(__name)
UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'
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
    time_stretch(file, float(rate), output_path)
    return send_from_directory(app.config['PROCESSED_FOLDER'], file.filename)

if __name == '__main':
    app.run(debug=True)