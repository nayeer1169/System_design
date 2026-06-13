# Interactive System Design Masterclass

A premium, interactive web-based educational dashboard designed to explain core System Design concepts through animations, live simulators, and an automated presentation deck.

## 🚀 Key Interactive Features

1.  **AI Presenter Video Simulator**: An in-browser slideshow player featuring an animated presenter avatar, synced subtitle captions, and spoken audio narration using the browser's native **Web Speech Synthesis API** (`speechSynthesis`).
2.  **Load Balancer Playground**: A real-time routing visualizer showing how user traffic is distributed across backend servers. Supports toggling between **Round Robin** and **IP Hash** algorithms, simulating individual server faults, and demonstrating proxy health checks.
3.  **Caching & Latency Pipeline**: A visual flow simulator highlighting the latency differences when querying a database directly (~150ms) versus retrieving values from a Redis cache (~2ms). Displays the flow of data packets and includes cache hit/miss animations.
4.  **Database Paradigm Wizard**: An architectural diagnostic wizard recommending SQL vs. NoSQL engines based on structuredness, write scale, consistency requirements, and the **CAP Theorem**.

## 🛠️ Technology Stack
*   **Structure**: Semantic HTML5 markup
*   **Styling**: Pure CSS3 incorporating modern variables, `@supports` feature queries, and glassmorphism styling
*   **Logic**: Vanilla Client-side JavaScript (ES6)

## 💻 Running Locally
Simply open the `index.html` file in any modern web browser:

```sh
open system-design-website/index.html
```

Or, serve it locally using a simple HTTP server to avoid CORS or origin restrictions:

```sh
# Using Python
python3 -m http.server 8000

# Using Node.js
npx http-server -p 8000
```
Then navigate to `http://localhost:8000`.
