import { dictionaryModel } from "./mongo";
import fs from "fs/promises";
import logger from "@/modules/logger";

const BATCH_SIZE = 1000;

export const getDictionary = async () => {
  try {
    const fileContent = await fs.readFile(
      "src/miniGame/dictionary.txt",
      "utf-8"
    );

    const words = fileContent
      .split("\n")
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    logger.info(`Loaded ${words.length} words from file`);

    let batch: string[] = [];
    let insertedCount = 0;

    for (let i = 0; i < words.length; i++) {
      batch.push(words[i]);

      if (batch.length >= BATCH_SIZE) {
        insertedCount += await processBatch(batch);
        batch = [];
      }
    }

    if (batch.length > 0) {
      insertedCount += await processBatch(batch);
    }

    logger.info(`Dictionary load completed. Newly inserted: ${insertedCount}`);
  } catch (err) {
    logger.error("Dictionary load failed:", err);
  }
};

const processBatch = async (words: string[]) => {
  try {
    const operations = words.map((word) => ({
      updateOne: {
        filter: { word },
        update: { $setOnInsert: { word } },
        upsert: true,
      },
    }));

    const result = await dictionaryModel.bulkWrite(operations, {
      ordered: false,
    });

    // upsertedCount = 실제 새로 insert 된 개수
    return result.upsertedCount || 0;
  } catch (err) {
    logger.warn("Batch processed with some errors (duplicates skipped)");
    return 0;
  }
};
