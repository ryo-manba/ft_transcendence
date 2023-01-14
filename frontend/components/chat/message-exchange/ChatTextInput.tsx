import { memo, useEffect, useState } from 'react';
import { TextField, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

type Props = {
  roomName: string;
  sendMessage: (text: string) => void;
};

export const ChatTextInput = memo(function ChatTextInput({
  roomName,
  sendMessage,
}: Props) {
  const [text, setText] = useState('');

  useEffect(() => {
    setText('');
  }, [roomName]);

  const handleClick = () => {
    if (text === '') {
      return;
    }
    sendMessage(text);
    setText('');
  };

  return (
    <TextField
      autoFocus
      fullWidth
      style={{
        flexGrow: 1,
        bottom: 15,
        marginLeft: 5,
        marginRight: 5,
      }}
      label="Message"
      id="Message"
      type="text"
      variant="standard"
      size="small"
      value={text}
      placeholder={`Message #${roomName}`}
      onKeyPress={(e) => {
        if (e.key === 'Enter') {
          // formのdefaultEventで画面がリロードされるのを防ぐ
          e.preventDefault();
          handleClick();
        }
      }}
      onChange={(e) => {
        setText(e.target.value);
      }}
      InputProps={{
        endAdornment: (
          <IconButton onClick={handleClick}>
            <SendIcon />
          </IconButton>
        ),
      }}
    />
  );
});
