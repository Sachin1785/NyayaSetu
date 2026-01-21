import os
import uvicorn
from fastapi import FastAPI, Form, BackgroundTasks
from twilio.rest import Client
from twilio.twiml.messaging_response import MessagingResponse
from google import genai
from google.genai import types
from dotenv import load_dotenv

# 1. Load Environment Variables (.env file)
load_dotenv()

# 2. Setup Credentials
TWILIO_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_NUMBER = os.getenv("TWILIO_NUMBER") # e.g., whatsapp:+14155238886
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# 3. Initialize Clients
app = FastAPI()
twilio_client = Client(TWILIO_SID, TWILIO_TOKEN)
genai_client = genai.Client(api_key=GEMINI_API_KEY)

def generate_legal_reply(user_query: str, sender_number: str):
    """Heavy AI logic handled in background to avoid Twilio timeout."""
    try:
        # Define your specific legal persona and rules
        system_prompt = """You are NyayaSetu, an expert Indian Legal Assistant. 
        Your goal is to provide precise, actionable legal advice.
        Rules:
        1. Answer in plain text. 
        2. Keep answers short (Under 1000 characters). 
        3. No citations or disclaimers needed.
        4. If unsure, say 'I don't know'."""

        # Construct content structure
        model_id = "gemini-3-flash-preview" 
        contents = [
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=user_query)],
            ),
        ]
        
        # Add system_instruction to the config
        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            thinking_config=types.ThinkingConfig(thinking_budget=0),
            temperature=0.1
        )

        # Generate streaming response
        response_text = ""
        for chunk in genai_client.models.generate_content_stream(
            model=model_id, 
            contents=contents, 
            config=config
        ):
            if chunk.text:
                response_text += chunk.text

        # Send the final response back to WhatsApp
        twilio_client.messages.create(
            from_=TWILIO_NUMBER,
            to=sender_number,
            body=response_text
        )
    except Exception as e:
        print(f"Error: {e}")
@app.post("/whatsapp")
async def whatsapp_webhook(
    background_tasks: BackgroundTasks, 
    Body: str = Form(...), 
    From: str = Form(...)
):
    """
    Webhook endpoint to receive messages. 
    Acknowledges immediately to prevent 5s timeout.
    """
    # 1. Schedule AI generation in background
    background_tasks.add_task(generate_legal_reply, Body, From)

    # 2. Immediate TwiML reply (The 'Processing' message)
    resp = MessagingResponse()
    resp.message("NyayaSetu is processing your query...")
    return str(resp)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)