import os
import io
import threading
from queue import Queue
from gtts import gTTS
import sounddevice as sd
import soundfile as sf
from pydub import AudioSegment
from pydub.playback import play

class TalkingLLM:
    def __init__(self):
        self.llm_queue = Queue()
        self.audio_thread = None
        self.stop_event = threading.Event()

    def add_text_to_queue(self, text):
        text = text.replace("**", "")  # Remove asteriscos duplos
        self.llm_queue.put(text)

    def convert_and_play_audio(self, text):
        print("Convertendo texto para áudio")
        tts = gTTS(text, lang='pt')
        with io.BytesIO() as buffer:
            tts.write_to_fp(buffer)
            buffer.seek(0)
            audio = AudioSegment.from_file(buffer, format="mp3")
            audio = audio.speedup(playback_speed=1.3)
            temp_audio_path = "temp_audio.wav"
            audio.export(temp_audio_path, format="wav")

        self.stop_event.clear()
        print("Áudio convertido e pronto para reprodução")
        self.play_audio(temp_audio_path)

    def play_audio(self, audio_path):
        self.audio_thread = threading.Thread(target=self._play_audio_thread, args=(audio_path,))
        self.audio_thread.start()

    def _play_audio_thread(self, audio_path):
        try:
            with sf.SoundFile(audio_path, 'r') as sound_file:
                data = sound_file.read(dtype='int16')
                sd.play(data, sound_file.samplerate)
                while sd.get_stream().active and not self.stop_event.is_set():
                    sd.sleep(100)
                sd.stop()
                os.remove(audio_path)
        except Exception as e:
            print(f"Erro ao reproduzir áudio: {e}")

    def stop_audio(self):
        self.stop_event.set()
        if self.audio_thread is not None:
            self.audio_thread.join()
        print("Reprodução de áudio parada")
