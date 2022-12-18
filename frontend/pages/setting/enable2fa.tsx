import type { NextPage } from 'next';
import { Grid, Button, TextField } from '@mui/material';
import { Layout } from 'components/common/Layout';
import Image from 'next/image';
import { useState } from 'react';
import { useQueryUser } from 'hooks/useQueryUser';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { TwoAuthForm } from 'types/setting';

const Enable2FA: NextPage = () => {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    clearErrors,
    reset,
  } = useForm<TwoAuthForm>();
  const { data: user } = useQueryUser();
  const router = useRouter();
  const [qrCode, setQrCode] = useState('');

  const onCreateComponent = async (): Promise<void> => {
    if (process.env.NEXT_PUBLIC_API_URL && user) {
      try {
        const response = await axios.get<string>(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/qr2fa/${user.id}`,
        );
        if (response) {
          setQrCode(response.data);
          console.log(response.data);
        }
      } catch (e) {
        console.log(e);
      }
    }
  };

  if (qrCode == '') {
    void onCreateComponent();
  }

  const onSubmit: SubmitHandler<TwoAuthForm> = async (data: TwoAuthForm) => {
    clearErrors();
    if (process.env.NEXT_PUBLIC_API_URL && user !== undefined) {
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/send2facode`,
          {
            userId: String(user.id),
            code: data.authCode,
          },
        );
        if (response.data == 'failure') {
          reset();
          console.log('Fail Register');
        } else {
          console.log(response);
          await router.push('/setting');
        }
      } catch (e) {
        if (axios.isAxiosError(e) && e.response && e.response.status === 400) {
          console.log(e);
        }

        return [];
      }
    }

    return [];
  };

  //実行時にQRコードを取得
  return (
    <Layout
      title="Auth"
      divClassName="flex min-h-screen flex-col items-center justify-center"
      mainClassName="flex w-screen flex-1 flex-col items-center justify-center"
    >
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
              sx={{ p: 2 }}
              spacing={2}
            >
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
                    REGISTERED
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          </form>
        </Grid>
      </Grid>
    </Layout>
  );
};

export default Enable2FA;
