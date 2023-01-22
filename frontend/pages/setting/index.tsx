import {
  Avatar,
  Grid,
  Button,
  Stack,
  TextField,
  Alert,
  Typography,
  Snackbar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { Header } from 'components/common/Header';
import { Layout } from 'components/common/Layout';
import { useMutationName } from 'hooks/useMutationName';
import { useQueryUser } from 'hooks/useQueryUser';
import type { NextPage } from 'next';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { SettingForm, OpenSnackState } from 'types/setting';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ChangeEventHandler, useEffect, useState } from 'react';
import { useMutationAvatar } from 'hooks/useMutationAvatar';
import { Loading } from 'components/common/Loading';
import { AxiosError } from 'axios';
import { AxiosErrorResponse } from 'types';
import { getAvatarImageUrl } from 'api/user/getAvatarImageUrl';
import { useRouter } from 'next/router';
import { useMutationHas2FA } from 'hooks/useMutationHas2FA';

const usernameMaxLen = 50;

const schema = z.object({
  username: z
    .string()
    .min(1, { message: 'Username cannot be empty' })
    .max(usernameMaxLen, {
      message: `Username must be shorter than or equal to ${usernameMaxLen} characters`,
    }),
});

const Setting: NextPage = () => {
  const { data: user } = useQueryUser();
  const [success, setSuccess] = useState<string>('');
  const [error, setError] = useState<string[]>([]);
  const [openSnack, setOpenSnack] = useState<OpenSnackState>(
    OpenSnackState.NONE,
  );
  const [openConfirm, setOpenConfirm] = useState(false);
  const [avatarImageUrl, setAvatarImageUrl] = useState<string | undefined>(
    undefined,
  );
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
  const { changeHas2FAMutation } = useMutationHas2FA();
  const router = useRouter();

  useEffect(() => {
    if (user === undefined) {
      return;
    }
    setAvatarImageUrl(getAvatarImageUrl(user.id));
  }, [user]);

  if (user === undefined || router.isReady === false)
    return <Loading fullHeight />;

  const onChangeName: SubmitHandler<SettingForm> = (data: SettingForm) => {
    clearErrors();
    setError([]);
    updateNameMutation.mutate(
      {
        userId: user.id,
        updatedName: data.username,
      },
      {
        onSuccess: () => {
          setOpenSnack(OpenSnackState.SUCCESS);
          setSuccess('Successfully changed username');
        },
        onError: (error: AxiosError) => {
          if (error.response && error.response.data) {
            reset();
            setOpenSnack(OpenSnackState.ERROR);
            const messages = (error.response.data as AxiosErrorResponse)
              .message;
            if (Array.isArray(messages)) setError(messages);
            else setError([messages]);
          }
        },
      },
    );
  };

  const onChangeAvatar: ChangeEventHandler<HTMLInputElement> = (event) => {
    if (event.target.files === null) return;
    if (user.avatarPath !== null) {
      deleteAvatarMutation.mutate(
        {
          userId: user.id,
          avatarPath: user.avatarPath,
        },
        {
          onError: () => {
            setOpenSnack(OpenSnackState.ERROR);
            setError(['Failed to delete avatar']);
          },
        },
      );
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
        onSuccess: () => {
          setOpenSnack(OpenSnackState.SUCCESS);
          setSuccess('Successfully uploaded avatar');
        },
        onError: () => {
          setOpenSnack(OpenSnackState.ERROR);
          setError(['Unable to upload avatar']);
        },
      },
    );
  };

  const onDeleteAvatar = () => {
    setError([]);
    if (user.avatarPath !== null) {
      deleteAvatarMutation.mutate(
        {
          userId: user.id,
          avatarPath: user.avatarPath,
        },
        {
          onSuccess: () => {
            setAvatarImageUrl(undefined);
            setOpenSnack(OpenSnackState.SUCCESS);
            setSuccess('Successfully deleted avatar');
          },
          onError: () => {
            setOpenSnack(OpenSnackState.ERROR);
            setError(['Failed to delete avatar']);
          },
        },
      );
    }
  };

  const handleSnackClose = () => {
    setOpenSnack(OpenSnackState.NONE);
    setError([]);
    setSuccess('');
  };

  const handleDialogClose = (result: string) => {
    setOpenConfirm(false);
    if (result === 'agree') {
      changeHas2FAMutation.mutate(
        {
          isEnable: false,
          userId: user.id,
          authCode: '',
        },
        {
          onSuccess: () => {
            setOpenSnack(OpenSnackState.SUCCESS);
            setSuccess('2FA has been successfully disabled');
          },
          onError: () => {
            setOpenSnack(OpenSnackState.ERROR);
            setError(['Failed to disable 2FA']);
          },
        },
      );
    }
  };

  const onChange2faSetting = async () => {
    if (user.has2FA) {
      // 解除の確認ダイアログを開く
      setOpenConfirm(true);
    } else {
      // 登録画面に進む
      await router.push('/setting/enable2fa');
    }
  };

  return (
    <Layout title="Setting">
      <Header title="Setting" />
      <form onSubmit={handleSubmit(onChangeName) as VoidFunction}>
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
            <Dialog
              open={openConfirm}
              onClose={handleDialogClose}
              aria-labelledby="alert-dialog-title"
              aria-describedby="alert-dialog-description"
            >
              <DialogTitle id="alert-dialog-title">
                {'Disable 2FA?'}
              </DialogTitle>
              <DialogContent>
                <DialogContentText id="alert-dialog-description">
                  Do you want to disable 2-factor authentication?
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={() => handleDialogClose('agree')}
                  variant="contained"
                >
                  YES
                </Button>
                <Button
                  onClick={() => handleDialogClose('disagree')}
                  variant="outlined"
                  autoFocus
                >
                  NO
                </Button>
              </DialogActions>
            </Dialog>

            {/* Snackbarの中身を三項演算子で書くと、SUCCESSのSnackbarが消えた後に一瞬ErrorのSnackbarが表示されてしまうため、別のコンポーネントとして併記 */}
            <Snackbar
              open={openSnack === OpenSnackState.SUCCESS}
              autoHideDuration={6000}
              onClose={handleSnackClose}
              anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
              <Alert onClose={handleSnackClose} severity="success">
                {success}
              </Alert>
            </Snackbar>
            <Snackbar
              open={openSnack === OpenSnackState.ERROR}
              autoHideDuration={6000}
              onClose={handleSnackClose}
              anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
              <Alert onClose={handleSnackClose} severity="error">
                {error.map((e, i) => (
                  <Typography variant="body2" key={i}>
                    {e}
                  </Typography>
                ))}
              </Alert>
            </Snackbar>
          </Grid>
        </Grid>
      </form>
    </Layout>
  );
};

export default Setting;
