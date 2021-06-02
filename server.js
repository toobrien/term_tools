const express = require("express");
const body_parser = require("body-parser");
const db = new (require("./db"))();
const fs = require("fs");

app = express();
const port = 8080;
const config = JSON.parse(fs.readFileSync("./config.json", "utf-8"));

app.post("/query", body_parser.json(), async (req, res) => {
  const q = req.body;
  const data = await db.query(q);
  res.json(data);
});

app.get("/config", (req, res) => { res.json(config); });

app.use(express.static("."));

app.listen(port, () => {
  console.log(`listening on ${config.server_uri}`);
})