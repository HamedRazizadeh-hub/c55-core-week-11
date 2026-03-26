import dotenv from "dotenv";
import chalk from "chalk";
import readline from "readline";
import fetch from "node-fetch"; // npm i node-fetch

dotenv.config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.log(chalk.red("⚠️ Please set GITHUB_TOKEN in your .env file"));
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(questionText) {
  return new Promise((resolve) => rl.question(questionText, resolve));
}

// Fallback questions
const fallbackQuestions = [
  {
    question: "Which country has the city of Kyoto?",
    answers: ["China", "Japan", "South Korea", "Thailand"],
    correct: 2,
  },
  {
    question: "What is the largest planet in our solar system?",
    answers: ["Earth", "Saturn", "Jupiter", "Mars"],
    correct: 3,
  },
  {
    question: "Who wrote 'Hamlet'?",
    answers: ["Shakespeare", "Dickens", "Austen", "Hemingway"],
    correct: 1,
  },
];

// Generate questions via GitHub LLM
async function generateQuestions(topic, difficulty) {
  console.log(chalk.yellow("\n🎲 Generating questions via GitHub LLM..."));

  const prompt = `
Generate 10 ${difficulty} multiple-choice questions about ${topic}.
Return ONLY valid JSON array in this format:
[
  {
    "question": "Your question here",
    "answers": ["option1", "option2", "option3", "option4"],
    "correct": 1
  }
]
Do not include extra text or markdown.
`;

  try {
    const response = await fetch(
      "https://api.github.com/openai/deployments/gpt-4o-mini/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github+json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        }),
      },
    );

    if (!response.ok)
      throw new Error(`${response.status} ${response.statusText}`);

    const data = await response.json();

    const text = data.choices?.[0]?.message?.content;

    if (!text) throw new Error("No content in LLM response");

    // Try parse JSON
    const match = text.match(/\[.*\]/s);
    if (!match) throw new Error("Failed to parse JSON");

    const questions = JSON.parse(match[0]);

    // Validate
    if (!Array.isArray(questions) || questions.length !== 10)
      throw new Error("Invalid question array");

    return questions;
  } catch (err) {
    console.log(
      chalk.yellow("⚠️ Could not generate questions from GitHub LLM."),
    );
    console.log(chalk.yellow("Using fallback questions..."));
    return fallbackQuestions;
  }
}

// Show question, get answer, check correctness
async function askQuestion(qObj, index) {
  console.log(chalk.blue(`\nQuestion ${index + 1}: ${qObj.question}`));
  qObj.answers.forEach((ans, i) => console.log(`${i + 1}. ${ans}`));

  while (true) {
    const answer = await ask("Your answer (1-4, h for hint, q to quit): ");

    if (answer.toLowerCase() === "q") {
      console.log(chalk.cyan("\nExiting quiz..."));
      return null;
    }

    if (answer.toLowerCase() === "h") {
      const correctIndex = qObj.correct - 1;
      const hide = [0, 1, 2, 3]
        .filter((i) => i !== correctIndex)
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);
      console.log(chalk.yellow("Hint: possible answers:"));
      qObj.answers.forEach((ans, i) => {
        if (!hide.includes(i)) console.log(`${i + 1}. ${ans}`);
      });
      continue;
    }

    const num = parseInt(answer);
    if ([1, 2, 3, 4].includes(num)) {
      if (num === qObj.correct) {
        console.log(chalk.green("✅ Correct!"));
        return 1;
      } else {
        console.log(
          chalk.red(
            `❌ Wrong! Correct answer: ${qObj.correct}. ${qObj.answers[qObj.correct - 1]}`,
          ),
        );
        return 0;
      }
    } else {
      console.log(chalk.red("⚠️ Please enter 1-4, h for hint, or q to quit."));
    }
  }
}

// Main game
async function startQuiz() {
  console.log(chalk.cyan("🎮 AI Quiz Game"));

  const topics = ["General Knowledge", "Programming", "Geography"];
  topics.forEach((t, i) => console.log(`${i + 1}. ${t}`));
  let topic = "";
  while (true) {
    const t = await ask("Select topic (1-3 or q to quit): ");
    if (t.toLowerCase() === "q") return rl.close();
    const idx = parseInt(t);
    if (idx >= 1 && idx <= topics.length) {
      topic = topics[idx - 1];
      break;
    }
  }

  const difficulties = ["easy", "medium", "hard"];
  difficulties.forEach((d, i) =>
    console.log(`${i + 1}. ${d[0].toUpperCase() + d.slice(1)}`),
  );
  let difficulty = "";
  while (true) {
    const d = await ask("Select difficulty (1-3 or q to quit): ");
    if (d.toLowerCase() === "q") return rl.close();
    const idx = parseInt(d);
    if (idx >= 1 && idx <= difficulties.length) {
      difficulty = difficulties[idx - 1];
      break;
    }
  }

  console.log(
    chalk.cyan(`\nStarting quiz: ${topic} | Difficulty: ${difficulty}`),
  );

  const questions = await generateQuestions(topic, difficulty);

  let score = 0;
  for (let i = 0; i < questions.length; i++) {
    const result = await askQuestion(questions[i], i);
    if (result === null) break;
    score += result;
    console.log(chalk.magenta(`Current score: ${score}`));
  }

  console.log(
    chalk.cyan(
      `\n🏆 Quiz finished! Your score: ${score} / ${questions.length}`,
    ),
  );
  rl.close();
}

rl.on("close", () => process.exit(0));
startQuiz();
