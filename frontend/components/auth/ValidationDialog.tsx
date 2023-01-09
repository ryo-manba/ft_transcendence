import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  IconButton,
  Grid,
  Alert,
  Snackbar,
} from '@mui/material';
import { useRouter } from 'next/router';
import { FC, useCallback, useState } from 'react';
import axios from 'axios';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { TwoAuthForm } from 'types/setting';
import { Loading } from 'components/common/Loading';
import CloseIcon from '@mui/icons-material/Close';

/** ダイアログコンポーネントの props の型定義 */
type Props = {
  /** ダイアログを表示するなら true */
  open: boolean;

  /** 認証コード（= ユーザーに入力させるテキスト） */
  userId: number;

  /**
   * ダイアログを閉じるべきときに呼び出されます。
   *
   * 認証コードが正しく検証されたときは、validation の値が true となります。
   */
  onClose?: (validation: boolean) => void;
};

export const ValidationDialog: FC<Props> = ({
  open,
  userId,
  onClose,
}: Props) => {
  const router = useRouter();
  const [openSnack, setOpenSnack] = useState('');
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    clearErrors,
  } = useForm<TwoAuthForm>();

  // ダイアログを閉じるときの処理（クライアント側へコールバックする）
  const handleClose = useCallback(
    (validation: boolean) => {
      onClose?.(validation);
      setOpenSnack('');
    },
    [onClose],
  );

  const handleSnackClose = () => {
    setOpenSnack('');
  };

  const onSubmit: SubmitHandler<TwoAuthForm> = async (
    inputData: TwoAuthForm,
  ) => {
    clearErrors();
    try {
      const { data } = await axios.patch<boolean>(
        `${process.env.NEXT_PUBLIC_API_URL as string}/auth/validate2fa`,
        {
          userId: userId,
          code: inputData.authCode,
        },
      );

      if (data == true) {
        await router.push('/dashboard');
        void handleClose(true);
      } else {
        setOpenSnack('FAILURE');
      }
    } catch {
      setOpenSnack('FAILURE');
    }
  };

  if (router.isReady === false) return <Loading fullHeight />;

  //実行時にQRコードを取得
  return (
    <Dialog open={open} onClose={() => handleClose(false)}>
      <DialogTitle sx={{ m: 0, p: 2 }}>
        Enter Authorization Code
        <IconButton
          aria-label="close"
          onClick={() => handleClose(false)}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit) as VoidFunction}>
          <Grid
            container
            alignItems="center"
            justifyContent="center"
            spacing={2}
            sx={{ p: 2 }}
          >
            {/* 認証コード入力欄 */}
            <Grid item>
              <Controller
                name="authCode"
                control={control}
                render={() => (
                  <TextField
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...register('authCode')}
                    fullWidth
                    required
                    id="auth-code"
                    label="6 digit code"
                    InputLabelProps={{ shrink: true }}
                    autoComplete="off"
                    error={errors.authCode ? true : false}
                    sx={{ my: 2 }}
                  />
                )}
              />
            </Grid>
            {/* 検証ボタン */}
            <Grid item>
              <Button variant="contained" type="submit">
                VALIDATE
              </Button>
            </Grid>
          </Grid>
          <Snackbar
            open={openSnack == 'FAILURE'}
            autoHideDuration={6000}
            onClose={handleSnackClose}
          >
            <Alert onClose={handleSnackClose} severity="error">
              Authorization Code Is Wrong!
            </Alert>
          </Snackbar>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ValidationDialog;
