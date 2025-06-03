# Immediate Actions to Start Development

## Prerequisites (Do First!)
- [ ] Run `npm install` to install dependencies
- [ ] Verify `.env` file has valid OpenAI API key
- [ ] Test basic server: `node server.js`
- [ ] Verify server runs on http://localhost:3000

## Priority 1: React Frontend Setup (Day 1-2)
```bash
# Install React and required dependencies
npm install react react-dom @vitejs/plugin-react vite
npm install -D @types/react @types/react-dom
npm install tailwindcss postcss autoprefixer
npm install chart.js react-chartjs-2 d3 @fortawesome/react-fontawesome
```

Create React app structure:
```
/src
  /components
    - ChatInterface.jsx
    - SlideRenderer.jsx
    - SlideEditor.jsx
    - FileUploader.jsx
    - SlideShowMode.jsx
  /agents
    - SetupAgent.js
    - CodingAgent.js
    - RendererAgent.js
  /utils
    - websocket.js
    - api.js
  App.jsx
  main.jsx
```

## Priority 2: Agent Architecture (Day 3-4)
1. Implement Setup Agent:
   - Outline generation from user input
   - Function calling for `generate_pdf`
   - TODO.md file management

2. Enhance Coding Agent:
   - Slide-by-slide generation
   - Web search integration
   - Image/file processing

3. Create Renderer Agent:
   - Real-time slide rendering
   - WebSocket streaming

## Priority 3: Core Features (Day 5-7)
- [ ] Slide navigation system
- [ ] Slideshow mode with fullscreen
- [ ] Export functionality (HTML → PDF)
- [ ] Live editing during generation
- [ ] Proper error handling

## Priority 4: Styling System (Week 2)
- [ ] Implement Tailwind CSS configuration
- [ ] Create slide templates matching examples
- [ ] Add Chart.js visualizations
- [ ] Implement D3.js for diagrams
- [ ] Font Awesome icons

## Quick Start Commands
```bash
# 1. Install all dependencies
npm install

# 2. Create React app structure
mkdir -p src/components src/agents src/utils

# 3. Initialize Tailwind
npx tailwindcss init -p

# 4. Update package.json scripts
npm pkg set scripts.dev="vite"
npm pkg set scripts.build="vite build"
npm pkg set scripts.start="node server.js"

# 5. Run development
npm run dev  # Frontend
npm start    # Backend (in another terminal)
```

## Testing Checklist
- [ ] Can user describe presentation idea?
- [ ] Does agent propose outline?
- [ ] Are slides generated one by one?
- [ ] Do slides render in real-time?
- [ ] Can user upload files/images?
- [ ] Does slideshow mode work?
- [ ] Can export to PDF?
- [ ] Does live editing work? 