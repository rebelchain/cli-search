import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
import data from "./data.json";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function seedData() {
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-2" });

  console.log("Ingest data\n");

  for (const doc of data) {
    try {
      const embeddingResult = await model.embedContent(doc.snippet);
      const embedding = embeddingResult.embedding.values;

      const { error } = await supabase.from("legal_corpus").insert({
        pasal: doc.pasal,
        uu: doc.uu,
        snippet: doc.snippet,
        url: doc.url,
        embedding: embedding,
      });

      if (error) throw error;
      console.log(`insert successful: ${doc.pasal}`);
    } catch (err) {
      console.error(`insert failed ${doc.pasal}:`, err);
    }
  }
  console.log("\nprocess completed.");
}

seedData();
