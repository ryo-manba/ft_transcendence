import type { NextPage } from 'next';
import { Grid, Button, TextField, Snackbar, Alert } from '@mui/material';
import { Layout } from 'components/common/Layout';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useQueryUser } from 'hooks/useQueryUser';
import axios from 'axios';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { TwoAuthForm } from 'types/setting';
import { useMutationHas2FA } from 'hooks/useMutationHas2FA';

const Enable2FA: NextPage = () => {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    clearErrors,
  } = useForm<TwoAuthForm>();
  const { data: user } = useQueryUser();
  const [qrCode, setQrCode] = useState('');
  const { changeHas2FAMutation } = useMutationHas2FA();
  const [openSnack, setOpenSnack] = useState('');

  useEffect(() => {
    const getQrcode = async () => {
      if (process.env.NEXT_PUBLIC_API_URL && user) {
        try {
          const response = await axios.get<string>(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/qr2fa/${user.id}`,
          );
          if (response) {
            setQrCode(response.data);
          }
        } catch {
          throw new Error('Can not get QR Code Exception.');
        }
      }
    };
    void getQrcode();
  }, []);

  const handleClose = () => {
    setOpenSnack('');
  };

  const on2FAMutationEnableError = () => {
    setOpenSnack('ERROR');
  };

  const onSubmit: SubmitHandler<TwoAuthForm> = (data: TwoAuthForm) => {
    clearErrors();
    if (user !== undefined) {
      changeHas2FAMutation.mutate(
        {
          isEnable: true,
          userId: user.id,
          authCode: data.authCode,
        },
        {
          onError: on2FAMutationEnableError,
        },
      );
    }
  };

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
          {/* QRコード */}
          {qrCode != '' && (
            <Image src={qrCode} width={200} height={200} alt="2FA QR Code" />
          )}
        </Grid>
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
              {/* 登録ボタン */}
              <Grid item>
                <Button
                  variant="contained"
                  type="submit"
                  onClick={() => {
                    clearErrors();
                  }}
                >
                  REGISTER
                </Button>
                <Snackbar
                  open={openSnack == 'ERROR'}
                  autoHideDuration={6000}
                  onClose={handleClose}
                >
                  <Alert onClose={handleClose} severity="error">
                    Code is invalid! Try Again.
                  </Alert>
                </Snackbar>
              </Grid>
            </Grid>
          </form>
        </Grid>
      </Grid>
    </Layout>
  );
};

export default Enable2FA;
