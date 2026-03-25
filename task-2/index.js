import readline from "readline";
import chalk from "chalk";

// Create CLI interface for user input/output
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Track player's score
let score = 0;

// Store selected topic and difficulty
let topic = "";
let difficulty = "easy";

// Helper function to ask questions in CLI using Promises
function ask(text) {
  return new Promise((resolve) => rl.question(text, resolve));
}

// Generate quiz questions (fake data for testing)
// This can later be replaced with an AI API call
function generateQuestions() {
  return [
    {
      question: `(${difficulty}) What is the capital of Netherlands?`,
      answers: ["Rotterdam", "Amsterdam", "Utrecht", "Eindhoven"],
      correct: 2,
    },
    {
      question: `(${difficulty}) 2 + 2 = ?`,
      answers: ["3", "4", "5", "6"],
      correct: 2,
    },
    {
      question: `(${difficulty}) Largest planet?`,
      answers: ["Earth", "Mars", "Jupiter", "Venus"],
      correct: 3,
    },
    {
      question: `(${difficulty}) HTML stands for?`,
      answers: [
        "Hyper Trainer Marking Language",
        "Hyper Text Markup Language",
        "Hyper Text Marketing Language",
        "Hyper Tool Markup Language",
      ],
      correct: 2,
    },
    {
      question: `(${difficulty}) CSS used for?`,
      answers: ["Logic", "Structure", "Styling", "Database"],
      correct: 3,
    },
    {
      question: `(${difficulty}) Node.js runs on?`,
      answers: ["Browser", "Server", "Database", "OS"],
      correct: 2,
    },
    {
      question: `(${difficulty}) Git command to clone?`,
      answers: ["git push", "git clone", "git pull", "git add"],
      correct: 2,
    },
    {
      question: `(${difficulty}) JS framework?`,
      answers: ["React", "Laravel", "Django", "Flask"],
      correct: 1,
    },
    {
      question: `(${difficulty}) Water freezes at?`,
      answers: ["0°C", "10°C", "50°C", "100°C"],
      correct: 1,
    },
    {
      question: `(${difficulty}) Color of sky?`,
      answers: ["Green", "Blue", "Red", "Yellow"],
      correct: 2,
    },
  ];
}

// Ask a single question
async function askQuestion(q, index) {
  // All available answer indexes
  let available = [0, 1, 2, 3];

  // Track if hint already used
  let hintUsed = false;

  while (true) {
    console.log(chalk.blue(`\nQuestion ${index + 1}: ${q.question}`));

    // Show only available answers
    available.forEach((i) => {
      console.log(`${i + 1}. ${q.answers[i]}`);
    });

    const answer = await ask("Your answer (1-4, h for hint, q to quit): ");

    // Quit game
    if (answer === "q") {
      console.log(chalk.yellow("👋 Exiting quiz..."));
      rl.close();
      process.exit(0);
    }

    // Handle hint request
    if (answer === "h" && !hintUsed) {
      hintUsed = true;

      // Keep correct answer + one random wrong answer
      const wrong = available.filter((i) => i !== q.correct - 1);
      available = [
        q.correct - 1,
        wrong[Math.floor(Math.random() * wrong.length)],
      ];

      console.log(chalk.yellow("💡 Hint used! Two options removed."));
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

// Ask user to choose quiz topic
async function chooseTopic() {
  console.log("Choose topic:");
  console.log("1. General Knowledge");
  console.log("2. Programming");
  console.log("3. Geography");

  const answer = await ask("Select topic (1-3 or q to quit): ");

  if (answer === "q") {
    rl.close();
    process.exit(0);
  }

  if (answer === "1") topic = "General Knowledge";
  else if (answer === "2") topic = "Programming";
  else topic = "Geography";
}

// Ask user to choose difficulty
async function chooseDifficulty() {
  console.log("\nChoose difficulty:");
  console.log("1. Easy");
  console.log("2. Medium");
  console.log("3. Hard");

  const answer = await ask("Select difficulty (1-3 or q to quit): ");

  if (answer === "q") {
    rl.close();
    process.exit(0);
  }

  if (answer === "1") difficulty = "easy";
  else if (answer === "2") difficulty = "medium";
  else difficulty = "hard";
}

// Main quiz flow
async function startQuiz() {
  console.log(chalk.yellow("🎮 AI Quiz Game"));

  // Choose topic and difficulty
  await chooseTopic();
  await chooseDifficulty();

  console.log(
    chalk.cyan(`\nStarting quiz: ${topic} | Difficulty: ${difficulty}`),
  );

  // Generate questions
  const questions = generateQuestions();

  // Loop through questions
  for (let i = 0; i < questions.length; i++) {
    await askQuestion(questions[i], i);
  }

  // Show final score
  console.log(chalk.magenta(`\n🎉 Final Score: ${score}/10`));

  // Close CLI
  rl.close();
}

// Start the game
startQuiz();

// Close CLI
rl.on("close", () => {
  process.exit(0);
});
