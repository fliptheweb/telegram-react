import TdLibController from '../../../Controllers/TdLibController';

const messageIdsByChat = (messages) => {
  return messages.reduce((acum, message) => {
    const chatId = message.chat_id;
    if (!acum[chatId]) {
      acum[chatId] = [];
    }
    acum[chatId].push(message.id);
    return acum;
  }, {})
}

// FIXME: Use iterator with returned values for messages
export const deleteMessages = async (messages, revoke) => {
  const messagesByChat = messageIdsByChat(messages);

  for (const chatId in messagesByChat) {
    const ids = messagesByChat[chatId];

    await TdLibController.send({
      '@type': 'deleteMessages',
      chat_id: chatId,
      message_ids: ids,
      revoke
    });
  }
}
