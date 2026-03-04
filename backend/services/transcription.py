import os
from openai import OpenAI


def transcribe_audio(audio_file) -> str:
    """
    Sends an audio file to OpenAI Whisper API and returns transcribed text.

    Django's InMemoryUploadedFile must be converted to a named tuple
    that OpenAI SDK understands — (filename, bytes, content_type).

    Args:
        audio_file: InMemoryUploadedFile from Django request.FILES

    Returns:
        Transcribed text as string.
    """
    client = OpenAI(api_key=os.getenv('TRANSCRIPTION_API_KEY'))

    # Read raw bytes from Django's file wrapper
    # Then pass as tuple: (filename, bytes, content_type)
    # This is exactly what OpenAI SDK expects
    file_payload = (
        audio_file.name,
        audio_file.read(),
        audio_file.content_type
    )

    transcription = client.audio.transcriptions.create(
        model='whisper-1',
        file=file_payload,
        response_format='text'
    )

    return transcription