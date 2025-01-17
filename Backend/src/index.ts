require("dotenv").config();
import express from "express";
import Groq from "groq-sdk";
import { getSystemPrompt } from "./prompts";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: "Create a movie api model",
      },
      {
        role: "system",
        content: getSystemPrompt(),
      },
    ],
    model: "llama-3.3-70b-versatile",
    max_tokens: 8000,
  });
  console.log(completion.choices[0].message.content);
}

main();
