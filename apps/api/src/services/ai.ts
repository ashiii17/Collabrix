import OpenAI from "openai";
import { env } from "../config/env.js";

const client = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

export class AiService {
  async reviewCode(args: { code: string; language: string; context?: string }) {
    if (!client) {
      return {
        readabilityScore: 82,
        complexity: "Unavailable without OPENAI_API_KEY. Static placeholder review generated.",
        suggestions: ["Configure OPENAI_API_KEY to enable full semantic review."],
        potentialBugs: [],
        bestPractices: ["Add tests around edge cases.", "Document input and output assumptions."]
      };
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Return concise JSON code review feedback for interview and contest submissions." },
        { role: "user", content: JSON.stringify(args) }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0]?.message.content ?? "{}") as unknown;
  }

  async interviewFeedback(args: { transcript?: string; code: string; language: string; problem?: string }) {
    if (!client) {
      return {
        overallScore: 78,
        summary: "AI feedback requires OPENAI_API_KEY. Placeholder feedback generated.",
        strengths: ["Structured solution attempt"],
        improvements: ["Discuss tradeoffs and complexity more explicitly."]
      };
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Return concise JSON interview feedback with scoring, communication, and coding assessment." },
        { role: "user", content: JSON.stringify(args) }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0]?.message.content ?? "{}") as unknown;
  }
}
