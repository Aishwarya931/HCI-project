import librosa
import soundfile as sf
def noise_cancel(audio_path, output_path):
    y, sr = librosa.load(audio_path)
    y_reduced = nr.reduce_noise(y=y, sr=sr)
    sf.write(output_path, y_reduced, sr)