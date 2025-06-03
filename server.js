const express = require('express');
const path = require('path');
const { WebSocketServer } = require('ws');
const multer = require('multer');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
const upload = multer({ dest: path.join(__dirname, 'uploads') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.API_KEY,
});

app.post('/api/chat', async (req, res) => {
  try {
    const messages = req.body.messages || [];
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      stream: false,
    });
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'OpenAI request failed' });
  }
});

// file upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ filename: req.file.filename, original: req.file.originalname });
});

// generate slides using OpenAI function calling
app.post('/api/generate', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'No prompt provided' });
  }
  res.json({ status: 'started' });

  try {
    const tools = [
      {
        type: 'function',
        function: {
          name: 'add_slide',
          description: 'Add an HTML slide for the presentation',
          parameters: {
            type: 'object',
            properties: {
              html: { type: 'string', description: 'HTML content of the slide' },
            },
            required: ['html'],
          },
        },
      },
    ];

    const messages = [
      {
        role: 'system',
        content:
          'You are the SlideX Coding Agent. Generate slides in HTML. Use the add_slide function for each slide.',
      },
      { role: 'user', content: prompt },
    ];

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      tools,
      tool_choice: 'auto',
      stream: true,
    });

    const buffers = new Map();

    for await (const chunk of stream) {
      const delta = chunk.choices[0].delta;
      if (delta.tool_calls) {
        delta.tool_calls.forEach((call) => {
          if (!buffers.has(call.id)) buffers.set(call.id, '');
          buffers.set(call.id, buffers.get(call.id) + (call.function.arguments || ''));
        });
      }
      if (chunk.choices[0].finish_reason === 'tool_calls') {
        for (const [id, args] of buffers.entries()) {
          try {
            const parsed = JSON.parse(args);
            broadcast(JSON.stringify({ type: 'slide', html: parsed.html }));
          } catch (e) {
            console.error('Failed to parse tool call', e);
          }
        }
        buffers.clear();
      }
    }
  } catch (err) {
    console.error('OpenAI streaming error', err);
  }
});

const server = app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

const wss = new WebSocketServer({ server });

function broadcast(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(message);
    }
  });
}

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    // Echo received messages for now
    broadcast(data.toString());
  });
});
