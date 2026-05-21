import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function transcribeAudio(buffer: Buffer, filename: string): Promise<string> {
  const file = new File([buffer as unknown as BlobPart], filename, {
    type: filename.endsWith('.wav') ? 'audio/wav' : 'audio/mpeg',
  });

  const transcription = await groq.audio.transcriptions.create({
    file,
    model: 'whisper-large-v3',
    response_format: 'text',
    language: 'en',
  });

  return transcription as unknown as string;
}
