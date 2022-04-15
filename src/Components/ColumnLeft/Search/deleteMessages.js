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

// const waitFor = (time) => {
//   return new Promise((resolve) => {
//     setTimeout(resolve, time)
//   })
// }

/**
 * Async generator return removedCounter for real-time progress
 */
export const deleteMessages = async function* (messages, unselectedMessages = []) {
  const messagesByChat = messageIdsByChat(messages);

  // delete duplicates
  unselectedMessages.forEach((signature) => {
    const [chatId, messageId] = signature.split('_');
    if (messagesByChat[chatId]) {
      messagesByChat[chatId] = messagesByChat[chatId].filter((id) => id !== Number(messageId));
    }
  })

  let removedCount = 0

  for (const chatId in messagesByChat) {
    const ids = messagesByChat[chatId];

    if (!ids.length) {
      yield 0;
    }

    removedCount += ids.length;
    try {
      await TdLibController.send({
        '@type': 'deleteMessages',
        chat_id: chatId,
        message_ids: ids,
        // Remove only for yourself
        revoke: false,
      });
    } catch (e) {
      console.error(e);
    }

    yield removedCount;
  }
}
