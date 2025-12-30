import express from "express";
import dotenv, { parse } from "dotenv";
import { initDB, sql } from "./src/config/db.js";
import rateLimiter from "./src//middleware/rateLimiter.js";
import transactionsRoute from "./src/routes/transactionsRoute.js"

// load env variables
dotenv.config();

// express app
const app = express();

//middleware
app.use(rateLimiter);
app.use(express.json());
app.use((req, res, next) => {
  console.log("Hey we hit a req, the method is:", req.method);
  next();
});
app.use("/api/transactions", transactionsRoute);

// start server
initDB().then(() => {
  app.listen(process.env.PORT, () => {
    console.log("Server is up and running on PORT:", process.env.PORT);
  });
});
