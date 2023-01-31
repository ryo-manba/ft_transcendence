import {
  memo,
  useRef,
  useCallback,
  useState,
  useEffect,
  Dispatch,
  SetStateAction,
} from 'react';
import { MessageLeft } from 'components/chat/message-exchange/ChatMessage';
import { Message } from 'types/chat';
import { Virtuoso } from 'react-virtuoso';
import { fetchMessages } from 'api/chat/fetchMessages';
import { Socket } from 'socket.io-client';

type Props = {
  currentRoomId: number;
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
  socket: Socket;
};

/**
 * DOCS: https://virtuoso.dev/prepend-items/
 */
export const ChatMessageList = memo(function ChatMessageList({
  currentRoomId,
  messages,
  setMessages,
  socket,
}: Props) {
  const INITIAL_ITEM_COUNT = 20;

  const [skipPage, setSkipPage] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const virtuosoRef = useRef<any>(null);

  // メッセージが500件あったらfirstItemIndexは500
  // そこから古い順に向かって読み込んでいく
  const [firstItemIndex, setFirstItemIndex] = useState(0);

  useEffect(() => {
    let ignore = false;
    // メッセージの合計数が逆順スクロールに必要になる
    socket.emit(
      'chat:getMessagesCount',
      {
        chatroomId: currentRoomId,
      },
      (count: number) => {
        setFirstItemIndex(count);
      },
    );

    const setupMessages = async () => {
      const chatMessages = await fetchMessages({
        roomId: currentRoomId,
        skip: 0,
        pageSize: INITIAL_ITEM_COUNT,
      });
      if (!ignore) {
        setMessages(chatMessages);
      }
    };
    void setupMessages();

    setSkipPage(1);

    return () => {
      ignore = true;
    };
  }, [currentRoomId, setMessages, socket]);

  const loadingMessages = useCallback(
    async (roomId: number, pageSize: number, skip: number) => {
      const chatMessages = await fetchMessages({
        roomId: roomId,
        skip: skip,
        pageSize: pageSize,
      });

      if (chatMessages.length === 0) {
        return;
      }
      setMessages((prev) => [...chatMessages, ...prev]);
      setSkipPage((prev) => prev + 1);
    },
    [setMessages, setSkipPage],
  );

  const prependMessages = useCallback(() => {
    // fetchする数を統一しないと、skipするデータ数が異なってしまう
    const messagesToPrepend = INITIAL_ITEM_COUNT;
    const nextFirstItemIndex = Math.max(0, firstItemIndex - messagesToPrepend);

    setTimeout(() => {
      setFirstItemIndex(nextFirstItemIndex);
      void loadingMessages(currentRoomId, messagesToPrepend, skipPage);
    }, 500);

    return false;
  }, [firstItemIndex, currentRoomId, loadingMessages, skipPage]);

  const itemContent = (index: number, item: Message) => (
    <MessageLeft
      key={index}
      message={item.text}
      timestamp={item.createdAt}
      displayName={item.userName}
      userId={item.userId}
    />
  );

  return (
    <Virtuoso
      ref={virtuosoRef}
      initialTopMostItemIndex={INITIAL_ITEM_COUNT - 1} // 0 ~ totalCount - 1 の間の値に設定すると、リストがその項目までスクロールされる
      firstItemIndex={firstItemIndex} // 逆順スクロールの場合に必要とすると要素の先頭の値
      itemContent={itemContent} // 要素の表示の仕方
      data={messages} // 表示する要素
      startReached={prependMessages} // 先頭までスクロール時に呼び出す
      followOutput={'smooth'} // リストの要素に応じてスクロールを追従する
    />
  );
});
