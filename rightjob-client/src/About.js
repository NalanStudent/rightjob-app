import React from "react";
import { useNavigate } from "react-router-dom";

export default function About() {
  const navigate = useNavigate();

  return (
    <main className="main-card">
      <h2>👨‍💻 About RightJob</h2>
      <p>
        <strong>RightJob</strong> is an AI-powered resume analysis tool built by
        Hextech. Our platform helps job seekers improve their resumes, gain personalized
        feedback, and receive tailored job scope suggestions — all with the power of AI.
      </p>

      <p>
        This project was developed as part of the <strong>Entrepreneurship in Computing </strong>
        course to solve the real-world problem of unclear career guidance, resume rejection, and
        lack of personalized improvement tips for fresh graduates.
      </p>

      <p>
        We proudly leverage technologies like Cohere AI, Node.js, and React.js to build an intuitive,
        intelligent and future-ready career tool.
      </p>

      <p>Built with 💜 by Team Hextech • UPM • 2025</p>

      <button onClick={() => navigate("/")} className="back-button">
        🔙 Back to Home
      </button>
    </main>
  );
}
