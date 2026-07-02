import { Redis } from "@upstash/redis";

export const redis = Redis.fromEnv();

export const KEYS = {
  wordsList: "words:list",                     // ZSet: score=timestamp, member=wordId
  word: (id: string) => `word:${id}`,          // Hash: all word fields
  userKnown: (userId: string) => `user:${userId}:known`,   // Set of known wordIds
  userProgress: (userId: string) => `user:${userId}:progress`, // Hash: wordId -> seen count
  bookTopics: "book:topics",                   // Set of unique topic strings
};
