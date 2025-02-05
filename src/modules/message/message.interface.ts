import { MessageStatus } from 'common/constants/agent';

export interface ISSEMessage {
  data: { content: string };
  type: string;
  id: string;
}

export interface ISSEData {
  answer: string;
  status: MessageStatus;
}
