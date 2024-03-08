import librosa
import soundfile as sf

def pitch_shift(audio_path, n_steps, output_path):
    # Load the audio file
    y, sr = librosa.load(audio_path, sr=48000)

    # Shift the pitch
    y_shifted = librosa.effects.pitch_shift(y, sr=sr, n_steps=n_steps)

    # Save the pitch-shifted audio
    sf.write(output_path, y_shifted, sr)

# Mono vs Stero
#