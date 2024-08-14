const express = require('express');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;
const MODEL_NAME = "gemini-1.5-pro-latest";
const API_KEY = "AIzaSyB85ckrcDd8vRVD8VT8e6ggvOhF0Asko4Q";
const staticPrompt = "Analyze the provided demo summary and extract the following key detailsClient HS Code/Product: Identify and provide the HS code or product name mentioned by the client.Client Role: Determine whether the client is acting as a buyer or a supplier.Client Persona: Describe the client’s role or persona in the context of the conversation.Client Interested Market: Identify the market or markets the client is interested in.Client Country of Interest: Specify the country or countries the client is focused on.Client Objective: Summarize the client’s main objectives or goals discussed in the demo.Ensure the extracted information is clear and accurately reflects the details provided in the demo summary."
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
