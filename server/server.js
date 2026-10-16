import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Phase 2:
//   - import { connectDB } from "./config/db.js" and call it here
//   - mount routers from ./routes onto app (e.g. app.use("/api/products", productRoutes))

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`ShopDesk API server listening on port ${PORT}`);
});

export default app;
