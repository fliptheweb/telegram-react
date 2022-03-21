/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import KeyboardManager, { KeyboardHandler } from '../../Additional/KeyboardManager';
import CloseIcon from '../../../Assets/Icons/Close';
import IconButton from '@material-ui/core/IconButton';
import Chat from '../../Tile/Chat';
import TopChat from '../../Tile/TopChat';
import RecentlyFoundChat from '../../Tile/RecentlyFoundChat';
import FoundPublicChat from '../../Tile/FoundPublicChat';
import FoundMessage from '../../Tile/FoundMessage';
import SectionHeader from '../SectionHeader';
import { loadChatsContent, loadUsersContent } from '../../../Utils/File';
import { filterDuplicateMessages } from '../../../Utils/Message';
import { getCyrillicInput, getLatinInput } from '../../../Utils/Language';
import { orderCompare } from '../../../Utils/Common';
import { getChatOrder } from '../../../Utils/Chat';
import { modalManager } from '../../../Utils/Modal';
import { SCROLL_PRECISION, SEARCH_GLOBAL_TEXT_MIN, USERNAME_LENGTH_MIN } from '../../../Constants';
import { DRUGS } from '../../../SearchGroups';
import ChatStore from '../../../Stores/ChatStore';
import FileStore from '../../../Stores/FileStore';
import MessageStore from '../../../Stores/MessageStore';
import UserStore from '../../../Stores/UserStore';
import TdLibController from '../../../Controllers/TdLibController';
import './Search.css';

class Search extends React.Component {
    constructor(props) {
        super(props);

        this.keyboardHandler = new KeyboardHandler(this.handleKeyDown);
        this.listRef = React.createRef();
        this.state = {
            selectedMessages: []
        };
    }

    componentDidMount() {
        const { text } = this.props;

        this.searchOrLoadContent(text);

        KeyboardManager.add(this.keyboardHandler);
    }

    componentWillUnmount() {
        KeyboardManager.remove(this.keyboardHandler);
    }

    handleKeyDown = event => {
        if (modalManager.modals.length > 0) {
            return;
        }

        if (event.isComposing) {
            return;
        }

        // switch (event.key) {
        //     case 'Escape':
        //         event.preventDefault();
        //         event.stopPropagation();
        //         event.target.blur();

        //         this.handleClose();
        //         break;
        // }
    };

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { chatId, text } = this.props;

