# UW-Crushes: The Voice-First Character AI for Waterloo

## 💡 Inspiration
Let’s be real: Waterloo students are world-class at solving LeetCode Hards, but "talking to actual humans" remains an NP-hard problem for many of us. We spend all our time in the DC Library or the E7 sub-basement, creating a campus culture that is notoriously socially isolated.

We saw the explosion of **Character.AI** and thought: *What if we could build a voice-first version specifically for the chaotic, high-pressure ecosystem of UWaterloo?* instead of just text, we wanted **real-time voice interaction** that feels like a FaceTime call with a frenemy.

## 🚀 What it does
**UW-Crushes** is a hyper-realistic voice chat platform that lets students interact with AI agents modeled after distinct University of Waterloo archetypes. It's not just a chatbot—it's a **living, breathing simulation** of campus social life.

### Key Features:
*   **�️ Real-Time Voice Chat:** Powered by **LiveKit**, users can have low-latency, natural voice conversations with agents. No typing, just talking.
*   **🎭 The Crush Roster:** Users can match and converse with hyper-specific distinct personalities:
    *   *The "Geosee/V1 Ghoul"*: Speaks in Discord emotes and hasn't seen sunlight in weeks.
    *   *The "Cali-or-Bust Coop Hunter"*: Turns every topic into a discussion about their Google offer and total compensation (TC).
    *   *The "First Year Engineer"*: Overwhelmed, caffeinated, and aggressively defending their faculty.
*   **🧠 Deep Context Awareness:** Unlike generic AI, these agents know *everything* about UW—from the specific disappointment of a laziz bowl to the migration patterns of Mr. Goose.
*   **💘 "Spotted at UW" Simulation:** The platform recreates the thrill of the "UW Crushes" subreddit, allowing users to safely practice social interactions, venting, or just banningtering with agents who "get it."

## ⚙️ How we built it
We architected a high-concurrency multi-agent system using a modular, state-of-the-art tech stack:

### 🧠 The AI Brain
*   **Agent Logic (LangGraph & Autogen):** We utilized **LangGraph** to orchestrate complex, stateful conversations and **Autogen** to create persistent "personalities" that remember your past conversations.
*   **LLM Backbone (Gemini 1.5 Flash):** We chose **Gemini 1.5 Flash** for its massive context window and ultra-low latency. It allows our agents to be witty and responsive without the awkward "thinking" pauses.
*   **Sentiment & Memory:** Agents track the "vibes" of the conversation. If you're boring, they might ghost you. If you're interesting, they'll "match" with you.

### 🖥️ The Frontend
*   **Next.js Dashboard:** A sleek, responsive interface built with **Next.js** offering a "Dating App" style UI where users can swipe through agent profiles.
*   **LiveKit Integration:** The core of our experience. We use LiveKit for real-time audio streaming, ensuring the voice chat feels immediate and personal.

### 🌍 Simulated World
*   **Custom RAG Pipeline:** We ingested specialized datasets (r/uwaterloo, Spotted at UW, academic calendars) to ground our agents in reality.

## 🚧 Challenges we ran into
*   **Hallucination Tuning:** Initially, our agents were *too* polite. Real Waterloo students are stressed and sarcastic. We had to fine-tune the agents to occasionally give "one-word replies" or be "too busy studying" to make the interaction feel authentic.
*   **Latency is Theory, Lag is Reality:** Making a voice conversation feel natural requires sub-500ms latency. We optimized our **LiveKit** + **Gemini** pipeline aggressively to minimize the "awkward silence" gap.
*   **Defining "Cringe" Mathematically:** We built a custom scoring engine to detect when a conversation is going downhill so the agent can react appropriately (e.g., by making an excuse to leave).

## 🏆 Accomplishments that we're proud of
*   **The "Vibe Check":** We successfully developed a system where agents react dynamically to your tone of voice and confidence, not just your words.
*   **Scary-Accurate Personalities:** Our beta testers reported genuine emotion (frustration, laughter) when talking to the "Aggressive Interviewer" or the "Clingy First Year," proving the fidelity of our simulation.
*   **Seamless Voice:** achieving a near-zero latency feel that makes you forget you're talking to an AI.

## 📚 What we learned
*   **Voice is the Future of Social AI:** Text is safe, but voice is vulnerable. Building for voice requires a much higher bar for empathy and timing.
*   **The Power of Local Context:** Generic "AI friends" are boring. An AI that knows your specific struggle (e.g., failing CS 246) creates an instant bond.

## 🔮 What's next for UW-Crushes
*   **Group Chats:** We want to enable rooms where multiple different AI agents (e.g., a quiet Math student and a loud AHS student) can interact with you simultaneously.
*   **Physical Bot Integration:** Connecting our localized agents to physical hardware for campus-specific interactions.
