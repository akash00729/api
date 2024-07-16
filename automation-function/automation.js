const express = require('express');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;
const MODEL_NAME = "gemini-1.5-pro-latest";
const API_KEY = "AIzaSyAEFeOH6N9455YvcsrAbedD8hzK78IZ1H4";
const staticPrompt = 'Summarize and extract relevant data from a conversation between a sales executive and a client. Provide the summary in one line and include all relevant details in each point. Combine the summary and relevant data into one line for quick review. Summarize the conversation into 5 key points, including a one-line summary for each, for the marketing head of the department. Can you create a streamlined format for review that includes all necessary information in a concise manner?';

app.use(bodyParser.json());

async function runChat(data) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const generationConfig = {
    temperature: 1,
    topK: 0,
    topP: 0.95,
    maxOutputTokens: 8192,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];

  const chat = model.startChat({
    generationConfig,
    safetySettings,
    history: [],
  });

  const promptWithJson = `${staticPrompt}\n\nData: ${JSON.stringify(data, null, 2)}`;
  const result = await chat.sendMessage(promptWithJson);

  if (result.response) {
    return result.response.text();
  } else {
    throw new Error('No response from the model');
  }
}

app.post('/chat', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const response = await runChat(prompt);
    res.json({ response });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
