# Import libraries for pitch modulation
import librosa
import soundfile as sf

def pitch_shift(audio_path, n_steps, output_path):
    y, sr = librosa.load(audio_path)
    y_shifted = librosa.effects.pitch_shift(y, sr, n_steps=n_steps)
    sf.write(output_path, y_shifted, sr)