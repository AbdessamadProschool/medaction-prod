import "dotenv/config";
import  db  from "@/lib/db";


async function main() {
   try {
      console.log("Connecting to database...");
      await db.$connect();
      console.log("Database connection established successfully.");
   } catch (error: any) {
      console.error("Database connection failed:");
      console.error(error.message);
      console.error(error.stack);
      process.exit(1);
   } finally {
      await db.$disconnect();
   }
}

main();
