import { memo, useState } from 'react';
import { TextField, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

type Props = {
  sendMessage: (text: string) => void;
};

export const ChatroomTextInput = memo(function ChatroomTextInput({
  sendMessage,
}: Props) {
  const [text, setText] = useState('');

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
      placeholder={`#roomへメッセージを送信`}
      onKeyPress={(e) => {
        if (e.key === 'Enter') {
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
