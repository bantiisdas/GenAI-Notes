import "dotenv/config";
import { OpenAI } from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

client.chat.completions
  .create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: "Hello!",
      },
    ],
  })
  .then((response) => console.log(response.choices[0].message));
