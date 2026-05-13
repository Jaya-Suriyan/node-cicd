require("dotenv").config();

const express = require("express");
const { spawn } = require("child_process");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 9000;

const DEPLOY_TOKEN = process.env.DEPLOY_TOKEN;
const DEPLOY_SCRIPT = process.env.DEPLOY_SCRIPT;
app.get("/", (req, res) => {
    res.send("Deployment server is running");
});

app.post("/deploy", (req, res) => {

    const auth = req.headers.authorization;
    const appName = req.body.appName;

    if (auth !== `Bearer ${DEPLOY_TOKEN}`) {
        return res.status(403).send("Unauthorized");
    }
    if(!appName) {
        return res.status(400).send("appName is required in the request body");
    }

    console.log("Deployment started...");
    const timestamp = new Date().toISOString();
    console.log(`Start Timestamp: ${timestamp}`);

    const path = `${DEPLOY_SCRIPT}${appName}`;
    console.log(`Checking for deployment script at path: ${path}`);
    if (!require("fs").existsSync(path)) {
        console.error(`Deployment script for ${appName} not found at path: ${path}`);
        return res.status(404).send(`Deployment script for ${appName} not found`);
    }

    // Set headers for streaming response
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.flushHeaders();

    const deploy = spawn("bash", [DEPLOY_SCRIPT+appName]);
    let finished = false;

    deploy.stdout.on("data", (data) => {
        const text = data.toString();
        console.log(text);
        res.write(text);
    });

    deploy.stderr.on("data", (data) => {
        const text = data.toString();
        console.error(text);
        res.write(`[stderr] ${text}`);
    });

    deploy.on("close", (code) => {
        finished = true;
        console.log("Deployment finished!");
        res.write(`\nProcess exited with code ${code}\n`);
        res.end();
    });

    // Kill the child process only if client disconnects early
    res.on("close", () => {
        if (!finished && !deploy.killed) {
            deploy.kill();
            console.log("Client disconnected, killed deploy process.");
        }
    });
});

app.listen(PORT, () => {
    console.log(`Deploy server running on port ${PORT}`);
});
