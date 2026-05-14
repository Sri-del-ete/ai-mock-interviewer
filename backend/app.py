from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from dotenv import load_dotenv
import os

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

app = Flask(__name__)
CORS(app)

@app.route('/generate-questions', methods=['POST'])
def generate_questions():
    data = request.json
    role = data.get('role', '')
    
    prompt = f"""Generate 5 interview questions for a fresher applying for a {role} role.
    Mix technical and behavioral questions.
    Return ONLY a JSON array like this, nothing else:
    ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]"""
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
    )
    text = response.text.strip()
    
    # Clean markdown if present
    text = text.replace("```json", "").replace("```", "").strip()
    
    import json
    questions = json.loads(text)
    return jsonify({'questions': questions})

@app.route('/evaluate-answer', methods=['POST'])
def evaluate_answer():
    data = request.json
    question = data.get('question', '')
    answer = data.get('answer', '')
    role = data.get('role', '')

    prompt = f"""You are an experienced interviewer for a {role} position.
    
Question: {question}
Candidate's Answer: {answer}

Evaluate this answer and respond ONLY with a JSON object like this, nothing else:
{{
  "score": <number from 1 to 10>,
  "feedback": "<2-3 sentences of constructive feedback>",
  "ideal_answer": "<a brief ideal answer in 2-3 sentences>"
}}"""

    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
    )
    text = response.text.strip()
    text = text.replace("```json", "").replace("```", "").strip()
    
    import json
    result = json.loads(text)
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, port=5000)