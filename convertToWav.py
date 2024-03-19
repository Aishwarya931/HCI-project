from pydub import AudioSegment

def convertToWav(audio_path, output_path):
    audio = AudioSegment.from_file(audio_path)
    audio.export(output_path, format="wav")