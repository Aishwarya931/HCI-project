from flask import Flask, jsonify, request, send_from_directory
import os
from pitchModulation import pitch_shift
from timeModulation import time_stretch
from noiseCancellation import reduce_noise  # Make sure to import your noise reduction function correctly
from werkzeug.utils import secure_filename
from convertToWav import convertToWav
from pairaudio import pair_audio_files
from pytube import YouTube  # Import YouTube from pytube
from flask import Flask
from flask_cors import CORS, cross_origin
from pydub import AudioSegment

app = Flask(__name__)

# Enable CORS for all domains on all routes
CORS(app)



app = Flask(__name__)  # Corrected
UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PROCESSED_FOLDER'] = PROCESSED_FOLDER

@app.route('/upload', methods=['POST'])
def upload_audio():
    # print(request.files,)
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    filename = secure_filename(file.filename)
    original_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(original_path)
    # Respond with a message indicating a successful upload
    
    return jsonify({"message": "File uploaded successfully", "filename": filename})

@app.route('/noise_cancellation', methods=['POST'])
def apply_noise_cancellation():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    # Secure the filename before saving it
    filename = secure_filename(file.filename)
    original_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(original_path)

    # Convert to WAV for processing, if not already a WAV file
    if not filename.endswith('.wav'):
        wav_path = os.path.splitext(original_path)[0] + '.wav'
        convertToWav(original_path, wav_path)  # Assuming convertToWav can handle conversion from any format to WAV
    else:
        wav_path = original_path

    # Apply noise reduction
    processed_filename = 'noise_reduced_' + os.path.basename(wav_path)
    processed_path = os.path.join(app.config['PROCESSED_FOLDER'], processed_filename)
    reduce_noise(wav_path, processed_path)

    # Convert to MP3
    mp3_filename = processed_filename.replace('.wav', '.mp3')
    mp3_path = os.path.join(app.config['PROCESSED_FOLDER'], mp3_filename)
    audio = AudioSegment.from_wav(processed_path)
    audio.export(mp3_path, format="mp3")

    return send_from_directory(app.config['PROCESSED_FOLDER'], mp3_filename, as_attachment=True)



def download_youtube_audio(youtube_url, save_path):
    yt = YouTube(youtube_url)
    audio_stream = yt.streams.get_audio_only()
    default_filename = audio_stream.default_filename
    audio_stream.download(output_path=save_path)
    return os.path.join(save_path, default_filename)

@app.route('/process_youtube_audio', methods=['POST'])
def process_youtube_audio():
    data = request.json
    print(data)
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

    # Convert to MP3
    mp3_path = os.path.join(app.config['PROCESSED_FOLDER'], 'processed_audio.mp3')
    audio = AudioSegment.from_wav(time_stretched_path)
    audio.export(mp3_path, format="mp3")

    return send_from_directory(app.config['PROCESSED_FOLDER'], os.path.basename(mp3_path), as_attachment=True)

# @app.route('/modify_audio', methods=['POST'])
# def modify_audio():
#     # Check if a file is in the request
#     if 'file' not in request.files:
#         return jsonify({"error": "No file part"}), 400

#     # Retrieve the file
#     file = request.files['file']
#     if file.filename == '':
#         return jsonify({"error": "No selected file"}), 400
    
#     # Secure the filename and save the original file
#     filename = secure_filename(file.filename)
#     original_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
#     file.save(original_path)

#     # Get modification parameters from the request
#     n_steps = request.form.get('n_steps', type=float, default=0.0)  # Pitch shift steps
#     rate = request.form.get('rate', type=float, default=1.0)  # Time stretch rate

#     # Convert to WAV for processing
#     wav_path = os.path.splitext(original_path)[0] + '.wav'
#     convertToWav(original_path, wav_path)  # This function needs to be implemented

#     # Perform pitch shift if n_steps is not 0
#     if n_steps:
#         pitch_shifted_path = os.path.join(app.config['PROCESSED_FOLDER'], 'pitch_shifted_' + os.path.basename(wav_path))
#         pitch_shift(wav_path, n_steps, pitch_shifted_path)  # This function needs to be implemented

#     # Perform time stretch if rate is not 1.0
#     if rate != 1.0:
#         time_stretched_path = os.path.join(app.config['PROCESSED_FOLDER'], 'time_stretched_' + os.path.basename(wav_path))
#         time_stretch(wav_path, rate, time_stretched_path)  # This function needs to be implemented

#     # Determine which processed file to return
#     processed_path = time_stretched_path if rate != 1.0 else pitch_shifted_path if n_steps else wav_path

#     # Return the modified audio file
#     return send_from_directory(app.config['PROCESSED_FOLDER'], os.path.basename(processed_path), as_attachment=True)


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

@app.route('/pair_audio', methods=['POST'])
def pair_audio():
    data = request.json
    pitch_path = data.get('pitch_path')
    time_path = data.get('time_path')
    noise_path = data.get('noise_path')
    
    if not all([pitch_path, time_path, noise_path]):
        return jsonify({'error': 'Missing file paths'}), 400

    output_filename = 'paired_audio.wav'
    output_path = os.path.join(app.config['PROCESSED_FOLDER'], output_filename)
    
    # Call the pairing function
    pair_audio_files(pitch_path, time_path, noise_path, output_path)
    
    return send_from_directory(app.config['PROCESSED_FOLDER'], output_filename, as_attachment=True)


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8086)
