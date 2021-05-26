const express = require('express');
const body_parser = require('body-parser');
const db = new (require("./db"))();

app = express();
const port = 8080;

app.post("/query", body_parser.json(), async (req, res) => {
  const q = req.body;
  const data = await db.query(q);
  res.json(data);
});

app.use(express.static("."));

app.listen(port, () => {
  console.log(`listening on http://localhost:${port}`);
})