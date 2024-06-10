# audio_handler.py

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
        self.is_recording = False

    def start_or_stop_recording(self):
        self.is_recording = not self.is_recording
        if self.is_recording:
            print("Starting recording")
            self.audio_data = []
        else:
            print("Stopping recording")
        return self.is_recording

    def save_recording(self):
        print("Saving the recording...")
        if "temp.wav" in os.listdir():
            os.remove("temp.wav")
        wav_file = wave.open("test.wav", 'wb')
        wav_file.setnchannels(self.channels)
        wav_file.setsampwidth(2)
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
        if self.is_recording:
            self.audio_data.extend(indata.copy())
