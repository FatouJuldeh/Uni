// Installation initiale : crée .env si absent, applique les migrations, charge les données de démo.
import { existsSync, copyFileSync } from "node:fs";
import { execSync } from "node:child_process";

if (!existsSync(".env")) {
  copyFileSync(".env.example", ".env");
  console.log("Fichier .env créé à partir de .env.example");
}
const run = (cmd) => execSync(cmd, { stdio: "inherit" });
run("npx prisma migrate deploy");
run("npx prisma generate");
run("npx tsx prisma/seed.ts");
console.log("\nPrêt ! Lancez `npm run dev` puis ouvrez http://localhost:3000");
