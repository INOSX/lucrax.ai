import os
import io
import threading
from queue import Queue
from gtts import gTTS
import sounddevice as sd
import soundfile as sf
from pydub import AudioSegment
from pydub.playback import play
from langchain_openai import ChatOpenAI
from config import OPENAI_API_KEY

class TalkingLLM():
    def __init__(self, model="gpt-3.5-turbo-0613"):
        print("Inicializando TalkingLLM")
        self.llm = ChatOpenAI(model=model, openai_api_key=OPENAI_API_KEY)
        self.llm_queue = Queue()
        self.run()

    def convert_and_play(self):
        print("Iniciando thread de conversão e reprodução de áudio")
        while True:
            tts_text = self.llm_queue.get()
            print("Texto recebido para TTS:", tts_text)  # Debugging

            if tts_text:
                print("Iniciando TTS para:", tts_text)
                try:
                    tts = gTTS(text=tts_text, lang='pt')
                    with io.BytesIO() as buffer:
                        tts.write_to_fp(buffer)
                        buffer.seek(0)
                        audio = AudioSegment.from_file(buffer, format="mp3")
                        
                        # Ajustar a velocidade de leitura
                        playback_speed = 1.5  # Aumente este valor para aumentar a velocidade
                        audio = audio.speedup(playback_speed=playback_speed)

                        # Salvar áudio temporário para reprodução
                        temp_audio_path = "temp_audio.wav"
                        audio.export(temp_audio_path, format="wav")

                        # Reproduzir áudio
                        print("Reproduzindo áudio")
                        play(audio)
                        os.remove(temp_audio_path)
                except Exception as e:
                    print("Erro ao gerar TTS:", e)

    def run(self):
        print("Iniciando thread principal")
        t1 = threading.Thread(target=self.convert_and_play)
        t1.start()
