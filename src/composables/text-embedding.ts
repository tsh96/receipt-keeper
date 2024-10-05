import { GoogleGenerativeAI, TaskType } from "@google/generative-ai";
import { useSettings } from "./settings";

export async function textEmbedding(text: string) {
  const setting = useSettings();

  const genAI = new GoogleGenerativeAI(setting.value.geminiApiKey);
  const model = genAI.getGenerativeModel({ model: 'models/text-embedding-004' });

  const generatedContent = await model.embedContent({
    content: {
      parts: [{
        text: text
      }],
      role: ''
    },
    taskType: TaskType.SEMANTIC_SIMILARITY
  });
  return generatedContent.embedding.values
}

export function dotProducts(a: number[], b: number[]) {
  return a.reduce((acc, val, i) => acc + val * b[i], 0);
}