const express = require('express');
const path = require('path');
const { WebSocketServer } = require('ws');
const multer = require('multer');
const OpenAI = require('openai');
const fs = require('fs').promises;
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: path.join(__dirname, 'uploads'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.API_KEY,
});

// Setup Agent endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const messages = req.body.messages || [];
    
    // Define the function for the Setup Agent
    const functions = [
      {
        name: 'generate_presentation',
        description: 'Generate a presentation based on the approved outline',
        parameters: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'The title of the presentation'
            },
            outline: {
              type: 'array',
              description: 'Array of slide topics and descriptions',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  content: { type: 'string' },
                  type: { type: 'string', enum: ['title', 'content', 'image', 'chart', 'conclusion'] }
                }
              }
            },
            files: {
              type: 'array',
              description: 'Array of uploaded file references',
              items: { type: 'string' }
            }
          },
          required: ['title', 'outline']
        }
      }
    ];
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      functions,
      function_call: 'auto',
      temperature: 0.7,
    });
    
    res.json(response);
  } catch (err) {
    console.error('Chat API error:', err);
    res.status(500).json({ error: 'OpenAI request failed', details: err.message });
  }
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  res.json({ 
    filename: req.file.filename, 
    original: req.file.originalname,
    size: req.file.size,
    path: req.file.path
  });
});

// Web search endpoint
app.post('/api/search', async (req, res) => {
  const { query } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'No search query provided' });
  }
  
  try {
    // Using DuckDuckGo instant answer API (no key required)
    const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const response = await axios.get(searchUrl);
    
    const results = {
      abstract: response.data.Abstract,
      abstractText: response.data.AbstractText,
      abstractSource: response.data.AbstractSource,
      abstractURL: response.data.AbstractURL,
      relatedTopics: response.data.RelatedTopics?.slice(0, 5).map(topic => ({
        text: topic.Text,
        url: topic.FirstURL
      }))
    };
    
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed', details: error.message });
  }
});

