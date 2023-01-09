import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  IconButton,
  Grid,
} from '@mui/material';
import { useRouter } from 'next/router';
import { FC, useCallback } from 'react';
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
    },
    [onClose],
  );

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
        console.log('path Failure');
        void handleClose(false);
      }
    } catch {
      console.log('Exception');
      void handleClose(false);
    }
  };

  if (router.isReady === false) return <Loading fullHeight />;

  //実行時にQRコードを取得
  return (
    <Dialog open={open} onClose={() => handleClose(false)}>
      <DialogTitle sx={{ m: 0, p: 2 }}>
        認証コードの入力
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
                    label="Enter Code from Your Apps"
                    autoComplete="new-password"
                    error={errors.authCode ? true : false}
                    helperText={errors.authCode?.message}
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
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ValidationDialog;
