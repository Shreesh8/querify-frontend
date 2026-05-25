import { chatApi, api } from "@/lib/api";

export const sendMessage = async (datasetId: string, question: string) => {
  return chatApi.query(datasetId, question);
};

export const listConversations = async (datasetId?: string) => {
  return { conversations: [] };
};

export const getConversation = async (id: string) => {
  return { conversation: null, messages: [] };
};

export const createConversation = async (datasetId: string, title?: string) => {
  return { id: datasetId };
};
