import dotenv from "dotenv";
import path from "path";
import { OpenAI } from "openai";

dotenv.config({
  path: path.resolve("../.env"),
});

const openAiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  const response = await openAiClient.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: userQuery,
      },
    ],
  });
  console.log(response.choices[0].message.content);
}

const userQuery = "what is 2+2?";

main();
