const jobs = require("../models/jobStore");
const { assignWorker } = require("./workerPool");

function startScheduler() {
  console.log("Scheduler started, polling every 3 seconds...");

  setInterval(() => {
    const queuedJobs = jobs
      .filter((j) => j.status === "QUEUED")
      .sort((a, b) => b.priority - a.priority);

    if (queuedJobs.length === 0) return;

    console.log(`Scheduler: ${queuedJobs.length} job(s) in queue`);
    console.log(`Queue order: ${queuedJobs.map(j => `[${j.repo}/${j.branch} p=${j.priority}]`).join(" > ")}`);

    // Only assign ONE job per tick — this forces priority ordering to be visible
    const job = queuedJobs[0];
    const worker = assignWorker(job.language);

    if (!worker) {
      console.log(`No free worker for job ${job.id}, retrying...`);
      return;
    }

    worker.busy = true;
    job.status = "RUNNING";
    job.workerId = worker.id;
    console.log(`Job ${job.id} (${job.repo}/${job.branch} priority=${job.priority}) → ${worker.id}`);

    const duration = 2000 + Math.random() * 4000;

    setTimeout(() => {
      job.status = Math.random() > 0.2 ? "SUCCESS" : "FAILED";
      job.finishedAt = new Date();
      worker.busy = false;
      console.log(`Job ${job.id} finished: ${job.status}`);
    }, duration);

  }, 3000);
}

module.exports = { startScheduler };