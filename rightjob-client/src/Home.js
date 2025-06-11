import React, { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [file, setFile] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [jobSuggestions, setJobSuggestions] = useState("");
  const [careerChangeTips, setCareerChangeTips] = useState("");
  const [showOverlay, setShowOverlay] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpload = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) return alert("Please upload a file.");
    setLoading(true);
    setShowOverlay(true);

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const res = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setFeedback(data.feedback);
      setJobSuggestions(data.jobSuggestions);
      setCareerChangeTips(data.careerChangeTips);
    } catch (err) {
      alert("Error processing resume.");
      console.error(err);
    } finally {
      setLoading(false);
      setShowOverlay(false);
    }
  };

  return (
    <>
      {/* Scanning Overlay */}
      {showOverlay && (
        <div className="overlay">
          <div className="overlay-content">
            <img src="/scan-icon.png" alt="Scanning" className="scan-icon" />
            <h3>Scanning Resume...</h3>
            <p>Your resume is being analyzed for ATS compatibility.</p>
            <button className="cancel-btn" onClick={() => setShowOverlay(false)}>Cancel</button>
          </div>
        </div>
      )}

      <header className="app-header">
        <h1>Smart AI Resume Analyzer</h1>
        <p className="subtitle">Built with 💜 by Hextech</p>
      </header>

      <main className="main-card">
        <div className="upload-bar">
          <input type="file" accept=".pdf,.docx" onChange={handleUpload} />
          <button onClick={handleSubmit}>🚀 Analyze</button>
        </div>

        {loading && <p className="loading">⏳ Analyzing your resume...</p>}

        {!loading && feedback && (
          <section>
            <h2>📝 AI Feedback</h2>
            <div className="markdown-box">
              <ReactMarkdown>{feedback}</ReactMarkdown>
            </div>
          </section>
        )}

        {!loading && jobSuggestions && (
          <section>
            <h2>💼 Job Scope Suggestions</h2>
            <div className="markdown-box">
              <ReactMarkdown>{jobSuggestions}</ReactMarkdown>
            </div>
          </section>
        )}

        {!loading && careerChangeTips && (
          <section>
            <h2>💡 Career Change Tips</h2>
            <div className="markdown-box">
              <ReactMarkdown>{careerChangeTips}</ReactMarkdown>
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <p>© 2025 RightJob • Built with 💜 for your career</p>
      </footer>
    </>
  );
}
