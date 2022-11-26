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

const schema = z.object({
  username: z.string().min(1, { message: 'Username cannot be empty' }),
});

const Setting: NextPage = () => {
  const { data: user } = useQueryUser();
  if (user === undefined) return <></>;
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SettingForm>({
    mode: 'onSubmit',
    defaultValues: {
      username: user.name,
    },
    resolver: zodResolver(schema),
  });
  const registeredUsername = register('username');
  const { updateNameMutation } = useMutateName();

  const onSubmit: SubmitHandler<SettingForm> = (data: SettingForm) => {
    updateNameMutation.mutate({ userId: user.id, updatedName: data.username });
  };

  return (
    <Layout title="Setting">
      <Header title="Setting" />
      <form
        // [TODO] replace type coercion if possible...
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
            <Avatar sx={{ width: 150, height: 150 }} />
          </Grid>
          <Grid item>
            <Stack spacing={2} direction="column">
              <Button variant="contained">Change picture</Button>
              <Button variant="outlined">Delete picture</Button>
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
                  // [TODO] replace type coercion if possible...
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
              Update
            </Button>
          </Grid>
        </Grid>
      </form>
    </Layout>
  );
};

export default Setting;
