import os
from openai import OpenAI


def generate_title(content: str) -> str:
    """
    Generates a title for a note using GPT-4o-mini.

    Design decision: GPT-4o-mini over GPT-4 — same quality for short title generation
    """
    client = OpenAI(api_key=os.getenv('TRANSCRIPTION_API_KEY'))

    response = client.chat.completions.create(
        model='gpt-4o-mini',
        messages=[
            {
                'role': 'system',
                'content': (
                    'You are a note-taking assistant. '
                    'Generate a concise, elegant title for the given note content. '
                    'The title must be 3-5 words maximum. '
                    'Return ONLY the title — no quotes, no punctuation, no explanation.'
                )
            },
            {
                'role': 'user',
                'content': f'Generate a title for this note:\n\n{content[:500]}'
                # Limit to 500 chars
            }
        ],
        max_tokens=20,  # Titles are short
        temperature=0.7,  # Slight creativity without being random
    )

    return response.choices[0].message.content.strip()