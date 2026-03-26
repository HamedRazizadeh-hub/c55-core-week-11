import readline from "readline";
import chalk from "chalk";
import OpenAI from "openai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Create Groq client (OpenAI compatible)
const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// CLI interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Track score
let score = 0;

// Selected options
let topic = "";
let difficulty = "easy";

// Helper to ask CLI questions
function ask(text) {
  return new Promise((resolve) => rl.question(text, resolve));
}

// Generate quiz questions using LLM
async function generateQuestions() {
  console.log(chalk.yellow("🤖 Generating questions with AI...\n"));

  const randomSeed = Math.floor(Math.random() * 100000);

  const response = await client.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature: 0.9,
    messages: [
      {
        role: "user",
        content: `Generate 10 ${difficulty} quiz questions about ${topic}.
Avoid repeating common quiz questions.
Use randomness seed: ${randomSeed}

Return ONLY JSON array.
No explanation.
No markdown.

Format:
[
  {
    "question": "text",
    "answers": ["a","b","c","d"],
    "correct": 1
  }
]`,
      },
    ],
  });

  let text = response.choices[0].message.content;

  try {
    // remove markdown code blocks if exist
    text = text.replace(/```json/g, "").replace(/```/g, "");

    // extract JSON array
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]") + 1;
    text = text.substring(start, end);

    return JSON.parse(text);
  } catch (error) {
    console.log(chalk.red("❌ Failed to parse AI response"));
    console.log(text);
    process.exit(1);
  }
}

// Ask one question
async function askQuestion(q, index) {
  let available = [0, 1, 2, 3];
  let hintUsed = false;

  while (true) {
    console.log(chalk.blue(`\nQuestion ${index + 1}: ${q.question}`));

    available.forEach((i) => {
      console.log(`${i + 1}. ${q.answers[i]}`);
    });

    const answer = await ask("Your answer (1-4, h for hint, q to quit): ");

    // Quit
    if (answer === "q") {
      rl.close();
      return;
    }

    // Hint
    if (answer === "h" && !hintUsed) {
      hintUsed = true;

      const wrong = available.filter((i) => i !== q.correct - 1);
      available = [
        q.correct - 1,
        wrong[Math.floor(Math.random() * wrong.length)],
      ];

      console.log(chalk.yellow("💡 Hint used!"));
      continue;
    }

    // Check answer
    if (Number(answer) === q.correct) {
      console.log(chalk.green("✅ Correct!"));
      score++;
    } else {
      console.log(
        chalk.red(
          `❌ Wrong! Correct answer: ${q.correct}. ${q.answers[q.correct - 1]}`,
        ),
      );
    }

    break;
  }
}

// Choose topic
async function chooseTopic() {
  console.log("Choose topic:");
  console.log("1. General Knowledge");
  console.log("2. Programming");
  console.log("3. Geography");

  const answer = await ask("Select topic (1-3 or q to quit): ");

  if (answer === "q") {
    rl.close();
    return;
  }

  if (answer === "1") topic = "General Knowledge";
  else if (answer === "2") topic = "Programming";
  else topic = "Geography";
}

// Choose difficulty
async function chooseDifficulty() {
  console.log("\nChoose difficulty:");
  console.log("1. Easy");
  console.log("2. Medium");
  console.log("3. Hard");

  const answer = await ask("Select difficulty (1-3 or q to quit): ");

  if (answer === "q") {
    rl.close();
    return;
  }

  if (answer === "1") difficulty = "easy";
  else if (answer === "2") difficulty = "medium";
  else difficulty = "hard";
}

// Main quiz flow
async function startQuiz() {
  console.log(chalk.yellow("🎮 AI Quiz Game"));

  await chooseTopic();
  await chooseDifficulty();

  console.log(
    chalk.cyan(`\nStarting quiz: ${topic} | Difficulty: ${difficulty}`),
  );

  const questions = await generateQuestions();

  for (let i = 0; i < questions.length; i++) {
    await askQuestion(questions[i], i);
  }

  console.log(chalk.magenta(`\n🎉 Final Score: ${score}/10`));
  rl.close();
}

startQuiz();

// Close CLI properly
rl.on("close", () => {
  process.exit(0);
});
