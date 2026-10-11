import os
import time

from dotenv import load_dotenv
from google import genai

load_dotenv()

# These text models have a Gemini API free tier. Reject paid-only overrides.
FREE_TIER_MODELS = frozenset({"gemini-3.6-flash", "gemini-3.5-flash-lite"})

def free_tier_model(setting: str, default: str) -> str:
    requested = os.getenv(setting, default)
    return requested if requested in FREE_TIER_MODELS else default

PRIMARY_MODEL = free_tier_model("GEMINI_PRIMARY_MODEL", "gemini-3.6-flash")
FALLBACK_MODEL = free_tier_model("GEMINI_FALLBACK_MODEL", "gemini-3.5-flash-lite")
DOCUMENT_MODEL = free_tier_model("GEMINI_DOCUMENT_MODEL", "gemini-3.5-flash-lite")
MAX_ATTEMPTS_PER_MODEL = 2

gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def generate_ai_response(prompt: str) -> str:
    """Generate a recommendation with retry and a lower-cost fallback model."""
    last_error = None

    for model in (PRIMARY_MODEL, FALLBACK_MODEL):
        for attempt in range(MAX_ATTEMPTS_PER_MODEL):
            try:
                response = gemini_client.models.generate_content(
                    model=model,
                    contents=prompt,
                )
                if response.text:
                    return response.text.strip()
                last_error = RuntimeError("Gemini returned an empty recommendation.")
            except Exception as error:
                last_error = error
                print(
                    f"Gemini model {model} failed "
                    f"(attempt {attempt + 1}/{MAX_ATTEMPTS_PER_MODEL}): {error}"
                )

            if attempt < MAX_ATTEMPTS_PER_MODEL - 1:
                time.sleep(2 ** attempt)

    raise RuntimeError(
        "AI recommendations are temporarily unavailable. Please try again shortly."
    ) from last_error


def build_action_plan_prompt(
    company_name: str,
    industry: str,
    scope1: float,
    scope2: float,
    scope3: float,
) -> str:
    return f"""
You are CarbonAI, an expert sustainability advisor. Create a concise but
substantive, industry-specific carbon reduction plan.

Company: {company_name}
Industry: {industry}
Scope 1 emissions: {scope1} tCO2e
Scope 2 emissions: {scope2} tCO2e
Scope 3 emissions: {scope3} tCO2e

Return ONLY valid JSON — no Markdown, code fences, or commentary — using this
exact shape:
{{
  "executive_summary": "2-3 sentence, specific interpretation of this emissions profile.",
  "top_priority": {{
    "title": "Most important opportunity",
    "why_now": "Why this should be addressed first."
  }},
  "actions": [
    {{
      "title": "Specific action",
      "priority": "High, Medium, or Low",
      "timeframe": "e.g. 0-90 days",
      "expected_impact": "A realistic qualitative or quantified reduction outcome",
      "why_it_matters": "A concise business and emissions rationale",
      "steps": ["Concrete first step", "Concrete second step", "Concrete third step"]
    }}
  ],
  "measurement": "One sentence describing the KPI and review cadence."
}}

Provide exactly 4 actions. Make each action actionable, measurable, relevant to
the reported scopes and industry, and useful to a business decision-maker.
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


def generate_document_response(prompt: str) -> str:
    """Try both cloud models, validate JSON, and log safe failure metadata."""
    import json
    import logging
    from google.genai import types
    schema = {
        "type": "object",
        "properties": {"records": {"type": "array", "items": {
            "type": "object",
            "properties": {
                "field": {"type": "string", "enum": ["electricity", "naturalGas", "petrol", "diesel", "flights", "hotels", "commuting", "waste"]},
                "quantity": {"type": "number"}, "unit": {"type": "string"},
                "line_id": {"type": "integer"}, "period": {"type": "string"},
            },
            "required": ["field", "quantity", "unit", "line_id", "period"],
        }}},
        "required": ["records"],
    }
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"), http_options=types.HttpOptions(timeout=25000, retry_options=types.HttpRetryOptions(attempts=1)))
    try:
        for model in dict.fromkeys((DOCUMENT_MODEL, PRIMARY_MODEL, FALLBACK_MODEL)):
            try:
                response = client.models.generate_content(
                    model=model, contents=prompt,
                    config=types.GenerateContentConfig(response_mime_type="application/json", response_json_schema=schema, max_output_tokens=8000),
                )
                if not response.text:
                    raise ValueError("Empty cloud response")
                parsed = json.loads(response.text)
                if not isinstance(parsed, dict) or not isinstance(parsed.get("records"), list):
                    raise ValueError("Invalid extraction response shape")
                logging.getLogger(__name__).info("Document cloud extraction succeeded model=%s", model)
                return response.text
            except Exception as error:
                # Never log prompts, uploaded text, credentials, or raw provider payloads.
                logging.getLogger(__name__).warning(
                    "Document cloud extraction failed model=%s error_type=%s status=%s",
                    model, type(error).__name__, getattr(error, "code", None),
                )
        raise RuntimeError("Both cloud extraction models failed")
    finally:
        client.close()
