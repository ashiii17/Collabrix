import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { GitHubService } from "../services/github.js";

export const integrationsRouter = Router();
const github = new GitHubService();

integrationsRouter.use(requireAuth);

integrationsRouter.post("/github/import", async (req, res) => {
  const { owner, repo } = req.body as { owner: string; repo: string };
  res.json({ repository: await github.importRepository(owner, repo) });
});

integrationsRouter.post("/github/commit", async (req, res) => {
  res.json({ commit: await github.commitSolution(req.body) });
});
