import { useState } from "react";
import axios from "axios";

const API = "http://127.0.0.1:5000";

export default function App() {
  const [role, setRole] = useState("");
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("setup");
  const [error, setError] = useState("");

  const startInterview = async () => {
    if (!role.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API}/generate-questions`, { role });
      setQuestions(res.data.questions);
      setStage("interview");
      setCurrentQ(0);
      setResults([]);
      setFeedback(null);
      setAnswer("");
    } catch (e) {
      setError(e.response?.data?.error || "Something went wrong. Is your backend running?");
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API}/evaluate-answer`, {
        role,
        question: questions[currentQ],
        answer,
      });
      setFeedback(res.data);
      setResults(prev => [...prev, {
        question: questions[currentQ],
        answer,
        ...res.data
      }]);
    } catch (e) {
      setError(e.response?.data?.error || "Something went wrong while evaluating your answer.");
    } finally {
      setLoading(false);
    }
  };

  const nextQuestion = () => {
    if (currentQ + 1 >= questions.length) {
      setStage("result");
    } else {
      setCurrentQ(currentQ + 1);
      setAnswer("");
      setFeedback(null);
    }
  };

  const restart = () => {
    setStage("setup");
    setRole("");
    setQuestions([]);
    setResults([]);
    setFeedback(null);
    setAnswer("");
    setCurrentQ(0);
    setError("");
  };

  const avgScore = results.length
    ? (results.reduce((a, b) => a + b.score, 0) / results.length).toFixed(1)
    : 0;

  const scoreColor = (s) => s >= 7 ? "#2e7d32" : s >= 4 ? "#e65100" : "#c62828";

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4ff", fontFamily: "Arial, sans-serif", padding: "24px 16px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, color: "#1a237e", margin: 0 }}>🎯 AI Mock Interviewer</h1>
          <p style={{ color: "#666", marginTop: 6, fontSize: 14 }}>Practice interviews with real AI feedback</p>
        </div>

        {error && (
          <div style={{ background: "#ffebee", border: "1px solid #ef9a9a", color: "#b71c1c", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* SETUP */}
        {stage === "setup" && (
          <div style={{ background: "#fff", borderRadius: 14, padding: 32, boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}>
            <h2 style={{ color: "#1a237e", marginTop: 0, fontSize: 20 }}>What role are you preparing for?</h2>
            <p style={{ color: "#777", fontSize: 14 }}>We'll generate 5 interview questions tailored to that role.</p>
            <input
              value={role}
              onChange={e => setRole(e.target.value)}
              onKeyDown={e => e.key === "Enter" && startInterview()}
              placeholder="e.g. Python Developer, Data Analyst, Full Stack Developer"
              style={{ width: "100%", padding: "12px 16px", fontSize: 15, borderRadius: 8, border: "1.5px solid #c5cae9", outline: "none", boxSizing: "border-box", marginBottom: 20 }}
            />
            <button
              onClick={startInterview}
              disabled={loading}
              style={{ width: "100%", padding: 14, background: loading ? "#9fa8da" : "#1a237e", color: "#fff", border: "none", borderRadius: 8, fontSize: 16, cursor: loading ? "not-allowed" : "pointer", fontWeight: "bold" }}
            >
              {loading ? "Generating questions..." : "Start Interview →"}
            </button>
          </div>
        )}

        {/* INTERVIEW */}
        {stage === "interview" && (
          <div>
            {/* Progress bar */}
            <div style={{ background: "#fff", borderRadius: 10, padding: "14px 20px", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#555" }}>Role: <strong>{role}</strong></span>
              <span style={{ fontSize: 13, color: "#1a237e", fontWeight: "bold" }}>Q{currentQ + 1} / {questions.length}</span>
            </div>
            <div style={{ background: "#e8eaf6", borderRadius: 8, height: 7, marginBottom: 18 }}>
              <div style={{ background: "#1a237e", height: 7, borderRadius: 8, width: `${((currentQ + 1) / questions.length) * 100}%`, transition: "width 0.4s" }} />
            </div>

            {/* Question card */}
            <div style={{ background: "#1a237e", borderRadius: 12, padding: "20px 24px", marginBottom: 16, color: "#fff" }}>
              <p style={{ margin: 0, fontSize: 11, opacity: 0.6, textTransform: "uppercase", letterSpacing: 1 }}>Question {currentQ + 1}</p>
              <p style={{ margin: "8px 0 0", fontSize: 17, lineHeight: 1.5 }}>{questions[currentQ]}</p>
            </div>

            {/* Answer box */}
            {!feedback && (
              <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.07)" }}>
                <p style={{ margin: "0 0 10px", color: "#555", fontSize: 14 }}>Your Answer:</p>
                <textarea
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  rows={5}
                  style={{ width: "100%", padding: "12px 14px", fontSize: 14, borderRadius: 8, border: "1.5px solid #c5cae9", outline: "none", boxSizing: "border-box", resize: "vertical", lineHeight: 1.6 }}
                />
                <button
                  onClick={submitAnswer}
                  disabled={loading || !answer.trim()}
                  style={{ marginTop: 14, width: "100%", padding: 13, background: loading ? "#9fa8da" : "#1a237e", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", fontWeight: "bold" }}
                >
                  {loading ? "Evaluating..." : "Submit Answer"}
                </button>
              </div>
            )}

            {/* Feedback card */}
            {feedback && (
              <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.07)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ background: scoreColor(feedback.score), color: "#fff", borderRadius: "50%", width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: "bold", flexShrink: 0 }}>
                    {feedback.score}/10
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: "bold", color: "#1a237e", fontSize: 15 }}>AI Feedback</p>
                    <p style={{ margin: "4px 0 0", color: "#555", fontSize: 13, lineHeight: 1.5 }}>{feedback.feedback}</p>
                  </div>
                </div>
                <div style={{ background: "#f1f8e9", borderRadius: 8, padding: "12px 16px", borderLeft: "4px solid #2e7d32" }}>
                  <p style={{ margin: 0, fontSize: 12, color: "#2e7d32", fontWeight: "bold", marginBottom: 4 }}>💡 Ideal Answer</p>
                  <p style={{ margin: 0, fontSize: 13, color: "#333", lineHeight: 1.6 }}>{feedback.ideal_answer}</p>
                </div>
                <button
                  onClick={nextQuestion}
                  style={{ marginTop: 16, width: "100%", padding: 13, background: "#1a237e", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, cursor: "pointer", fontWeight: "bold" }}
                >
                  {currentQ + 1 >= questions.length ? "See Final Results →" : "Next Question →"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* RESULTS */}
        {stage === "result" && (
          <div>
            {/* Score summary */}
            <div style={{ background: "#1a237e", borderRadius: 14, padding: 28, textAlign: "center", color: "#fff", marginBottom: 20 }}>
              <p style={{ margin: 0, fontSize: 13, opacity: 0.7, textTransform: "uppercase", letterSpacing: 1 }}>Interview Complete</p>
              <p style={{ margin: "8px 0 4px", fontSize: 48, fontWeight: "bold" }}>{avgScore}<span style={{ fontSize: 20 }}>/10</span></p>
              <p style={{ margin: 0, fontSize: 15, opacity: 0.85 }}>
                {avgScore >= 7 ? "Great job! You're interview ready 🎉" : avgScore >= 4 ? "Good effort! Keep practicing 💪" : "Keep going — practice makes perfect 📚"}
              </p>
            </div>

            {/* Per question breakdown */}
            {results.map((r, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 12, padding: 20, marginBottom: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <p style={{ margin: 0, fontWeight: "bold", color: "#1a237e", fontSize: 14, flex: 1, paddingRight: 12 }}>Q{i + 1}: {r.question}</p>
                  <span style={{ background: scoreColor(r.score), color: "#fff", borderRadius: 20, padding: "3px 12px", fontSize: 13, fontWeight: "bold", flexShrink: 0 }}>{r.score}/10</span>
                </div>
                <p style={{ margin: "0 0 8px", fontSize: 13, color: "#555" }}><strong>Your answer:</strong> {r.answer}</p>
                <p style={{ margin: "0 0 8px", fontSize: 13, color: "#444" }}><strong>Feedback:</strong> {r.feedback}</p>
                <div style={{ background: "#f1f8e9", borderRadius: 6, padding: "8px 12px", borderLeft: "3px solid #2e7d32" }}>
                  <p style={{ margin: 0, fontSize: 12, color: "#2e7d32" }}><strong>Ideal:</strong> {r.ideal_answer}</p>
                </div>
              </div>
            ))}

            <button
              onClick={restart}
              style={{ width: "100%", padding: 14, background: "#1a237e", color: "#fff", border: "none", borderRadius: 8, fontSize: 16, cursor: "pointer", fontWeight: "bold", marginTop: 4 }}
            >
              Practice Again 🔄
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
