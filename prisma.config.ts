// import "dotenv/config";
// import { defineConfig, env } from "prisma/config";

// export default defineConfig({
//   schema: "prisma/schema.prisma",
//   migrations: {
//     path: "prisma/migrations",
//   },
//   datasource: {
   
//     url: env("DATABASE_URL"),    // ici on récupère la variable d'environnement
//   },
// });
import { defineConfig } from 'prisma/config';
import 'dotenv/config';

export default defineConfig({
  datasource: {

    url: process.env.DATABASE_URL!,

  },
});
