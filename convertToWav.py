from pydub import AudioSegment
from ffmpeg import input, output

def convertToWav(audio_path, output_path):
    # Load the given mp3 file
    mp3_file = AudioSegment.from_file(audio_path)

    # Perform the conversion
    wav_file = mp3_file.set_frame_rate(96000).set_channels(2)

    # Save the WAV file
    wav_file.export(output_path, format="wav")

    # Return the path to the converted WAV file
    return output_path