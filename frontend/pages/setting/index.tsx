import { Avatar, Grid, Button, Stack, TextField } from '@mui/material';
import { Header } from 'components/common/Header';
import { Layout } from 'components/common/Layout';
import { useMutateName } from 'hooks/useMutationName';
import { useQueryUser } from 'hooks/useQueryUser';
import type { NextPage } from 'next';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { SettingForm } from 'types/setting';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ChangeEventHandler } from 'react';
import { useMutateAvatar } from 'hooks/useMutationAvatar';
import { Loading } from 'components/common/Loading';

const schema = z.object({
  username: z.string().min(1, { message: 'Username cannot be empty' }),
});

const Setting: NextPage = () => {
  const { data: user } = useQueryUser();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SettingForm>({
    mode: 'onSubmit',
    resolver: zodResolver(schema),
  });
  const { updateNameMutation } = useMutateName();
  const { updateAvatarMutation, deleteAvatarMutation } = useMutateAvatar();

  if (user === undefined) return <Loading fullHeight />;
  const registeredUsername = register('username');

  const avatarImageUrl =
    user.avatarPath !== null
      ? `${process.env.NEXT_PUBLIC_API_URL as string}/user/avatar/${user.id}`
      : '';

  const onSubmit: SubmitHandler<SettingForm> = (data: SettingForm) => {
    updateNameMutation.mutate({ userId: user.id, updatedName: data.username });
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
    updateAvatarMutation.mutate({
      userId: user.id,
      updatedAvatarFile: formData,
    });
  };

  const onDeleteAvatar = () => {
    if (user.avatarPath !== null) {
      deleteAvatarMutation.mutate({
        userId: user.id,
        avatarPath: user.avatarPath,
      });
    }
  };

  return (
    <Layout title="Setting">
      <Header title="Setting" />
      <form
        // [TODO] type coercionをできればなくしたい
        onSubmit={handleSubmit(onSubmit) as VoidFunction}
      >
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
                  // Props spreadingがeslintで禁止されているために全部書き下している
                  // Props spreadingができれば{...register('username')}でいける
                  // [TODO] type coercionをできればなくしたい
                  onChange={
                    registeredUsername.onChange as unknown as VoidFunction
                  }
                  onBlur={registeredUsername.onBlur as unknown as VoidFunction}
                  name={registeredUsername.name}
                  ref={registeredUsername.ref}
                  fullWidth
                  required
                  id="user-name"
                  label="Username"
                  defaultValue={user.name}
                  error={errors.username ? true : false}
                  helperText={errors.username?.message}
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
            <Button variant="contained" type="submit">
              Update username
            </Button>
          </Grid>
        </Grid>
      </form>
    </Layout>
  );
};

export default Setting;
