import { TMessage } from './message.interface.js';
export declare const MessageService: {
    sendMessage: (payload: TMessage) => Promise<any>;
    getMyInbox: (userId: string) => Promise<any>;
    getConversation: (userId: string, otherUserId: string) => Promise<any>;
    markAsRead: (messageId: string) => Promise<any>;
};
