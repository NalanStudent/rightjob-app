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
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});
app.use(cors());

const COHERE_API_KEY = process.env.COHERE_API_KEY;

app.post('/upload', upload.single('resume'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    const text = data.text;

    // ✳️ Step 1: Validate if it's a resume
    const validationPrompt = `Does the following text represent a resume? Respond only with "YES" or "NO" ONLY. The following text is :\n\n${text}`;
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
          'Authorization': `Bearer ${COHERE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const validationText = validationResponse.data.generations[0].text.trim();

    // ✳️ Step 2: Check response
    if (validationText.toLowerCase().startsWith('no')) {
      fs.unlinkSync(filePath);
      return res.status(400).json({
        error: 'NOT_RESUME',
        message: 'The uploaded file does not appear to be a resume.',
        reason: validationText
      });

    }

    // Step 3: Resume Feedback
    const feedbackPrompt = `You're an expert resume reviewer. Give specific improvement suggestions for this resume:\n\n${text}`;
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
          'Authorization': `Bearer ${COHERE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const feedback = feedbackResponse.data.generations[0].text;

    // Step 4: Job Suggestions
    const jobPrompt = `Based on the following resume, suggest 3-5 suitable job roles:\n\n${text}`;
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
          'Authorization': `Bearer ${COHERE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const jobSuggestions = jobResponse.data.generations[0].text;

    // Step 5: Career Change Tips
    const careerPrompt = `The following is a resume of a career changer. Provide 3-5 tailored tips or advice on how to highlight transferable skills and successfully transition to a new career path.\n\n${text}`;
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
          'Authorization': `Bearer ${COHERE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const careerChangeTips = careerResponse.data.generations[0].text;

    // Cleanup
    fs.unlinkSync(filePath);

    // Final Response
    res.json({ feedback, jobSuggestions, careerChangeTips });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error analyzing resume', error: err.message });
  }
});

app.listen(5000, () => {
  console.log('✅ Server running on http://localhost:5000');
});
