// ===============================================
//  AI QUIZ GAME — GitHub Models Edition
//  Final Clean Version with English Comments
// ===============================================

import OpenAI from "openai";
import dotenv from "dotenv";
import readline from "readline";
import chalk from "chalk";

// Load environment variables
dotenv.config();

// Read GitHub token
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.error("⚠️ Please set GITHUB_TOKEN in your .env file");
  process.exit(1);
}

// ----------------------------------------------------
// Initialize GitHub Models client
// IMPORTANT: baseURL must stop at /inference
// The SDK automatically appends /chat/completions
// ----------------------------------------------------
const client = new OpenAI({
  baseURL: "https://models.github.ai/inference",
  apiKey: GITHUB_TOKEN,
});

// CLI interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Helper for asking questions in CLI
function ask(questionText) {
  return new Promise((resolve) => rl.question(questionText, resolve));
}

let score = 0;

// ----------------------------------------------------
// Generate quiz questions using GitHub LLM
// Includes JSON cleanup and validation
// ----------------------------------------------------
async function generateQuestions(topic, difficulty) {
  console.log("\n🎲 Generating questions via GitHub LLM...");

  const prompt = `
Generate exactly 10 ${difficulty} quiz questions about ${topic}.
Format each question EXACTLY like this:

Q1: What is ...?
A) Option 1
B) Option 2
C) Option 3
D) Option 4
Correct: B

Do NOT use JSON.
Do NOT add explanations.
Do NOT add extra text.
`;

  try {
    const response = await client.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: "Follow the format strictly." },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
    });

    const text = response.choices[0].message.content;

    // ---------------------------------------------
    // Parse the text into JSON
    // ---------------------------------------------
    const blocks = text.split(/Q\d+:/).slice(1);

    const questions = blocks.map((block, index) => {
      const lines = block.trim().split("\n");

      const question = lines[0].trim();

      const answers = [
        lines[1].replace("A)", "").trim(),
        lines[2].replace("B)", "").trim(),
        lines[3].replace("C)", "").trim(),
        lines[4].replace("D)", "").trim(),
      ];

      const correctLine = lines.find((l) => l.startsWith("Correct"));
      const correctLetter = correctLine.split(":")[1].trim();

      const map = { A: 1, B: 2, C: 3, D: 4 };

      return {
        question,
        answers,
        correctAnswer: map[correctLetter],
      };
    });

    if (questions.length !== 10) {
      throw new Error("Model did not return 10 questions");
    }

    return questions;
  } catch (err) {
    console.error("⚠️ Could not generate questions from GitHub LLM.");
    console.error(chalk.yellow("Using fallback questions."));
    console.error(chalk.red(err.message));

    return [
      {
        question: "Which country has the city of Kyoto?",
        answers: ["China", "Japan", "South Korea", "Thailand"],
        correctAnswer: 2,
      },
      {
        question: "What is the largest planet in our solar system?",
        answers: ["Earth", "Jupiter", "Saturn", "Mars"],
        correctAnswer: 2,
      },
    ];
  }
}

// ----------------------------------------------------
// Ask a single question (supports hints)
// ----------------------------------------------------
async function askQuestion(qObj, index) {
  console.log(`\nQuestion ${index + 1}: ${qObj.question}`);
  qObj.answers.forEach((ans, i) => console.log(`${i + 1}. ${ans}`));

  while (true) {
    const answer = await ask("Your answer (1-4, h for hint, q to quit): ");

    // Quit
    if (answer.toLowerCase() === "q") {
      console.log("\nExiting quiz...");
      rl.close();
      return null;
    }

    // Hint
    if (answer.toLowerCase() === "h") {
      const correctIndex = qObj.correctAnswer - 1;

      // Randomly hide 2 wrong answers
      const hide = [0, 1, 2, 3]
        .filter((i) => i !== correctIndex)
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);

      console.log("Hint: possible answers:");
      qObj.answers.forEach((ans, i) => {
        if (!hide.includes(i)) console.log(`${i + 1}. ${ans}`);
      });

      continue;
    }

    // Validate answer
    const num = parseInt(answer);

    if ([1, 2, 3, 4].includes(num)) {
      if (num === qObj.correctAnswer) {
        console.log(chalk.green("✅ Correct!"));
        score++;
      } else {
        console.log(
          chalk.red(
            `❌ Wrong! Correct answer: ${qObj.correctAnswer}. ${qObj.answers[qObj.correctAnswer - 1]}`,
          ),
        );
      }
      break;
    } else {
      console.log("⚠️ Please enter 1-4, h for hint, or q to quit.");
    }
  }
}

// ----------------------------------------------------
// Main quiz flow
// ----------------------------------------------------
async function startQuiz() {
  console.log("🎮 AI Quiz Game");

  const topics = ["General Knowledge", "Programming", "Geography"];
  topics.forEach((t, i) => console.log(`${i + 1}. ${t}`));

  // Select topic
  let topic = "";
  while (true) {
    const tInput = await ask("Select topic (1-3 or q to quit): ");
    if (tInput.toLowerCase() === "q") return rl.close();
    const tNum = parseInt(tInput);
    if (tNum >= 1 && tNum <= topics.length) {
      topic = topics[tNum - 1];
      break;
    }
  }

  // Select difficulty
  const difficulties = ["easy", "medium", "hard"];
  difficulties.forEach((d, i) =>
    console.log(`${i + 1}. ${d[0].toUpperCase() + d.slice(1)}`),
  );

  let difficulty = "";
  while (true) {
    const dInput = await ask("Select difficulty (1-3 or q to quit): ");
    if (dInput.toLowerCase() === "q") return rl.close();
    const dNum = parseInt(dInput);
    if (dNum >= 1 && dNum <= difficulties.length) {
      difficulty = difficulties[dNum - 1];
      break;
    }
  }

  console.log(`\nStarting quiz: ${topic} | Difficulty: ${difficulty}`);

  const questions = await generateQuestions(topic, difficulty);

  for (let i = 0; i < questions.length; i++) {
    const res = await askQuestion(questions[i], i);
    if (res === null) break;
  }

  console.log(`\n🏆 Quiz finished! Your score: ${score} / ${questions.length}`);
  rl.close();
}

// Exit handler
rl.on("close", () => process.exit(0));

// Start the game
startQuiz();
