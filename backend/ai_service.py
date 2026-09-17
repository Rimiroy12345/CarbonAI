import os

from dotenv import load_dotenv
from google import genai

load_dotenv()


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
def build_action_plan_prompt(
    company_name: str,
    industry: str,
    scope1: float,
    scope2: float,
    scope3: float,
) -> str:
    return f"""
You are CarbonAI, an AI sustainability advisor.

Analyze this company's carbon emissions and create a practical,
industry-specific carbon reduction action plan.

Company: {company_name}
Industry: {industry}

Scope 1 emissions: {scope1} tCO2e
Scope 2 emissions: {scope2} tCO2e
Scope 3 emissions: {scope3} tCO2e

Provide:
1. Key emission areas to address
2. Specific reduction actions
3. Priority of each action
4. Expected environmental impact
5. Short-term actions
6. Long-term actions

Keep the recommendations practical, measurable, and relevant to
the company's industry and reported emissions.
"""
def generate_action_plan(
    company_name: str,
    industry: str,
    scope1: float,
    scope2: float,
    scope3: float,
) -> str:
    prompt = build_action_plan_prompt(
        company_name=company_name,
        industry=industry,
        scope1=scope1,
        scope2=scope2,
        scope3=scope3,
    )

    return generate_ai_response(prompt)