// Generate slides endpoint with streaming
app.post('/api/generate', async (req, res) => {
  const { prompt, outline, files } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'No prompt provided' });
  }
  
  res.json({ status: 'started' });

  try {
    // Create TODO.md file
    const todoContent = outline.map((slide, index) => 
      `- [ ] Slide ${index + 1}: ${slide.title}`
    ).join('\n');
    
    await fs.writeFile(path.join(__dirname, 'TODO.md'), 
      `# Presentation Generation Tasks\n\n${todoContent}\n`
    );

    // Define slide generation function
    const tools = [
      {
        type: 'function',
        function: {
          name: 'add_slide',
          description: 'Add an HTML slide for the presentation with full styling',
          parameters: {
            type: 'object',
            properties: {
              html: { 
                type: 'string', 
                description: 'Complete HTML content of the slide including all styling, scripts, and structure' 
              },
              slideIndex: {
                type: 'number',
                description: 'The index of the slide being generated'
              },
              title: {
                type: 'string',
                description: 'The title of the slide'
              }
            },
            required: ['html', 'slideIndex', 'title'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'update_todo',
          description: 'Update the TODO.md file to mark a task as complete',
          parameters: {
            type: 'object',
            properties: {
              slideIndex: {
                type: 'number',
                description: 'The index of the completed slide'
              }
            },
            required: ['slideIndex'],
          },
        },
      }
    ];

    const systemPrompt = `You are the SlideX Coding Agent. Generate professional HTML slides based on the outline.
Each slide should:
1. Use the exact HTML structure from the examples provided
2. Include Tailwind CSS classes for styling
3. Have a consistent design theme
4. Be 1280x720 pixels (16:9 aspect ratio)
5. Include any necessary Chart.js or D3.js visualizations
6. Use Font Awesome icons where appropriate

Remember to include all necessary CSS and JavaScript inline within each slide's HTML.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { 
        role: 'user', 
        content: `Generate slides for: ${prompt}\n\nOutline:\n${JSON.stringify(outline, null, 2)}\n\nUse a professional design with gradients, modern layouts, and appropriate visualizations.` 
      }
    ];

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      tools,
      tool_choice: 'auto',
      stream: true,
      temperature: 0.7,
    });

    const toolCalls = new Map();
    let currentToolCallId = null;

    for await (const chunk of stream) {
      const delta = chunk.choices[0].delta;
      
      // Handle tool calls
      if (delta.tool_calls) {
        for (const toolCall of delta.tool_calls) {
          // If this is a new tool call or has an ID, track it
          if (toolCall.id) {
            currentToolCallId = toolCall.id;
            if (!toolCalls.has(toolCall.id)) {
              toolCalls.set(toolCall.id, {
                id: toolCall.id,
                type: 'function',
                function: {
                  name: toolCall.function?.name || '',
                  arguments: ''
                }
              });
            }
          }
          
          // Accumulate function name if provided
          if (toolCall.function?.name && currentToolCallId) {
            const existing = toolCalls.get(currentToolCallId);
            existing.function.name = toolCall.function.name;
          }
          
          // Accumulate arguments
          if (toolCall.function?.arguments && currentToolCallId) {
            const existing = toolCalls.get(currentToolCallId);
            existing.function.arguments += toolCall.function.arguments;
          }
        }
      }
      
      // When a tool call is complete, process it
      if (chunk.choices[0].finish_reason === 'tool_calls') {
        for (const [id, toolCall] of toolCalls.entries()) {
          try {
            // Only parse if we have arguments
            if (toolCall.function.arguments) {
              const parsed = JSON.parse(toolCall.function.arguments);
              
              if (toolCall.function.name === 'add_slide') {
                console.log(`Generating slide ${parsed.slideIndex + 1}: ${parsed.title}`);
                
                // Broadcast slide to all WebSocket clients
                broadcast(JSON.stringify({ 
                  type: 'slide', 
                  html: parsed.html,
                  slideIndex: parsed.slideIndex,
                  title: parsed.title
                }));
                
                // Update TODO.md
                await updateTodoItem(parsed.slideIndex, true);
                
                // Also broadcast progress
                broadcast(JSON.stringify({ 
                  type: 'progress',
                  message: `Generated slide ${parsed.slideIndex + 1}: ${parsed.title}`
                }));
              } else if (toolCall.function.name === 'update_todo') {
                await updateTodoItem(parsed.slideIndex, true);
                broadcast(JSON.stringify({ 
                  type: 'todo_update', 
                  slideIndex: parsed.slideIndex,
                  completed: true
                }));
              }
            }
          } catch (e) {
            console.error(`Failed to parse tool call for ${toolCall.function.name}:`, e.message);
            // Log the problematic JSON for debugging
            console.error('Problematic JSON:', toolCall.function.arguments);
          }
        }
        toolCalls.clear();
        currentToolCallId = null;
      }
    }
    
    // Send completion message
    broadcast(JSON.stringify({ 
      type: 'generation_complete',
      message: 'All slides have been generated!'
    }));
    
  } catch (err) {
    console.error('OpenAI streaming error:', err);
    broadcast(JSON.stringify({ 
      type: 'error', 
      message: 'Failed to generate slides',
      details: err.message 
    }));
  }
});

// Export endpoint (placeholder for now)
app.post('/api/export', async (req, res) => {
  const { slides, format } = req.body;
  
  if (!slides || !format) {
    return res.status(400).json({ error: 'Missing slides or format' });
  }
  
  // For now, we'll just return a success message
  // In a real implementation, you would use libraries like:
  // - pptxgenjs for PowerPoint generation
  // - puppeteer for PDF generation
  
  res.json({ 
    success: true, 
    message: `Export to ${format} would be implemented here` 
  });
});

// Helper function to update TODO.md
async function updateTodoItem(index, completed) {
  try {
    const todoPath = path.join(__dirname, 'TODO.md');
    const content = await fs.readFile(todoPath, 'utf8');
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(`Slide ${index + 1}:`)) {
        lines[i] = lines[i].replace('- [ ]', '- [x]');
        break;
      }
    }
    
    await fs.writeFile(todoPath, lines.join('\n'));
  } catch (error) {
    console.error('Failed to update TODO.md:', error);
  }
}

const server = app.listen(port, () => {
  console.log(`SlideX server listening on http://localhost:${port}`);
});

// WebSocket setup
const wss = new WebSocketServer({ server });

function broadcast(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(message);
    }
  });
}

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      // Handle different message types
      switch (message.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
        case 'slide_edit':
          // Broadcast slide edits to all clients
          broadcast(data.toString());
          break;
        default:
          // Echo other messages
          broadcast(data.toString());
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});
