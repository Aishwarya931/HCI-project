import librosa
import soundfile as sf
import noisereduce as nr

def reduce_noise(input_path, output_path):
    # Load audio
    y, sr = librosa.load(input_path, sr=None)
    # Apply noise reduction
    reduced_noise = nr.reduce_noise(y=y, sr=sr)
    # Save output
    sf.write(output_path, reduced_noise, sr)
