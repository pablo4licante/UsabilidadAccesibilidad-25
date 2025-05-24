import cors from "cors";
import express from "express";
import path from "path";

import assetRoutes from "./routes/asset.routes";
import userRoutes from "./routes/user.routes";
import projectRoutes from "./routes/project.routes";

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

// sirve los ficheros subidos
app.use(
  "/uploads",
  express.static(path.resolve(__dirname, "../uploads"), {
    setHeaders: (res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    },
  })
);

app.options("*", cors());

app.get("/", (_req, res) => {
  res.send("Moshi Moshi!~");
});

app.use("/api/assets", assetRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);

export default app;
