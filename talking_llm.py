import os
import io
import threading
from gtts import gTTS
from pydub import AudioSegment
import sounddevice as sd
import soundfile as sf
from langchain_openai import ChatOpenAI
from config import OPENAI_API_KEY

class TalkingLLM:
    def __init__(self, model="gpt-4"):
        print("Inicializando TalkingLLM")
        self.llm = ChatOpenAI(model=model, openai_api_key=OPENAI_API_KEY)
        self.audio_data = None
        self.is_playing = False

    def convert_text_to_audio(self, text):
        print("Convertendo texto para áudio")
        try:
            text = text.replace('**', '')

            tts = gTTS(text=text, lang='pt')
            with io.BytesIO() as buffer:
                tts.write_to_fp(buffer)
                buffer.seek(0)
                audio = AudioSegment.from_file(buffer, format="mp3")

                playback_speed = 1.3
                audio = audio.speedup(playback_speed=playback_speed)

                temp_audio_path = "temp_audio.wav"
                audio.export(temp_audio_path, format="wav")

                with open(temp_audio_path, 'rb') as f:
                    self.audio_data = f.read()
                
                os.remove(temp_audio_path)
                print("Áudio convertido e pronto para reprodução")
        except Exception as e:
            print("Erro ao gerar TTS:", e)

    def play_audio(self):
        if self.audio_data:
            try:
                self.is_playing = True
                print("Tentando reproduzir o áudio")
                with io.BytesIO(self.audio_data) as buffer:
                    audio, samplerate = sf.read(buffer)
                    sd.play(audio, samplerate)
                    sd.wait()
                    print("Áudio reproduzido com sucesso")
                    self.is_playing = False
            except Exception as e:
                print("Erro ao reproduzir áudio:", e)
                self.is_playing = False
        else:
            print("Nenhum áudio para reproduzir")

    def stop_audio(self):
        if self.is_playing:
            print("Parando reprodução do áudio")
            sd.stop()
            self.is_playing = False
            print("Reprodução do áudio interrompida")
        else:
            print("Nenhuma reprodução em andamento")
