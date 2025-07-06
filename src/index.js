const express = require("express");
const dotenv = require("dotenv");
const identifyRouter = require("./routes/identify");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/identify", identifyRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
