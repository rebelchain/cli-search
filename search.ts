import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "dotenv";

config();

interface LegalDocument {
  pasal: string;
  uu: string;
  snippet: string;
  url: string;
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!supabaseUrl || !supabaseKey || !geminiApiKey) {
  console.error(
    "Error: Pastikan SUPABASE_URL, SUPABASE_SECRET_KEY, dan GEMINI_API_KEY ada di file .env",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiApiKey);

async function searchCorpus(query: string): Promise<LegalDocument[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
    const embeddingResult = await model.embedContent(query);
    const queryEmbedding = embeddingResult.embedding.values;

    const { data, error } = await supabase.rpc("match_legal_documents", {
      query_embedding: queryEmbedding,
      match_threshold: 0.75,
      match_count: 5,
    });

    if (error) throw error;

    const results: LegalDocument[] = (data || []).map((doc: any) => ({
      pasal: doc.pasal,
      uu: doc.uu,
      snippet: doc.snippet,
      url: doc.url,
    }));

    console.log(JSON.stringify(results, null, 2));

    return results;
  } catch (err) {
    console.error("Gagal mengeksekusi pencarian Corpus:", err);
    return [];
  }
}

const userQuery = process.argv[2];
if (!userQuery) {
  console.log('Format: npx ts-node search.ts "pertanyaan hukum"');
  process.exit(1);
}

searchCorpus(userQuery);
