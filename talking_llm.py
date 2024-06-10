import os
import io
import threading
from queue import Queue
from gtts import gTTS
import sounddevice as sd
import soundfile as sf
from pydub import AudioSegment
from pydub.playback import play
import openai
from config import get_api_key

class TalkingLLM:
    def __init__(self, model="gpt-3.5-turbo-0613"):
        print("Inicializando TalkingLLM")
        self.api_key = get_api_key()
        if not self.api_key:
            raise ValueError("Chave API não configurada. Por favor, configure a chave API na barra lateral.")
        openai.api_key = self.api_key
        self.llm_queue = Queue()
        self.audio_playing = False
        self.run()

    def convert_and_play(self):
        print("Iniciando thread de conversão e reprodução de áudio")
        while True:
            tts_text = self.llm_queue.get()
            print("Texto recebido para TTS:", tts_text)

            if tts_text:
                print("Iniciando TTS para:", tts_text)
                try:
                    tts = gTTS(text=tts_text, lang='pt')
                    with io.BytesIO() as buffer:
                        tts.write_to_fp(buffer)
                        buffer.seek(0)
                        audio = AudioSegment.from_file(buffer, format="mp3")
                        
                        playback_speed = 1.3
                        audio = audio.speedup(playback_speed=playback_speed)

                        temp_audio_path = "temp_audio.wav"
                        audio.export(temp_audio_path, format="wav")

                        print("Reproduzindo áudio")
                        self.audio_playing = True
                        play(audio)
                        os.remove(temp_audio_path)
                        self.audio_playing = False
                    print("Áudio reproduzido com sucesso")
                except Exception as e:
                    print("Erro ao gerar TTS:", e)

    def run(self):
        print("Iniciando thread principal")
        t1 = threading.Thread(target=self.convert_and_play)
        t1.start()

    def play_audio(self):
        if not self.llm_queue.empty():
            self.convert_and_play()
        else:
            print("Nenhum áudio para reproduzir")

    def add_text_to_queue(self, text):
        self.llm_queue.put(text)

    def stop_audio(self):
        if self.audio_playing:
            sd.stop()
            self.audio_playing = False
            print("Áudio interrompido")
