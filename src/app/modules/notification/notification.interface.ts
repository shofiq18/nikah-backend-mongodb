export type TNotification = {
  userId: string;
  type: 'INTEREST_RECEIVED' | 'INTEREST_ACCEPTED' | 'MESSAGE_RECEIVED' | 'PHOTO_REQUEST_RECEIVED' | 'PHOTO_REQUEST_ACCEPTED' | 'ACCOUNT_ALERT';
  title: string;
  message: string;
  path?: string;
  isRead: boolean;
};
