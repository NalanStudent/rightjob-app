import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

// Reusable Modal Component
function Modal({ title, message, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>{title}</h3>
        <p>{message}</p>
        <button onClick={onClose} className="cancel-btn">Close</button>
      </div>
    </div>
  );
}

// Reusable Toast Component
function Toast({ message }) {
  return (
    <div className="toast">
      {message}
    </div>
  );
}

export default function Home() {
  const [file, setFile] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [jobSuggestions, setJobSuggestions] = useState("");
  const [careerChangeTips, setCareerChangeTips] = useState("");
  const [showOverlay, setShowOverlay] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const MAX_FILE_SIZE_MB = 2;

  const handleUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    const fileSizeMB = uploadedFile.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      setModalTitle("File Too Large");
      setModalMessage(`The file exceeds the maximum size limit of ${MAX_FILE_SIZE_MB}MB.`);
      setShowModal(true);
      setFile(null);
      return;
    }

    setFile(uploadedFile);
  };

  const handleSubmit = async () => {
    if (!file) {
      setModalTitle("No File Uploaded");
      setModalMessage("Please upload a resume before submitting.");
      setShowModal(true);
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);
    setShowOverlay(true);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.error === "NOT_RESUME") {
        setModalTitle("Invalid Document");
        setModalMessage("This document doesn’t look like a resume. Please upload a valid resume file.");
        setShowModal(true);
        return;
      }

      setFeedback(data.feedback);
      setJobSuggestions(data.jobSuggestions);
      setCareerChangeTips(data.careerChangeTips);

      setToastMessage("Resume uploaded and analyzed successfully!");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    } catch (err) {
      console.error(err);
      setModalTitle("Upload Failed");
      setModalMessage("There was an error processing your resume. Please try again.");
      setShowModal(true);
    } finally {
      setLoading(false);
      setShowOverlay(false);
    }
  };

  return (
    <>
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

      {showModal && (
        <Modal
          title={modalTitle}
          message={modalMessage}
          onClose={() => setShowModal(false)}
        />
      )}

      {showToast && <Toast message={toastMessage} />}

      <header className="app-header">
        <h1>Smart AI Resume Analyzer</h1>
        <p className="subtitle">Built with 💜 by Hextech</p>
      </header>

      <main className="main-card">
        <div className="upload-bar">
          <input type="file" accept=".pdf,.docx" onChange={handleUpload} />
          <button onClick={handleSubmit}>🚀 Analyze</button>
        </div>
        <p className="upload-note">Max upload size: 2MB. Supported formats: .pdf, .docx</p>

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
