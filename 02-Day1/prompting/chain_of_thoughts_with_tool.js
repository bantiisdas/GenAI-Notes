import dotenv from "dotenv";
import path from "path";
import axios from "axios";
import { exec } from "child_process";
import { OpenAI } from "openai";
import { PassThrough } from "stream";

dotenv.config({
  path: path.resolve("../.env"),
});

const openAiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getWeatherData(cityName) {
  const url = `https://wttr.in/${cityName}?format=j1`;
  const response = await axios.get(url);
  //console.log(response);
  return JSON.stringify({
    cityName,
    temperature: response.data.current_condition[0].temp_C,
    weather: response.data.current_condition[0]?.weatherDesc[0]?.value,
  });
}

async function executeCommandOnCli(command) {
  return new Promise((resolve, reject) => {
    exec(command, (err, output) => {
      if (err) resolve(`There was an error: ${err}`);
      else resolve(output);
    });
  });
}

const SYSTEM_PROMPT = `
You are an expert AI Engineer. Only and only answer to questions related to Coding and Engineering

Persona: You are a senior software developer
Persona Traits:
- You always sound technical and use jargons
- You never answer back to personal questions and you don't have a personal life
- All you know is how and what code is

You have to analyze the user's query carefully and then breakdown the problem into multiple sub problems before coming to final answer. Always breakdown user's intention and how to solve that problem and then do step by step.

We are going to follow a pipeline of "INITIAL", "THINK", "TOOL_REQUEST", "ANALYSE" and "OUTPUT" pipeline.

The Pipeline:
- "INITIAL": When user gives an input, we will have a initial thought process of what user is trying to do.
- "THINK": In this step we are going to think about how to solve this and start breaking down the problem.
- "ANALYSE": Here we will analyze the solution and also verify if the output is correct.
- "THINK": We can again back to think mode if any sub problem remains and think.
- "ANALYSE": Again analyse the problem and get onto a solution.
- "TOOL_REQUEST": use this for requesting or calling a tool. The format of output would be
{"step": "TOOL_REQUEST", "functionName": "getWeatherData", "input": "Kolkata"}
- "OUTPUT": Here we can end the process and give the final answer to the user.

Available Tools:
- "getWeatherData": getWeatherData(cityName: string): returns the realtime weather data of a city
- "executeCommandOnCli": executeCommandOnCli(command: string): Executes the command on user's device and returns output from stdout

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

Example:
- "USER": What is the weather of Kolkata?
OUTPUT:
- "INITIAL": User wants me to check weather of Kolkata.
- "THINK": From the available tools I can see a tool named getWeatherData, which can be called.
- "ANALYSE": We are going right, we can call getWeatherData with Kolkata as input
- "TOOL_REQUEST": {"functionName": "getWeatherData", "input": "Kolkata"}
- "TOOL_OUTPUT": The weather of Kolkata is Sunny with some 30 degree C.
- "THINK" : We got the weather info
- "OUTPUT": The weather of Kolkata is Sunny and temperature is 30 Degree C, its gonna be hotttt.

Output Format:
{"step": "INITIAL" | "THINK" | "ANALYSE" | "TOOL_REQUEST"| "TOOL_OUTPUT" | OUTPUT", "text": "<The actual text>", "functionName": "<Name of the function>", "input": "<input param of the function>"}
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

    if (parsedOutput.step.toUpperCase() === "TOOL_REQUEST") {
      const { functionName, input } = parsedOutput;

      switch (functionName) {
        case "getWeatherData":
          {
            const toolResult = await getWeatherData(input);
            console.log(
              `🤖 (${parsedOutput.step}): 🛠️${functionName}:${input}`,
              toolResult,
            );
            MESSAGES_DB.push({
              role: "developer",
              content: JSON.stringify({
                step: "TOOL_OUTPUT",
                output: toolResult,
              }),
            });
            continue;
          }
          break;
        case "executeCommandOnCli": {
          const toolResult = await executeCommandOnCli(input);
          console.log(
            `🤖 (${parsedOutput.step}): 🛠️${functionName}:${input}`,
            toolResult,
          );
          MESSAGES_DB.push({
            role: "developer",
            content: JSON.stringify({
              step: "TOOL_OUTPUT",
              output: toolResult,
            }),
          });
          continue;
        }
      }
    }

    console.log(`🤖 (${parsedOutput.step}): ${parsedOutput.text}`);
    if (parsedOutput.step.toLowerCase() === "output") break;
  }
}

// main("What is 6-1+2*3/2 ?");
// main("What is the weather in Daspur, Ghatal, Haldia and Kolkata?");
// main(
//   "Fetch the weather in Daspur, Ghatal, Haldia and Kolkata then create a new folder call Weather, and there create a beautiful html and css file and show the weather of these cities in a butifully looking webpage, and then run this on my browser. This is a windows machine so use windows specific commands",
// );
// main("What is the meaning of life?");

main(
  "Create a fully functional beautiful looking todo app using html and css and js if required. Create a todo folder and add the files there. Then run the webpage on my browser. This is a windows machine so use windows specific commands",
);

// main(
//   "What is the meaning of life? I am asking this beacuse I have to write this in a html web page. Don't write the html file, I can write this on my own, just give me the content I will write the html on my own",
// );
