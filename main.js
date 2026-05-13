require("dotenv").config();

const express = require("express");
const { spawn } = require("child_process");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 9000;

const DEPLOY_TOKEN = process.env.DEPLOY_TOKEN;
const DEPLOY_SCRIPT = process.env.DEPLOY_SCRIPT;

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

    const deploy = spawn("bash", [DEPLOY_SCRIPT+appName]);

    let logs = "";

    deploy.stdout.on("data", (data) => {

        const text = data.toString();

        console.log(text);

        logs += text;
    });

    deploy.stderr.on("data", (data) => {

        const text = data.toString();

        console.error(text);

        logs += text;
    });

    deploy.on("close", (code) => {

        logs += `\nProcess exited with code ${code}\n`;

        if (code === 0) {
            return res.send(logs);
        }

        return res.status(500).send(logs);
    });
});

app.listen(PORT, () => {
    console.log(`Deploy server running on port ${PORT}`);
});
