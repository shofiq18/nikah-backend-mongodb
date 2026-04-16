export type TMessage = {
    senderId: string;
    receiverId: string;
    content: string;
    isRead?: boolean;
};
