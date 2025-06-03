# SlideX

SlideX is a web application that uses GPT-4o to generate PowerPoint-style presentations.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file with your OpenAI API key. The application checks the
   variables `OPENAI_API_KEY` or `API_KEY`:
   ```env
   OPENAI_API_KEY=your-key
   # or
   API_KEY=your-key
   ```
3. Start the server:
   ```bash
   node server.js
   ```

The app will be available at `http://localhost:3000`.

### API

- `POST /api/chat` – general chat endpoint
- `POST /api/upload` – upload a file using `multipart/form-data` with field `file`
- `POST /api/generate` – start slide generation with body `{ "prompt": "topic" }`

Slides are streamed to all WebSocket clients as JSON messages of the form:

```json
{ "type": "slide", "html": "<div>...</div>" }
```

### CLI Slide Generator

For quick testing you can generate slides directly from the command line without starting the server. Run:

```bash
node scripts/generate-slides.js "Your presentation topic"
```

This will create a `presentation.html` file containing the generated slides.

