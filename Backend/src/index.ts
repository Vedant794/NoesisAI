require("dotenv").config();
import express from "express";
import Groq from "groq-sdk";
import { getSystemPrompt } from "./prompts";
import cors from "cors";

const app = express();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Prompt in the chat url");
});

app.post("/chats", async (req, res) => {
  try {
    const promptFromUser = req.body.messages;
    if (!promptFromUser) {
      res.status(400).json({ error: "Please provide a prompt" });
    }
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: promptFromUser,
        },
        {
          role: "system",
          content: getSystemPrompt(),
        },
      ],
      model: "llama-3.3-70b-versatile",
      max_tokens: 8000,
    });

    res.status(201).json({
      role: "Assistant",
      Content: response.choices[0].message.content,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log("Server is running...."));
