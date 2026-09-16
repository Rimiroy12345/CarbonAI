import os

from google import genai


GEMINI_MODEL = "gemini-3.8-flash"

gemini_client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


def generate_ai_response(prompt: str) -> str:
    """Generate a text response from Gemini for a CarbonAI prompt."""
    response = gemini_client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
    )

    return response.text.strip()