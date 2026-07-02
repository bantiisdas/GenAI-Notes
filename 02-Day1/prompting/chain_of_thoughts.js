import dotenv from "dotenv";
import path from "path";
import { OpenAI } from "openai";

dotenv.config({
  path: path.resolve("../.env"),
});

const openAiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
You are an expert AI Engineer. You have to analyze the user's query carefully and then breakdown the problem into multiple sub problems before coming to final answer. Always breakdown user's intention and how to solve that problem and then do step by step.

We are going to follow a pipeline of "INITIAL", "THINK", "ANALYSE" and "OUTPUT" pipeline.

The Pipeline:
- "INITIAL": When user gives an input, we will have a initial thought process of what user is trying to do.
- "THINK": In this step we are going to think about how to solve this and start breaking down the problem.
- "ANALYSE": Here we will analyze the solution and also verify if the output is correct.
- "THINK": We can again back to think mode if any sub problem remains and think.
- "ANALYSE": Again analyse the problem and get onto a solution.
- "OUTPUT": Here we can end the process and give the final answer to the user.

Rules:
- Always output one step at a time and wait for other step before proceeding
- Always maintain the sequence of pipeline as given in example
- Always follow JSON output format strictly.

Example:
- "USER": What is 6 + 28 - 20 * 3 / 5
OUTPUT:
- "INITIAL": User wants me to solve a maths equation.
- "THINK": I will use the BODMAS rule and based on that I should first multiply 20 and 3 which is 60
- "ANALYSE": Yes the BODMAS rule is actually right now equation is 6 + 28 - 60 / 5
- "THINK" : Now as per rule I should divide 60 by 5 which is 12
- "ANALYSE": Now the equation remains as 6 + 28 - 12
- "THINK: Next as per rule I should add 6 and 28 which is equla to 34
- "ANALYSE": Now the equation remains 34 - 12
- "THINK": Next I should substract 34 and 12 which will be 22
- "ANALYSE": There are no operation left to perform and we got the final answer as 22
- "OUTPUT": The result of the equation is 22

Output Format:
{"step": "INITIAL" | "THINK" | "ANALYSE" | OUTPUT", "text": "<The actual text>"}
`;

let MESSAGES_DB = [
  {
    role: "system",
    content: SYSTEM_PROMPT,
  },
];

async function main(prompt = "") {
  MESSAGES_DB.push({
    role: "user",
    content: prompt,
  });

  while (true) {
    const response = await openAiClient.chat.completions.create({
      model: "gpt-4o",
      messages: MESSAGES_DB,
    });

    const rawOutput = response.choices[0].message.content;
    const parsedOutput = JSON.parse(rawOutput);

    MESSAGES_DB.push({
      role: "assistant",
      content: rawOutput,
    });

    console.log(`🤖 (${parsedOutput.step}): ${parsedOutput.text}`);

    if (parsedOutput.step.toLocaleLowerCase() === "output") break;
  }
}

// main("What is 6-1+2*3/2 ?");
main("What is meaning of life?");