        if (prevProps.text !== text) {
            this.searchOrLoadContent(text);
        } else if (prevProps.chatId !== chatId) {
            this.searchOrLoadContent(text);
        }
    }

    searchOrLoadContent(text) {
        const trimmedText = text ? text.trim() : '';

        // if (!trimmedText) {
            // this.loadContent();
        // } else {
        this.searchText(trimmedText);
        // }
    }

    concatSearchResults = results => {
        const arr = [];
        const map = new Map();

        for (let i = 0; i < results.length; i++) {
            let result = results[i] && results[i].chat_ids;
            if (result) {
                for (let j = 0; j < result.length; j++) {
                    if (!map.has(result[j])) {
                        map.set(result[j], result[j]);
                        arr.push(result[j]);
                    }
                }
            }
        }

        arr.sort((a, b) => {
            return orderCompare(getChatOrder(b), getChatOrder(a));
        });

        return arr;
    };

    searchText = async text => {
        this.sessionId = new Date();
        this.text = text;
        const sessionId = this.sessionId;
        let store = null;

        // console.log('[se] searchText=' + text);

        const { chatId } = this.props;
        // const { savedMessages } = this.state;

        // if (!chatId) {
        //     const promises = [];
        //     const localPromise = TdLibController.send({
        //         '@type': 'searchChats',
        //         query: text,
        //         limit: 100
        //     });
        //     promises.push(localPromise);

        //     const latinText = getLatinInput(text);
        //     if (latinText && latinText !== text) {
        //         const latinLocalPromise = TdLibController.send({
        //             '@type': 'searchChats',
        //             query: latinText,
        //             limit: 100
        //         });
        //         promises.push(latinLocalPromise);
        //     }

        //     const cyrillicText = getCyrillicInput(text);
        //     if (cyrillicText && cyrillicText !== text) {
        //         const cyrillicLocalPromise = TdLibController.send({
        //             '@type': 'searchChats',
        //             query: cyrillicText,
        //             limit: 100
        //         });
        //         promises.push(cyrillicLocalPromise);
        //     }

        //     const results = await Promise.all(promises.map(x => x.catch(e => null)));
        //     const local = this.concatSearchResults(results);

        //     if (sessionId !== this.sessionId) {
        //         return;
        //     }

        //     if (savedMessages) {
        //         const { t } = this.props;

        //         const searchText = text.toUpperCase();
        //         const savedMessagesStrings = ['SAVED MESSAGES', t('SavedMessages').toUpperCase()];

        //         if (
        //             savedMessagesStrings.some(el => el.includes(searchText)) ||
        //             (latinText && savedMessagesStrings.some(el => el.includes(latinText.toUpperCase())))
        //         ) {
        //             local.splice(0, 0, savedMessages.id);
        //         }
        //     }

        //     this.setState({
        //         top: null,
        //         recentlyFound: null,
        //         local: local
        //     });

        //     store = FileStore.getStore();
        //     loadChatsContent(store, local);

        //     // let trimmedText = text.trim();
        //     // trimmedText = trimmedText.startsWith('@') ? trimmedText.substr(1) : trimmedText;
        //     // if (trimmedText.length >= SEARCH_GLOBAL_TEXT_MIN) {
        //     //     trimmedText = trimmedText.length === SEARCH_GLOBAL_TEXT_MIN ? trimmedText + '.' : trimmedText;

        //     //     const globalPromises = [];

        //     //     // const globalPromise = TdLibController.send({
        //     //     //     '@type': 'searchPublicChats',
        //     //     //     query: trimmedText
        //     //     // });
        //     //     // globalPromises.push(globalPromise);

        //     //     // if (latinText) {
        //     //     //     let latinTrimmedText = latinText.trim();
        //     //     //     latinTrimmedText = latinTrimmedText.startsWith('@') ? latinTrimmedText.substr(1) : latinTrimmedText;
        //     //     //     if (latinTrimmedText.length >= USERNAME_LENGTH_MIN && latinTrimmedText !== trimmedText) {
        //     //     //         const globalLatinPromise = TdLibController.send({
        //     //     //             '@type': 'searchPublicChats',
        //     //     //             query: latinTrimmedText
        //     //     //         });
        //     //     //         globalPromises.push(globalLatinPromise);
        //     //     //     }
        //     //     // }

        //     //     const globalResults = await Promise.all(globalPromises.map(x => x.catch(e => null)));
        //     //     const global = this.concatSearchResults(globalResults);

        //     //     if (sessionId !== this.sessionId) {
        //     //         return;
        //     //     }

        //     //     this.setState({
        //     //         global
        //     //     });

        //     //     store = FileStore.getStore();
        //     //     loadChatsContent(store, global);
        //     // } else {
        //     //     this.setState({
        //     //         global: null
        //     //     });
        //     // }
        //     this.setState({
        //         global: null
        //     });
        // }

        ////////////////////////////////////////////
        //
        let messages = [];
        // if (chatId) {
        //     messages = await TdLibController.send({
        //         '@type': 'searchChatMessages',
        //         chat_id: chatId,
        //         query: text,
        //         sender_user_id: 0,
        //         from_message_id: 0,
        //         offset: 0,
        //         limit: 50,
        //         filter: null
        //     });
        // } else {

        // const textGroup = DRUGS;
        const textGroup = ['меф'];
        const promises = [];
        textGroup.map((text) => {
            promises.push(this.handleLoadMessages(text));
        });

        const promisesResult = await Promise.all(promises);
        const sortByTime = (a, b) => (b.date - a.date);
        let DEFAULT_ACCUM = {
            '@type': 'messages',
            '@client_id': 1,
            '@extra': {
                query_id: 20
            },
            messages: [],
            total_count: 0,
        }
        messages = promisesResult.reduce((accum, item) => {
            accum = {
                ...accum,
                total_count: accum.total_count + item.total_count,
                messages: [
                    ...accum.messages,
                    ...item.messages,
                ]
            };
            return accum;
        }, DEFAULT_ACCUM);
        // messages = await this.handleLoadMessages(text);
        // this.handleLoadMessages(text);
        messages = {
            ...messages,
            messages: messages.messages.sort(sortByTime),
        }

        const selectedMessages = messages.messages.map((item) => {
            return `${item.chat_id}_${item.id}`;
        })

        MessageStore.setItems(messages.messages);

        // console.log('[se] searchText=' + text + ' result', messages, linkMessage);

        if (sessionId !== this.sessionId) {
            return;
        }

        // console.log('[se] searchText=' + text + ' result session', messages, linkMessage);

        this.setState({
            messages,
            selectedMessages,
        });

        const chats = new Map();
        const users = new Map();
        for (let i = 0; i < messages.messages.length; i++) {
            chats.set(messages.messages[i].chat_id, messages.messages[i].chat_id);
            if (messages.messages[i].sender_id.user_id) {
                users.set(messages.messages[i].sender_id.user_id, messages.messages[i].sender_id.user_id);
            }
        }

        store = FileStore.getStore();
        loadChatsContent(store, [...chats.keys()]);
        loadUsersContent(store, [...users.keys()]);
    };

    loadContent = async () => {
        const { chatId } = this.props;
        if (chatId) {
            this.setState({
                top: null,
                recentlyFound: null,
                local: null,
                global: null,
                messages: null,
                linkMessage: null
            });

            return;
        }

        // const topPromise = TdLibController.send({
        //     '@type': 'getTopChats',
        //     category: { '@type': 'topChatCategoryUsers' },
        //     limit: 30
        // }).catch(() => {
        //     return { '@type': 'chats', chat_ids: [] };
        // });

        const recentlyFoundPromise = TdLibController.send({
            '@type': 'searchChats',
            query: '',
            limit: 100
        }).catch(() => {
            return { '@type': 'chats', chat_ids: [] };
        });

        // const savedMessagesPromise = TdLibController.send({
        //     '@type': 'createPrivateChat',
        //     user_id: UserStore.getMyId(),
        //     force: true
        // }).catch(error => {});

        const [recentlyFound] = await Promise.all([
            recentlyFoundPromise,
            // savedMessagesPromise
        ]);

        this.setState({
            recentlyFound,
            // savedMessages,
            local: null,
            global: null,
            messages: null,
            linkMessage: null
        });

        const store = FileStore.getStore();
        // loadChatsContent(store, top.chat_ids);
        loadChatsContent(store, recentlyFound.chat_ids);
    };

    handleClearRecentlyFound = event => {
        event.stopPropagation();

        TdLibController.send({
            '@type': 'clearRecentlyFoundChats'
        });

        this.setState({ recentlyFound: null });
    };

    handleSelectMessage = (chatId, messageId) => {
        const { onSelectMessage } = this.props;

        this.setState(state => {
            const messageSignature = `${chatId}_${messageId}`;
            const isChecked = state.selectedMessages.includes(messageSignature);

            let list = [...state.selectedMessages];
            if (isChecked) {
                list = list.filter((item) => item !== messageSignature);
            } else {
                list.push(messageSignature);
            }
            console.log(list);

            return {
                selectedMessages: list,
            };
        });


        // onSelectMessage(chatId, messageId, keepOpen);
    };

    handleScroll = () => {
        const list = this.listRef.current;

        if (list.scrollTop + list.offsetHeight >= list.scrollHeight - SCROLL_PRECISION) {
            this.onLoadPrevious();
        }
    };

    getOffset = messages => {
        const length = messages ? messages.messages.length : 0;

        const offsetDate = length > 0 ? messages.messages[length - 1].date : 0;
        const offsetChatId = length > 0 ? messages.messages[length - 1].chat_id : 0;
        const offsetMessageId = length > 0 ? messages.messages[length - 1].id : 0;

        return {
            offset_date: offsetDate,
            offset_chat_id: offsetChatId,
            offset_message_id: offsetMessageId
        };
    };

    concatMessages = (messages, result) => {
        if (!result) return messages;
        if (!result.messages.length) return messages;

        if (!messages) return result;
        if (!messages.messages.length) return result;

        return {
            total_count: result.total_count,
            messages: messages.messages.concat(result.messages)
        };
    };

    onLoadPrevious = async () => {
        if (this.loading) return;

        const { chatId } = this.props;

        const sessionId = this.sessionId;

        const { messages } = this.state;

        const offset = this.getOffset(messages);

        this.loading = true;
        let result = [];
        // if (chatId) {
        //     result = await TdLibController.send({
        //         '@type': 'searchChatMessages',
        //         chat_id: chatId,
        //         query: this.text,
        //         sender_user_id: 0,
        //         from_message_id: offset.offset_message_id,
        //         limit: 50,
        //         filter: null
        //     });
        // } else {
        result = await this.handleLoadMessages(this.text, offset);
        // }
        this.loading = false;

        filterDuplicateMessages(result, messages ? messages.messages : []);
        MessageStore.setItems(result.messages);

        if (sessionId !== this.sessionId) {
            return;
        }

        this.setState({
            messages: this.concatMessages(messages, result)
        });

        const chats = new Map();
        const users = new Map();
        for (let i = 0; i < result.messages.length; i++) {
            chats.set(result.messages[i].chat_id, result.messages[i].chat_id);
            if (result.messages[i].sender_id.user_id) {
                users.set(result.messages[i].sender_id.user_id, result.messages[i].sender_id.user_id);
            }
        }

        const store = FileStore.getStore();
        loadChatsContent(store, [...chats.keys()]);
        loadUsersContent(store, [...users.keys()]);
    };

    handleTopChatsScroll = event => {
        event.stopPropagation();
    };

    handleClose = () => {
        const { onClose } = this.props;

        onClose();
    };

    handleDeleteRecentlyFoundChat = async chatId => {
        if (!chatId) return;

        await TdLibController.send({
            '@type': 'removeRecentlyFoundChat',
            chat_id: chatId
        });

        const { recentlyFound } = this.state;
        if (!recentlyFound) return;

        this.setState({
            recentlyFound: { ...recentlyFound, chat_ids: recentlyFound.chat_ids.filter(x => x !== chatId) }
        });
    };

    handleDeleteTopChat = async chatId => {
        if (!chatId) return;

        await TdLibController.send({
            '@type': 'removeTopChat',
            chat_id: chatId,
            category: {
                '@type': 'topChatCategoryUsers'
            }
        });

        const { top } = this.state;
        if (!top) return;

        this.setState({
            top: { ...top, chat_ids: top.chat_ids.filter(x => x !== chatId) }
        });
    };

    handleLoadMessages = async (text, offset) => {
        offset = offset ? offset : {
            offset_date: 0,
            offset_chat_id: 0,
            offset_message_id: 0,
        }
        return await TdLibController.send({
            '@type': 'searchMessages',
            chat_list: { '@type': 'chatListMain' },
            query: text,
            ...offset,
            limit: 100,
            // filter_:
        });
    };

    render() {
        const { chatId, t } = this.props;
        const { messages } = this.state;

        const chat = ChatStore.get(chatId);

        const globalMessagesMap = new Map();
        const globalMessages =
            messages && messages.messages
                ? messages.messages.map((x, i) => {
                    const isChecked = this.state.selectedMessages.includes(`${x.chat_id}_${x.id}`);

                    const key = `${x.chat_id}_${x.id}_${i}`;
                    globalMessagesMap.set(key, key);

                    return (
                        <FoundMessage
                            key={key}
                            chatId={x.chat_id}
                            messageId={x.id}
                            chatSearch={Boolean(chatId)}
                            isChecked={Boolean(isChecked)}
                            onClick={() => this.handleSelectMessage(x.chat_id, x.id)}
                        />
                    );
                  })
                : [];

        let count = messages ? messages.total_count : 0;

        let messagesCaption = t('NoMessages');
        if (count) {
            messagesCaption = count === 1 ? 'Found 1 message' : `Found ${count} messages`;
        }

        return (
            <div ref={this.listRef} className='search' onScroll={this.handleScroll}>
                {chat && (
                    <>
                        <div className='sidebar-page-section'>
                            <SectionHeader>{t('SearchMessagesIn')}</SectionHeader>
                            <div className='search-chat-wrapper'>
                                <div className='search-chat-control'>
                                    <Chat chatId={chatId} showStatus={false} />
                                </div>
                                <IconButton
                                    className='header-right-button'
                                    aria-label='Search'
                                    onMouseDown={this.handleClose}>
                                    <CloseIcon />
                                </IconButton>
                            </div>
                        </div>
                        <div className='sidebar-page-section-divider' />
                    </>
                )}

                {messages && (
                    <div className='sidebar-page-section'>
                        <SectionHeader>{messagesCaption}</SectionHeader>
                        {globalMessages}
                    </div>
                )}
            </div>
        );
    }
}

Search.propTypes = {
    chatId: PropTypes.number,
    text: PropTypes.string,
    onSelectMessage: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired
};

export default withTranslation()(Search);
