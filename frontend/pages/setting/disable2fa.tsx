import type { NextPage } from 'next';
import { Grid, Button, TextField, Stack } from '@mui/material';
import { TwoAuthForm } from 'types/setting';
import { useQueryUser } from 'hooks/useQueryUser';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';

export const Disable2FA: NextPage = () => {
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

  const onSubmit: SubmitHandler<TwoAuthForm> = async (data: TwoAuthForm) => {
    clearErrors();
    if (process.env.NEXT_PUBLIC_API_URL && user !== undefined) {
      try {
        const response = await axios.post<string>(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/disable2fa`,
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

  return (
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
            sx={{ p: 4 }}
            spacing={5}
          >
            <Stack spacing={2} direction="row">
              {/* 認証コード入力欄 */}
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
              {/* 解除ボタン */}
              <Button
                variant="contained"
                type="submit"
                onClick={() => {
                  clearErrors();
                }}
              >
                解除
              </Button>
            </Stack>
          </Grid>
        </form>
      </Grid>
    </Grid>
  );

  return <p>hoge</p>;
};

export default Disable2FA;
