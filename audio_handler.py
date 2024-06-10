import sounddevice as sd
import wave
import os
import numpy as np
import soundfile as sf
import io

class AudioHandler:
    def __init__(self, samplerate=44100, channels=1, dtype='int16'):
        self.samplerate = samplerate
        self.channels = channels
        self.dtype = dtype
        self.audio_data = []

    def start_or_stop_recording(self, is_recording):
        if is_recording:
            return False
        else:
            print("Starting record")
            self.audio_data = []
            return True

    def save_recording(self):
        print("Saving the recording...")
        if "temp.wav" in os.listdir():
            os.remove("temp.wav")
        wav_file = wave.open("test.wav", 'wb')
        wav_file.setnchannels(self.channels)
        wav_file.setsampwidth(2)  # Corrigido para usar a largura de amostra para int16 diretamente
        wav_file.setframerate(self.samplerate)
        wav_file.writeframes(np.array(self.audio_data, dtype=self.dtype))
        wav_file.close()
        return "test.wav"

    def playback_audio(self, audio_data):
        buffer = io.BytesIO()
        buffer.write(audio_data)
        buffer.seek(0)

        with sf.SoundFile(buffer, 'r') as sound_file:
            data = sound_file.read(dtype='int16')
            sd.play(data, sound_file.samplerate)
            sd.wait()

    def callback(self, indata, frame_count, time_info, status):
        self.audio_data.extend(indata.copy())
