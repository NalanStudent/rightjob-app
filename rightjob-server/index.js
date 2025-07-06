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
You are a professional resume reviewer with deep expertise in hiring standards across industries.

Your task is to analyze the resume below and return **concise, constructive, and actionable feedback**, broken into the following categories:
- 🔍 **Clarity & Formatting**
- 💬 **Language & Achievements**
- 🎯 **Relevance to Common Roles**

Resume:
${text}

**Formatting Instructions:**
- Present each category as a heading (e.g., “🔍 Clarity & Formatting”)
- Under each heading, give 2–5 **bullet points** with brief, direct suggestions
- Be specific, practical, and tailored to what’s visible in the resume
- Do **not** include any greetings, closing statements, or follow-up questions
- Use **direct, instructional tone**. Avoid phrases like “It would help if…” — instead, say “Add metrics to quantify your achievements.”
- Do **not** include closing remarks, summaries, or “let me know...” type language.
- Do **not** include questions or follow-ups. This is a one-way feedback task.


Example format:
🔍 Clarity & Formatting
- Resume has inconsistent bullet styles across sections
- Section headers could use more contrast or alignment

💬 Language & Achievements
- Replace passive phrases like “responsible for” with action verbs like “led” or “executed”
- Consider quantifying your accomplishments (e.g., “Increased efficiency by 20%”)

🎯 Relevance to Common Roles
- Skills listed match well with mid-level data analyst roles
- Recent project work aligns with product-focused roles

Only return your feedback using this format.
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
You are a career advisor and resume interpreter. Read the resume below and suggest **3 to 5 job roles or career paths** that align with the candidate’s skills and background.

Resume:
${text}

**Output Instructions:**
- Number each job suggestion (e.g., 1., 2.)
- Use this format for each:
  **[Job Title]** – [One-line summary]
  - [Justification 1]
  - [Justification 2]
  - [Etc.]

- Justifications should be tailored to the resume (e.g., skills, past roles, projects, tools)
- Do **not** include greetings, disclaimers, or closing statements

**Example:**
1. **Software Engineer**
  – Strong fit due to technical expertise
  - Experience in Java, Python, and backend systems
  - Led development of microservices in a team environment

2. **Product Manager** 
  – Great alignment with leadership and delivery skills
  - Demonstrated ability to coordinate teams
  - Experience working closely with technical and business stakeholders

Only return the job roles and justifications in this structure.
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
You are an expert in career transitions and resume strategy.

The candidate below is transitioning to a new industry. Based on the resume, provide **3 to 5 practical, specific, and actionable suggestions** that will help improve their chances of landing interviews in a new field.

Resume:
${text}

Your suggestions must focus on:
- Highlighting transferable skills
- Addressing lack of direct experience
- Enhancing relevance to new roles

Formatting Rules:
- Return only a **bullet list**
- Each bullet must be **standalone**, direct, and no more than **2 short lines**
- Use **no paragraphs**, no sub-points, and **no explanation**
- Do **not** include introductions, summaries, advice to "remember", or follow-up questions

🧪 Example Output:
- Reframe retail experience as customer-facing operations to match business analyst roles  
- Emphasize leadership from club activities as team coordination experience  
- Highlight SQL and Excel skills as transferable to data-related positions  
- Add a “Career Transition” summary to clearly state your new target role  
- Showcase side projects (e.g., personal finance dashboard) as proof of motivation and skill

Only return suggestions in this bullet point structure. No additional content.

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
