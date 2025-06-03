#!/usr/bin/env node
const OpenAI = require('openai');
const fs = require('fs').promises;
require('dotenv').config();

async function main() {
  const prompt = process.argv.slice(2).join(' ');
  if (!prompt) {
    console.error('Usage: node scripts/generate-slides.js "Your topic"');
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || process.env.API_KEY });

  const tools = [
    {
      type: 'function',
      function: {
        name: 'add_slide',
        description: 'Add an HTML slide for the presentation with full styling',
        parameters: {
          type: 'object',
          properties: {
            html: { type: 'string', description: 'Complete HTML of the slide' },
            slideIndex: { type: 'number', description: 'Slide index' },
            title: { type: 'string', description: 'Slide title' }
          },
          required: ['html', 'slideIndex', 'title']
        }
      }
    }
  ];

  const systemPrompt = `You are the SlideX CLI Agent. Generate professional HTML slides.\nEach slide must:\n1. Use Tailwind CSS for styling\n2. Include any scripts inline\n3. Be 1280x720 in size\n4. Use Font Awesome icons when useful.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Create a presentation about: ${prompt}` }
  ];

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    tools,
    tool_choice: 'auto',
    stream: true,
    temperature: 0.7
  });

  const toolCalls = new Map();
  let currentId = null;
  const slides = [];

  for await (const chunk of stream) {
    const delta = chunk.choices[0].delta;
    if (delta.tool_calls) {
      for (const call of delta.tool_calls) {
        if (call.id) {
          currentId = call.id;
          if (!toolCalls.has(call.id)) {
            toolCalls.set(call.id, { id: call.id, function: { name: call.function?.name || '', arguments: '' } });
          }
        }
        if (call.function?.name && currentId) {
          const entry = toolCalls.get(currentId);
          entry.function.name = call.function.name;
        }
        if (call.function?.arguments && currentId) {
          const entry = toolCalls.get(currentId);
          entry.function.arguments += call.function.arguments;
        }
      }
    }

    if (chunk.choices[0].finish_reason === 'tool_calls') {
      for (const [, call] of toolCalls.entries()) {
        if (call.function.arguments) {
          const parsed = JSON.parse(call.function.arguments);
          if (call.function.name === 'add_slide') {
            slides[parsed.slideIndex] = parsed.html;
            console.log(`Generated slide ${parsed.slideIndex + 1}: ${parsed.title}`);
          }
        }
      }
      toolCalls.clear();
      currentId = null;
    }
  }

  const htmlOutput = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${prompt}</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    body { background: #f3f4f6; padding: 20px; }
    .slide-page { width: 1280px; height: 720px; margin: 0 auto 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
  </style>
</head>
<body>
  ${slides.map(s => `<div class="slide-page">${s}</div>`).join('\n')}
</body>
</html>`;

  await fs.writeFile('presentation.html', htmlOutput);
  console.log(`Saved ${slides.length} slides to presentation.html`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
