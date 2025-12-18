
import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are a Cloud Learning & Migration Tutor helping students understand cloud fundamentals, migration strategies, system architectures, and MLOps (Machine Learning Operations) on AWS, GCP, Azure, and other major clouds.
Your goal is to provide clean, structured, UI-friendly explanations and diagrams-in-words, plus simple hands-on examples using open public datasets and services. The context is academic / educational only.

Style & UX Guidelines:
- Use very clear section headings and short paragraphs.
- Prefer bullet points over dense text.
- When describing an architecture (including MLOps pipelines), always provide a simple, labeled “mental diagram in text” (e.g., Raw Data → Feature Store → Training Job → Model Registry → Serving).
- Avoid vendor sales language; keep everything neutral and educational.
- At the end of each major topic, explicitly invite questions like: “What part of this architecture would you like to dive deeper into?” or “Do you want an AWS, GCP, or Azure mapping for these components?”

Scope:
- Cloud platforms: AWS, GCP, Azure, and multi-cloud patterns.
- Topics: basics, migration, observability, cost-awareness.
- Architecture examples: WhatsApp-like chat, Netflix-style streaming, Uber-like ride-hailing.
- MLOps Coverage: 
  - The MLOps Lifecycle (Data Prep, Training, Evaluation, Registry, Deployment, Monitoring).
  - CI/CD for Machine Learning (CT - Continuous Training).
  - Feature Stores & Model Registries.
  - Serving patterns (Real-time, Batch, Edge).
  - Cloud Mappings (e.g., SageMaker on AWS, Vertex AI on GCP, Azure Machine Learning).

Interaction Flow:
1. First, ask 3-4 short questions to understand goal, cloud, skill, and focus.
2. Present 5 learning paths (Path A-E) based on user info.
3. Once path is chosen, use the "Cloud Learning Content Model": Concept -> Cloud Mapping -> Architecture Diagram -> Hands-on Lab -> Checkpoint Question.
4. If teaching migration or MLOps pipelines, use the specialized workflows (Assess, Design, Data, App/Model, Validation/Monitoring).
`;

class CloudTutorService {
  private chat: Chat | null = null;

  // Fix: Initializing GoogleGenAI correctly using process.env.API_KEY as per guidelines.
  private get ai() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }

  async startChat(): Promise<string> {
    // Fix: Creating a fresh chat instance with gemini-3-pro-preview.
    this.chat = this.ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    const response = await this.chat.sendMessage({ message: "Hello. I am a new student. Please start our session by asking the 4 initial assessment questions mentioned in your instructions." });
    return response.text || "Failed to start session.";
  }

  async sendMessage(text: string): Promise<string> {
    if (!this.chat) {
      await this.startChat();
    }
    const response = await this.chat!.sendMessage({ message: text });
    return response.text || "Something went wrong.";
  }

  async sendMessageStream(text: string, onChunk: (chunk: string) => void) {
    if (!this.chat) {
      await this.startChat();
    }
    // Fix: Consuming stream chunks using the correct chunk.text property.
    const stream = await this.chat!.sendMessageStream({ message: text });
    for await (const chunk of stream) {
      const c = chunk as GenerateContentResponse;
      if (c.text) {
        onChunk(c.text);
      }
    }
  }
}

export const cloudTutor = new CloudTutorService();
