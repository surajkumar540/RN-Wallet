import express from "express";
import dotenv, { parse } from "dotenv";
import { initDB, sql } from "./config/db.js";
import rateLimiter from "./middleware/rateLimiter.js";
dotenv.config();
import transactionsRoute from "./routes/transactionsRoute.js";

const app = express();

//middleware
app.use(rateLimiter);
app.use(express.json());

app.use((req, res, next) => {
  console.log("Hey we hit a req, the method is:", req.method);
  next();
});

app.get("/", (req, res) => {
  res.send("its working");
});

app.use("/api/transactions", transactionsRoute);

initDB().then(() => {
  app.listen(process.env.PORT, () => {
    console.log("Server is up and running on PORT:", process.env.PORT);
  });
});
