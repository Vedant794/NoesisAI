require("dotenv").config();
import express from "express";
import Groq from "groq-sdk";
import { getSystemPrompt } from "./backendPrompt";
import cors from "cors";
import axios from "axios";
import { getFrontendSystemPrompt } from "./frontendPrompt";
import OpenAI from "openai";

const app = express();
const openai = new OpenAI({ apiKey: process.env.OPEN_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
// const

app.use(express.json());
app.use(cors());

app.get("/",(req,res)=>{
  res.send("Yessss");
});

app.post("/api", (req, res) => {
  try {
    const text = req.body.text; // No need for await
    res.send(text);
  } catch (error) {
    res.status(500).send({ error: "Something went wrong" });
  }
});

app.post("/template", async (req, res) => {
  try {
    const template = req.body.template;
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "Your task is to extract the text and return whether the user needs frontend or backend.By default if user ask for clone in their text return frontend always. No need to give any extra text I need only single word frontend or backend",
        },
        {
          role: "user",
          content: template,
        },
      ],
      model: "llama-3.3-70b-versatile",
    });
    res.status(201).json({ message: response.choices[0].message.content });
  } catch (error: any) {
    res.status(500).json({ error: error });
  }
});

//Nodejs Backend to Container Integrity
app.post("/generateurl", async (req, res) => {
  try {
    const parseLlmResponse = await req.body;
    console.log(1);
    if (!parseLlmResponse) {
      res.status(500).json({
        Message: "LLM chutiya hai maine aur Shreyash bhai ne kuch nahi kiya",
      });
    }
    console.log(2);
    // res.json(parseLlmResponse);
    // console.log(parseLlmResponse);
    const generatedUrl = await axios.post(
      "http://20.40.54.7:9000/create-code",
      parseLlmResponse
    );

    console.log(3);
    if (generatedUrl.data.error) {
      res.status(500).json({ Message: generatedUrl.data.error });
    }

    // console.log(generatedUrl);
    console.log(4);

    res.status(201).json({ url: generatedUrl.data });
  } catch (error: any) {
    res.status(500).json({ Message: error });
  }
});

app.post("/chats", async (req, res) => {
  try {
    const promptFromUser = req.body.messages;
    const template = req.body.template;
    if (!promptFromUser) {
      res.status(400).json({ error: "Please provide a prompt" });
    }
    let systemPrompt;
    if (template === "frontend") {
      systemPrompt = getFrontendSystemPrompt();
    } else {
      systemPrompt = getSystemPrompt();
    }
    // const response = await groq.chat.completions.create({
    //   messages: [
    //     {
    //       role: "user",
    //       content: promptFromUser,
    //     },
    //     {
    //       role: "system",
    //       content: systemPrompt,
    //     },
    //   ],
    //   model: "llama-3.3-70b-versatile",
    //   max_tokens: 8000,
    // });

    const response = await openai.chat.completions.create({
      messages: [
        {
          role: "user",
          content: promptFromUser,
        },
        {
          role: "system",
          content: systemPrompt,
        },
      ],
      model: "gpt-4o",
    });

    res.status(201).json({
      role: "Assistant",
      Content: response.choices[0].message.content,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => console.log("Server is running...."));
