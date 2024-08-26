const express = require('express');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;
const MODEL_NAME = "gemini-1.5-pro-latest";
const API_KEY = "AIzaSyB85ckrcDd8vRVD8VT8e6ggvOhF0Asko4Q";

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Function to run chat generation with a dynamic prompt
async function runChat(data, staticPrompt) {
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

// Endpoint for client summary
app.post('/cst-summary', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const staticPrompt = "Analyze the provided demo summary and extract the following key detailsClient HS Code/Product: Identify and provide the HS code or product name mentioned by the client.Client Role: Determine whether the client is acting as a buyer or a supplier.Client Persona: Describe the client’s role or persona in the context of the conversation.Client Interested Market: Identify the market or markets the client is interested in.Client Country of Interest: Specify the country or countries the client is focused on.Client Objective: Summarize the client’s main objectives or goals discussed in the demo.Ensure the extracted information is clear and accurately reflects the details provided in the demo summary."

  try {
    const response = await runChat(prompt, staticPrompt);
    res.json({ response });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
});

// Endpoint for user summary
app.post('/user-summary', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const staticPrompt = `
Analyze the JSON data provided, focusing on the "summary" field within each object. Create a detailed yet concise summary titled "Summary of our Demo," ensuring that all key points discussed in the JSON are accurately captured. The summary should include:

Volza Features Demonstrated: Briefly highlight each Volza feature shown during the demo, focusing on how they address the user's specific needs.

User's Needs and Solutions: Summarize the user's primary needs or challenges and explain how the demonstrated features align with and provide solutions.

Countries of Interest: Mention any countries of interest discussed, particularly in relation to competitors, suppliers, or sourcing strategies.

Key Actions and Next Steps: Recap the main actions, decisions, or next steps agreed upon during the demo.

Strategic Insights: Include any relevant competitor analysis or strategic insights discussed, but keep this section brief and focused.

Important: Avoid using the word 'client' in the response. Instead, refer to the client directly as 'you' or by their name.


`  
  try {
    const response = await runChat(prompt, staticPrompt);
    res.json({ response });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
