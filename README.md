# getitdone – Cycle-Aware Productivity Dashboard
**Using artificial intelligence to align tasks with menstrual cycle, helping women unlock peak performance across every phase..**

<img width="1872" height="883" alt="cycle" src="https://github.com/user-attachments/assets/fdc206d6-acb9-4407-a1b0-6cb67760e9c1" />


---

## 🛠 Tech Stack

- **Next.js + TypeScript** — React framework for rapid development
- **Tailwind CSS** — utility-first styling
- **Mastra Agent Framework** — orchestrates agent logic for contextual task nudges
- **Gemini API** — interprets natural-language tasks and maps them to cycle phases  
  _Example: “brainstorm ideas” → Follicular_
- **CedarOS** — policy-driven guardrails around user input & AI suggestions
- **Cloudflare** — global hosting & deployment
- **GoDaddy** — domain registration (`getitdone.app`)
- **Supabase / PostgreSQL (planned)** — persistence & multi-user login

---

## ⚡ How We Built It

- Built the **UI** in Next.js + TypeScript with Tailwind for a fast, clean design
- Modeled a **task manager** with React `useState` (add, toggle, complete tasks)
- Created a **cycle wheel visualization** and **Today’s Focus** panel with React components
- Integrated **Gemini API** to parse task descriptions and recommend the optimal phase
- Used **Mastra** to power agent-based logic (phase-aware nudges like _✨ Great fit today_)
- Applied **CedarOS** to enforce policies and keep AI suggestions safe & scoped
- Deployed the demo via **Cloudflare** with a custom **GoDaddy domain**

---

## 🚀 Hackathon Outcome

- A polished **phase-aware dashboard** built in a weekend
- Integrated **Mastra + Gemini API + CedarOS** into one workflow
- Shipped live on a custom domain so anyone can try it instantly

---

## ⚖️ Disclaimer

This project is for educational/demo purposes only and is **not medical advice**.
