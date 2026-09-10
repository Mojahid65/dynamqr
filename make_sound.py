import wave
import struct
import math
import os

def generate_chime():
    sample_rate = 44100
    duration = 0.6
    # A pleasant major chord arpeggio
    freqs = [440.0, 554.37, 659.25] # A4, C#5, E5
    num_samples = int(sample_rate * duration)
    
    audio = []
    for i in range(num_samples):
        t = float(i) / sample_rate
        env = math.exp(-5.0 * t) # quick decay
        
        val = 0
        for f in freqs:
            val += math.sin(2 * math.pi * f * t)
        val = (val / len(freqs)) * env * 0.8
        audio.append(val)
        
    os.makedirs('mobile_app/android/app/src/main/res/raw', exist_ok=True)
    with wave.open('mobile_app/android/app/src/main/res/raw/notification.wav', 'w') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        for val in audio:
            packed_val = struct.pack('h', int(val * 32767.0))
            wav_file.writeframes(packed_val)

if __name__ == '__main__':
    generate_chime()
    print("Generated notification.wav")
