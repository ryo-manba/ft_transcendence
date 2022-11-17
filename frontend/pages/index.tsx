/* eslint-disable react/jsx-props-no-spreading */
import type { NextPage } from 'next';
import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import * as Yup from 'yup';
import { IconDatabase } from '@tabler/icons';
import Image from 'next/image';
import GppGoodIcon from '@mui/icons-material/GppGood';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Layout } from '../components/Layout';
import { AuthForm, AxiosErrorResponse } from '../types';
import {
  Grid,
  IconButton,
  InputAdornment,
  TextField,
  Link,
  Alert,
  Button,
  AlertTitle,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const schema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('No email provided'),
  password: Yup.string()
    .required('No password provided')
    .min(5, 'Password should be min 5 chars'),
});

const Home: NextPage = () => {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    formState: { errors },
    handleSubmit,
    clearErrors,
  } = useForm<AuthForm>({
    mode: 'onSubmit',
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  const onSubmit: SubmitHandler<AuthForm> = async (data: AuthForm) => {
    try {
      if (process.env.NEXT_PUBLIC_API_URL) {
        if (isRegister) {
          const url_signup = `${process.env.NEXT_PUBLIC_API_URL}/auth/signup`;
          await axios.post(url_signup, {
            email: data.email,
            password: data.password,
            username: data.username,
          });
        }
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
          email: data.email,
          password: data.password,
        });
        await router.push('/dashboard');
      }
    } catch (e) {
      if (axios.isAxiosError(e) && e.response && e.response.data) {
        const message = (e.response.data as AxiosErrorResponse).message;
        setError(message);
      }
    }
  };

  return (
    <Layout title="Auth">
      <Grid
        container
        justifyContent="center"
        direction="column"
        alignItems="center"
        sx={{ width: 360 }}
      >
        <GppGoodIcon color="primary" sx={{ width: 100, height: 100 }} />
        {error && (
          <Alert severity="error">
            <AlertTitle>Authorization Error</AlertTitle>
            {error}
          </Alert>
        )}
        <form onSubmit={handleSubmit(onSubmit) as VoidFunction}>
          {/* [TODO] remove email */}
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                required
                placeholder="example@gmail.com"
                fullWidth
                size="small"
                sx={{ my: 2 }}
                label="Email"
                error={errors.email ? true : false}
                helperText={errors.email?.message}
                {...field}
              />
            )}
          />
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <TextField
                required
                label="Password"
                type={showPassword ? 'text' : 'password'}
                error={errors.password ? true : false}
                helperText={
                  errors.password
                    ? errors.password?.message
                    : 'Must be min 5 char'
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => {
                          setShowPassword(!showPassword);
                        }}
                        onMouseDown={(event) => {
                          event.preventDefault();
                        }}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                size="small"
                sx={{ my: 1 }}
                fullWidth
                {...field}
              />
            )}
          />
          {isRegister && (
            <Controller
              name="username"
              control={control}
              render={({ field }) => (
                <TextField
                  required
                  fullWidth
                  size="small"
                  sx={{ mb: 2 }}
                  label="Username"
                  error={errors.username ? true : false}
                  helperText={errors.username?.message}
                  {...field}
                />
              )}
            />
          )}
          <Grid container justifyContent="space-between">
            <Grid item>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => {
                  clearErrors();
                  setError('');
                  setIsRegister(!isRegister);
                }}
              >
                {isRegister
                  ? 'Have an account? Login'
                  : "Don't have an account? Register"}
              </Link>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                type="submit"
                startIcon={<IconDatabase />}
              >
                {isRegister ? 'Register' : 'Login'}
              </Button>
            </Grid>
          </Grid>
        </form>
        <a href="/auth42">
          <Image src="/images/ico-42-logo.jpg" width={50} height={50} />
        </a>
        <br></br>
        <a href="/google">
          <Image src="/images/ico-google-logo-96.png" width={50} height={50} />
        </a>
      </Grid>
    </Layout>
  );
};

export default Home;
