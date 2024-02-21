import librosa
import soundfile as sf

def time_stretch(audio_path, rate, output_path):
    y, sr = librosa.load(audio_path)
    y_stretched = librosa.effects.time_stretch(y, rate)
    sf.write(output_path, y_stretched, sr)