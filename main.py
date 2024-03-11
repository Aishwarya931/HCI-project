from flask import Flask, jsonify, request, send_from_directory
import os
from pitchModulation import pitch_shift
from timeModulation import time_stretch
from noiseCancellation import reduce_noise  # Make sure to import your noise reduction function correctly
from werkzeug.utils import secure_filename
from convertToWav import convertToWav
from pytube import YouTube  # Import YouTube from pytube



app = Flask(__name__)  # Corrected
UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PROCESSED_FOLDER'] = PROCESSED_FOLDER

@app.route('/upload', methods=['POST'])
def upload_audio():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    filename = secure_filename(file.filename)
    original_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(original_path)

    # Convert to WAV for processing
    wav_path = os.path.splitext(original_path)[0] + '.wav'
    convertToWav(original_path, wav_path)

    # Apply noise reduction
    processed_filename = 'noise_reduced_' + os.path.basename(wav_path)
    processed_path = os.path.join(app.config['PROCESSED_FOLDER'], processed_filename)
    reduce_noise(wav_path, processed_path)

    return send_from_directory(app.config['PROCESSED_FOLDER'], processed_filename, as_attachment=True)


def download_youtube_audio(youtube_url, save_path):
    yt = YouTube(youtube_url)
    audio_stream = yt.streams.get_audio_only()
    default_filename = audio_stream.default_filename
    audio_stream.download(output_path=save_path)
    return os.path.join(save_path, default_filename)

@app.route('/process_youtube_audio', methods=['POST'])
def process_youtube_audio():
    data = request.json
    youtube_url = data.get('youtube_url')
    n_steps = data.get('n_steps', 0)  # Pitch shift steps, 0 means no shift
    rate = data.get('rate', 1.0)  # Time stretch rate, 1 means no stretch
    if not youtube_url:
        return jsonify({'error': 'YouTube URL is missing'}), 400

    # Download the audio
    original_path = download_youtube_audio(youtube_url, app.config['UPLOAD_FOLDER'])

    # Convert to WAV for processing
    wav_path = os.path.splitext(original_path)[0] + '.wav'
    convertToWav(original_path, wav_path)

    # Apply noise reduction
    noise_reduced_path = os.path.join(app.config['PROCESSED_FOLDER'], 'noise_reduced_' + secure_filename(wav_path))
    reduce_noise(wav_path, noise_reduced_path)

    # Apply pitch shift if n_steps is not 0
    if n_steps != 0:
        pitch_shifted_path = os.path.join(app.config['PROCESSED_FOLDER'], 'pitch_shifted_' + secure_filename(wav_path))
        pitch_shift(noise_reduced_path, n_steps, pitch_shifted_path)
    else:
        pitch_shifted_path = noise_reduced_path

    # Apply time stretch if rate is not 1.0
    if rate != 1.0:
        time_stretched_path = os.path.join(app.config['PROCESSED_FOLDER'], 'time_stretched_' + secure_filename(wav_path))
        time_stretch(pitch_shifted_path, rate, time_stretched_path)
    else:
        time_stretched_path = pitch_shifted_path

    return send_from_directory(app.config['PROCESSED_FOLDER'], os.path.basename(time_stretched_path), as_attachment=True)

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
        n_steps = float(request.form['n_steps'])
    except ValueError:
        return jsonify({"error": "n_steps must be an float"}), 400

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

@app.route('/time_stretch', methods=['POST'])
def handle_time_stretch():
    if 'file' not in request.files or 'rate' not in request.form:
        return 'Missing file or rate parameter', 400
    file = request.files['file']
    rate = request.form['rate']
    if file.filename == "":
        return 'No selected file', 400

    filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(filepath)

    output_path = os.path.join(app.config['PROCESSED_FOLDER'], 'time_stretched_' + file.filename)
    time_stretch(filepath, float(rate), output_path)

    return send_from_directory(app.config['PROCESSED_FOLDER'], 'time_stretched_' + file.filename, as_attachment=True)


if __name__ == '__main__':
    app.run(debug=True, port=8080)