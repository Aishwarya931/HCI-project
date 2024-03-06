import librosa
import soundfile as sf
from convertToWav import convertToWav

def time_stretch(audio_path, rate, output_path):
    # USING CONVERTTOWAV:
    # Convert te audio to WAV using convertToWav
    wav_path = convertToWav(audio_path, "temp.wav")

    # # Load the audio file
    # y, sr = librosa.load(wav_path, sr=None)

    y, sr = librosa.load(audio_path, sr=None)

    # Stretch the time
    y_stretched = librosa.effects.time_stretch(y, rate=rate)

    # Save the time-stretched audio
    sf.write(output_path, y_stretched, sr)
