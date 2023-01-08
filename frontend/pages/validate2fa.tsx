import type { NextPage } from 'next';
import { Grid, Button, TextField, Snackbar, Alert } from '@mui/material';
import { Layout } from 'components/common/Layout';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useQueryUser } from 'hooks/useQueryUser';
import axios from 'axios';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { TwoAuthForm } from 'types/setting';
import { Loading } from 'components/common/Loading';
import { useQueryClient } from '@tanstack/react-query';
import { logout } from 'api/auth/logout';
import { useSession } from 'next-auth/react';

const Validate2FA: NextPage = () => {
  const router = useRouter();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    clearErrors,
  } = useForm<TwoAuthForm>();
  const { data: user } = useQueryUser();
  const { data: session } = useSession();
  const [openSnack, setOpenSnack] = useState('');
  const queryClient = useQueryClient();

  const handleClose = () => {
    setOpenSnack('');
  };

  const onSubmit: SubmitHandler<TwoAuthForm> = async (
    inputData: TwoAuthForm,
  ) => {
    clearErrors();
    if (user !== undefined) {
      try {
        const { data } = await axios.patch<boolean>(
          `${process.env.NEXT_PUBLIC_API_URL as string}/auth/validate2fa`,
          {
            userId: user.id,
            code: inputData.authCode,
          },
        );

        if (data == true) {
          await router.push('/dashboard');
        } else {
          setOpenSnack('ERROR');
        }
      } catch {
        setOpenSnack('ERROR');
      }
    }
  };

  if (user === undefined || router.isReady === false)
    return <Loading fullHeight />;

  //実行時にQRコードを取得
  return (
    <Layout title="Auth">
      <Grid
        container
        justifyContent="center"
        direction="column"
        alignItems="center"
        sx={{ width: 360 }}
      >
        <Grid item>
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
                <Button
                  variant="contained"
                  type="submit"
                  onClick={() => {
                    clearErrors();
                  }}
                >
                  VALIDATE
                </Button>
              </Grid>
            </Grid>
          </form>
          <Snackbar
            open={openSnack == 'ERROR'}
            autoHideDuration={6000}
            onClose={handleClose}
          >
            <Alert onClose={handleClose} severity="error">
              Code is invalid! Try Again.
            </Alert>
          </Snackbar>
          {/* ログインへ戻るボタン */}
          <Grid item>
            <Button
              variant="text"
              onClick={() => {
                clearErrors();
                logout(queryClient, router, session);
              }}
            >
              Back To Login
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </Layout>
  );
};

export default Validate2FA;
