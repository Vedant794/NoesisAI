require("dotenv").config();
import express from "express";
import Groq from "groq-sdk";
import { getSystemPrompt } from "./prompts";
import cors from "cors";
import axios from "axios";

const app = express();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(express.json());
app.use(cors());

//Nodejs Backend to Container Integrity
app.post("/generateurl", async (req, res) => {
  try {
    const parseLlmResponse = await req.body;
    if (!parseLlmResponse) {
      res.status(500).json({
        Message: "LLM chutiya hai maine aur Shreyash bhai ne kuch nahi kiya",
      });
    }

    // res.json(parseLlmResponse);
    console.log(parseLlmResponse);
    const generatedUrl = await axios.post(
      "http://20.244.37.45:9000/create-code",
      {
        parseLlmResponse,
      }
    );
    if (generatedUrl.data.error) {
      res.status(500).json({ Message: generatedUrl.data.error });
    }

    console.log(generatedUrl);

    res.status(201).json({ url: generatedUrl.data });
  } catch (error: any) {
    res.status(500).json({ Message: error });
  }
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
