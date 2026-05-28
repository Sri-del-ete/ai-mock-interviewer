from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from dotenv import load_dotenv
import os
import json
import time
from collections import defaultdict, deque

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

app = Flask(__name__)

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]
CORS(app, resources={r"/*": {"origins": allowed_origins}})

rate_limit_window_seconds = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
rate_limit_max_requests = int(os.getenv("RATE_LIMIT_MAX_REQUESTS", "30"))
request_timestamps = defaultdict(deque)

def parse_model_json(text):
    cleaned = text.strip().replace("```json", "").replace("```", "").strip()
    return json.loads(cleaned)

def is_rate_limited(ip_address):
    now = time.time()
    timestamps = request_timestamps[ip_address]
    while timestamps and (now - timestamps[0]) > rate_limit_window_seconds:
        timestamps.popleft()
    if len(timestamps) >= rate_limit_max_requests:
        return True
    timestamps.append(now)
    return False

@app.before_request
def enforce_rate_limit():
    if request.method == "OPTIONS":
        return None
    ip_address = (request.headers.get("X-Forwarded-For") or request.remote_addr or "unknown").split(",")[0].strip()
    if is_rate_limited(ip_address):
        return jsonify({'error': 'Too many requests. Please try again shortly.'}), 429
    return None

@app.route('/generate-questions', methods=['POST'])
def generate_questions():
    data = request.get_json(silent=True) or {}
    role = data.get('role', '')

    if not role.strip():
        return jsonify({'error': 'Role is required'}), 400
    
    prompt = f"""Generate 5 interview questions for a fresher applying for a {role} role.
    Mix technical and behavioral questions.
    Return ONLY a JSON array like this, nothing else:
    ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]"""
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        questions = parse_model_json(response.text)
        return jsonify({'questions': questions})
    except Exception:
        return jsonify({'error': 'Could not generate interview questions'}), 502

@app.route('/evaluate-answer', methods=['POST'])
def evaluate_answer():
    data = request.get_json(silent=True) or {}
    question = data.get('question', '')
    answer = data.get('answer', '')
    role = data.get('role', '')

    if not question.strip() or not answer.strip() or not role.strip():
        return jsonify({'error': 'Role, question, and answer are required'}), 400

    prompt = f"""You are an experienced interviewer for a {role} position.
    
Question: {question}
Candidate's Answer: {answer}

Evaluate this answer and respond ONLY with a JSON object like this, nothing else:
{{
  "score": <number from 1 to 10>,
  "feedback": "<2-3 sentences of constructive feedback>",
  "ideal_answer": "<a brief ideal answer in 2-3 sentences>"
}}"""

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        result = parse_model_json(response.text)
        return jsonify(result)
    except Exception:
        return jsonify({'error': 'Could not evaluate the answer'}), 502

if __name__ == '__main__':
    app.run(debug=True, port=5000)
