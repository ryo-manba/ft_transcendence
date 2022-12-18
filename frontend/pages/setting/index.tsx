import {
  Avatar,
  Grid,
  Button,
  Stack,
  TextField,
  Alert,
  AlertTitle,
  Typography,
} from '@mui/material';
import { Header } from 'components/common/Header';
import { Layout } from 'components/common/Layout';
import { useMutationName } from 'hooks/useMutationName';
import { useQueryUser } from 'hooks/useQueryUser';
import type { NextPage } from 'next';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { SettingForm } from 'types/setting';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ChangeEventHandler, useState } from 'react';
import { useMutationAvatar } from 'hooks/useMutationAvatar';
import { Loading } from 'components/common/Loading';
import axios, { AxiosError } from 'axios';
import { AxiosErrorResponse } from 'types';
import { getAvatarImageUrl } from 'api/user/getAvatarImageUrl';
import { useRouter } from 'next/router';

const schema = z.object({
  username: z.string().min(1, { message: 'Username cannot be empty' }),
});

const Setting: NextPage = () => {
  const { data: user } = useQueryUser();
  const [error, setError] = useState<string[]>([]);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    clearErrors,
    reset,
  } = useForm<SettingForm>({
    mode: 'onSubmit',
    resolver: zodResolver(schema),
  });
  const { updateNameMutation } = useMutationName();
  const { updateAvatarMutation, deleteAvatarMutation } = useMutationAvatar();
  const router = useRouter();

  if (user === undefined) return <Loading fullHeight />;

  const avatarImageUrl = getAvatarImageUrl(user.id);

  const onNameMutationError = (error: AxiosError) => {
    if (error.response && error.response.data) {
      reset();
      const messages = (error.response.data as AxiosErrorResponse).message;
      if (Array.isArray(messages)) setError(messages);
      else setError([messages]);
    }
  };

  const onAvatarMutationError = () => {
    setError([
      'Unable to upload avatar',
      'Please try again, or try with a different image',
    ]);
  };

  const onSubmit: SubmitHandler<SettingForm> = (data: SettingForm) => {
    clearErrors();
    setError([]);
    updateNameMutation.mutate(
      {
        userId: user.id,
        updatedName: data.username,
      },
      {
        onError: onNameMutationError,
      },
    );
  };

  const onChangeAvatar: ChangeEventHandler<HTMLInputElement> = (event) => {
    if (event.target.files === null) return;
    if (user.avatarPath !== null) {
      deleteAvatarMutation.mutate({
        userId: user.id,
        avatarPath: user.avatarPath,
      });
    }
    const newAvatarFile = event.target.files[0];
    const formData = new FormData();
    formData.append('avatar', newAvatarFile); // この第一引数のnameを使ってバックエンドのFileInterceptorはファイル名を取り出す
    updateAvatarMutation.mutate(
      {
        userId: user.id,
        updatedAvatarFile: formData,
      },
      {
        onError: onAvatarMutationError,
      },
    );
  };

  const onDeleteAvatar = () => {
    setError([]);
    if (user.avatarPath !== null) {
      deleteAvatarMutation.mutate({
        userId: user.id,
        avatarPath: user.avatarPath,
      });
    }
  };

  const onChange2faSetting = async () => {
    if (user.has2FA) {
      if (process.env.NEXT_PUBLIC_API_URL) {
        try {
          const response = await axios.post<string>(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/disable2fa`,
            {
              userId: String(user.id),
              code: '1234',
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
          console.log(e);
        }
      }
    } else {
      await router.push('/setting/enable2fa');
    }
  };

  return (
    <Layout title="Setting">
      <Header title="Setting" />
      <form onSubmit={handleSubmit(onSubmit) as VoidFunction}>
        <Grid
          container
          alignItems="center"
          justifyContent="center"
          sx={{ p: 2 }}
          spacing={5}
        >
          {error.length !== 0 && (
            <Grid item xs={4}>
              <Alert severity="error">
                <>
                  <AlertTitle>Setting Error</AlertTitle>
                  {error.map((e, i) => (
                    <Typography variant="body2" key={i}>
                      {e}
                    </Typography>
                  ))}
                </>
              </Alert>
            </Grid>
          )}
        </Grid>
        <Grid
          container
          alignItems="center"
          justifyContent="center"
          sx={{ p: 2 }}
          spacing={5}
        >
          <Grid item>
            <Avatar sx={{ width: 150, height: 150 }} src={avatarImageUrl} />
          </Grid>
          <Grid item>
            <Stack spacing={2} direction="column">
              <Button variant="contained" component="label">
                Change avatar
                <input
                  hidden
                  accept="image/*"
                  type="file"
                  onChange={onChangeAvatar}
                  onClick={(e) => {
                    setError([]);
                    (e.target as HTMLInputElement).value = '';
                  }}
                />
              </Button>
              <Button
                variant="outlined"
                component="label"
                onClick={onDeleteAvatar}
              >
                Delete avatar
              </Button>
            </Stack>
          </Grid>
        </Grid>
        <Grid
          container
          alignItems="center"
          justifyContent="center"
          spacing={2}
          sx={{ p: 2 }}
        >
          <Grid item xs={4}>
            <Controller
              name="username"
              control={control}
              render={() => (
                <TextField
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register('username')}
                  fullWidth
                  required
                  id="user-name"
                  label="Username"
                  defaultValue={user.name}
                  error={errors.username ? true : false}
                  helperText={errors.username?.message}
                  sx={{ my: 2 }}
                />
              )}
            />
          </Grid>
        </Grid>
        <Grid
          container
          alignItems="center"
          justifyContent="center"
          spacing={2}
          sx={{ p: 2 }}
        >
          <Grid item>
            <Button
              variant="contained"
              type="submit"
              onClick={() => {
                clearErrors();
                setError([]);
              }}
            >
              Update username
            </Button>
          </Grid>
        </Grid>
        <Grid
          container
          alignItems="center"
          justifyContent="center"
          spacing={2}
          sx={{ p: 2 }}
        >
          <Grid item>
            <Button
              variant="contained"
              component="label"
              onClick={() => {
                void onChange2faSetting();
              }}
            >
              {user.has2FA ? 'DISABLE 2FA' : 'ENABLE 2FA'}
            </Button>
          </Grid>
        </Grid>
      </form>
      {/* <Grid container alignItems="center" justifyContent="center" spacing={2}>
        <Grid item>
          <Enable2FA></Enable2FA>
        </Grid>
      </Grid> */}
    </Layout>
  );
};

export default Setting;
