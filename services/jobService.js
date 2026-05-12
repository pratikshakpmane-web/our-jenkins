const { v4: uuidv4 } = require("uuid");
const jobs = require("../models/jobStore");
const { extractStages } = require("./parserService");

function detectLanguage(repoName = "", commits = []) {
  const text = [repoName, ...commits.map((c) => c.message || "")]
    .join(" ").toLowerCase();
  if (text.includes("python") || text.includes(".py")) return "python";
  if (text.includes("java")   || text.includes(".java")) return "java";
  if (text.includes("node")   || text.includes(".js"))   return "node";
  return "generic";
}

function calculatePriority(branch = "", language = "generic") {
  const branchScores = { main: 3, master: 3, staging: 2, develop: 1, dev: 1 };
  const branchKey = Object.keys(branchScores).find(k => branch.toLowerCase().includes(k));
  const branchScore = branchScores[branchKey] || 1;

  const langScores = { java: 3, node: 2, python: 1, generic: 0 };
  const langScore = langScores[language] || 0;

  const total = branchScore + langScore;
  console.log(`Priority calc: branch(${branch})=${branchScore} + lang(${language})=${langScore} => ${total}`);
  return total;
}

exports.createJob = (repo, branch, language = "generic", commits = []) => {
  const id = uuidv4();

  const fakeJenkinsfile = `
    stage('Build')
    stage('Test')
    stage('Deploy')
  `;

  const stages = extractStages(fakeJenkinsfile);
  const priority = calculatePriority(branch, language);

  const job = {
    id,
    repo,
    branch,
    language,
    priority,
    status: "QUEUED",
    stages,
    workerId: null,
    createdAt: new Date(),
    finishedAt: null,
  };

  jobs.push(job);
  console.log(`Job created: ${id} | repo: ${repo} | branch: ${branch} | lang: ${language} | priority: ${priority}`);
  return job;
};

exports.getAllJobs = () => jobs;
exports.getJobById = (id) => jobs.find((j) => j.id === id);
exports.detectLanguage = detectLanguage;
exports.calculatePriority = calculatePriority;