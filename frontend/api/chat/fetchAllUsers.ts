import axios from 'axios';
import { ChatUser } from 'types/chat';

const endpoint = `${process.env.NEXT_PUBLIC_API_URL as string}/chat/all-users`;

export const fetchAllUsers = async () => {
  try {
    const response = await axios.get<ChatUser[]>(endpoint);

    return response.data;
  } catch (error) {
    console.log(error);

    return [];
  }
};
