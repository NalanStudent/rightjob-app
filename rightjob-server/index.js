const express = require('express');
const multer = require('multer');
const cors = require('cors');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

const app = express();
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
});
app.use(cors());

const COHERE_API_KEY = process.env.COHERE_API_KEY;

app.post('/upload', upload.single('resume'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    const text = data.text;

    // Step 1: Validate if it's a resume
    const validationPrompt = `
      Please determine if the following text is a professional resume.
      Respond ONLY with "YES" or "NO".

      Resume Content:
      ${text}
    `;

    const validationResponse = await axios.post(
      'https://api.cohere.ai/v1/generate',
      {
        model: 'command',
        prompt: validationPrompt,
        max_tokens: 100,
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${COHERE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const validationText = validationResponse.data.generations[0].text.trim();

    if (validationText.toLowerCase().startsWith('no')) {
      fs.unlinkSync(filePath);
      return res.status(400).json({
        error: 'NOT_RESUME',
        message: 'The uploaded file does not appear to be a resume.',
        reason: validationText,
      });
    }

    // Step 2: Resume Feedback Prompt
    const feedbackPrompt = `
      You are an expert resume reviewer.

      Carefully review the resume below and provide clear, constructive, and actionable feedback to improve:
      - Clarity and formatting
      - Strength of language and accomplishments
      - Relevance to common job roles

      Resume Content:
      ${text}

      Provide your feedback in bullet points.
    `;

    const feedbackResponse = await axios.post(
      'https://api.cohere.ai/v1/generate',
      {
        model: 'command',
        prompt: feedbackPrompt,
        max_tokens: 800,
        temperature: 0.6,
      },
      {
        headers: {
          Authorization: `Bearer ${COHERE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const feedback = feedbackResponse.data.generations[0].text;

    // Step 3: Job Role Suggestions
    const jobPrompt = `
      Based on the following resume, suggest 3 to 5 job roles or career paths
      that align with the candidate’s skills, experience, and qualifications.

      Resume Content:
      ${text}

      List the job roles with a short justification for each.
    `;

    const jobResponse = await axios.post(
      'https://api.cohere.ai/v1/generate',
      {
        model: 'command',
        prompt: jobPrompt,
        max_tokens: 800,
        temperature: 0.6,
      },
      {
        headers: {
          Authorization: `Bearer ${COHERE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const jobSuggestions = jobResponse.data.generations[0].text;

    // Step 4: Career Change Tips
    const careerPrompt = `
      The following text is a resume of a career changer.
      Provide 3 to 5 strategic and personalized suggestions to:
      - Highlight transferable skills
      - Address lack of direct experience
      - Improve chances of landing interviews in a new industry

      Resume Content:
      ${text}

      Present tips as bullet points.
    `;

    const careerResponse = await axios.post(
      'https://api.cohere.ai/v1/generate',
      {
        model: 'command',
        prompt: careerPrompt,
        max_tokens: 800,
        temperature: 0.6,
      },
      {
        headers: {
          Authorization: `Bearer ${COHERE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const careerChangeTips = careerResponse.data.generations[0].text;

    fs.unlinkSync(filePath);

    res.json({ feedback, jobSuggestions, careerChangeTips });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error analyzing resume', error: err.message });
  }
});

app.listen(5000, () => {
  console.log('✅ Server running on http://localhost:5000');
});
