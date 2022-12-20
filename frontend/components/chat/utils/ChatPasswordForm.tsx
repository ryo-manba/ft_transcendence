import { memo, useState } from 'react';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Controller, FieldError, Control } from 'react-hook-form';

type Props = {
  // controlの型は各入力項目の個数によって異なるためanyにしている
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  inputName: string;
  labelName: string;
  error: FieldError | undefined;
  helperText: string;
};

export const ChatPasswordForm = memo(function ChatPasswordForm({
  control,
  inputName,
  labelName,
  error,
  helperText,
}: Props) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      <Controller
        name={inputName}
        control={control}
        render={({ field }) => (
          <TextField
            margin="dense"
            label={labelName}
            type={showPassword ? 'text' : 'password'}
            error={error ? true : false}
            helperText={error ? error.message : helperText}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => {
                      setShowPassword(!showPassword);
                    }}
                    onMouseDown={(event) => {
                      event.preventDefault();
                    }}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOffIcon /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            fullWidth
            variant="standard"
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...field}
          />
        )}
      />
    </>
  );
});
