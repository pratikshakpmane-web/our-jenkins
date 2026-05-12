const jobService = require("../services/jobService");

exports.createJob = (req, res) => {
  const { repo, branch, language, commits } = req.body;
  const job = jobService.createJob(repo, branch, language || "generic", commits || []);
  res.status(201).json(job);
};

exports.getJobs = (req, res) => {
  res.json(jobService.getAllJobs());
};

exports.getJobById = (req, res) => {
  const job = jobService.getJobById(req.params.id);
  if (!job) return res.status(404).json({ error: "Job not found" });
  res.json(job);
};

exports.handleWebhook = (req, res) => {
  // Handle ping first before touching body
  if (req.headers["x-github-event"] === "ping") {
    console.log("GitHub webhook ping received!");
    return res.status(200).json({ message: "pong" });
  }

  // Guard: body must exist
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(200).json({ message: "Empty body, ignored" });
  }

  // Only handle push events
  if (req.headers["x-github-event"] !== "push") {
    return res.status(200).json({ message: "Event ignored" });
  }

  const payload  = req.body;
  const repo     = payload.repository?.full_name || "unknown/repo";
  const branch   = (payload.ref || "refs/heads/main").replace("refs/heads/", "");
  const commits  = payload.commits || [];
  const language = jobService.detectLanguage(repo, commits);

  console.log(`Webhook: push to ${repo}/${branch} | commits: ${commits.length} | lang: ${language}`);

  const job = jobService.createJob(repo, branch, language, commits);
  res.status(200).json({ received: true, jobId: job.id, priority: job.priority, language });
};