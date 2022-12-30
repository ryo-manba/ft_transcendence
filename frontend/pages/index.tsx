/* eslint-disable react/jsx-props-no-spreading */
import type { NextPage } from 'next';
import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { IconDatabase } from '@tabler/icons';
import Image from 'next/image';
import GppGoodIcon from '@mui/icons-material/GppGood';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
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
  Typography,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { signIn, useSession } from 'next-auth/react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loading } from 'components/common/Loading';
import Head from 'next/head';

const usernameMaxLen = Number(process.env.USERNAME_MAX_LEN);
const passwordMinLen = Number(process.env.USERNAME_MAX_LEN);

// username, passwordのvalidation
const schema = z.object({
  username: z
    .string()
    .min(1, { message: 'No username provided' })
    .max(usernameMaxLen, {
      message: `Username must be shorter than or equal to ${usernameMaxLen} characters`,
    }),
  password: z.string().min(passwordMinLen, {
    message: `Password should be min ${passwordMinLen} chars`,
  }),
});

const Home: NextPage = () => {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [tryLogin, setTryLogin] = useState(false);
  const [error, setError] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    formState: { errors },
    handleSubmit,
    clearErrors,
    reset,
  } = useForm<AuthForm>({
    mode: 'onSubmit',
    resolver: zodResolver(schema),
    defaultValues: {
      password: '',
      username: '',
    },
  });
  const { data: session, status } = useSession();

  const onSubmit: SubmitHandler<AuthForm> = async (data: AuthForm) => {
    try {
      if (process.env.NEXT_PUBLIC_API_URL) {
        if (isRegister) {
          const url_signup = `${process.env.NEXT_PUBLIC_API_URL}/auth/signup`;
          await axios.post(url_signup, {
            password: data.password,
            username: data.username,
          });
        }
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
          username: data.username,
          password: data.password,
        });
        await router.push('/dashboard');
      }
    } catch (e) {
      if (axios.isAxiosError(e) && e.response && e.response.data) {
        reset();
        const messages = (e.response.data as AxiosErrorResponse).message;
        if (Array.isArray(messages)) setError(messages);
        else setError([messages]);
      }
    }
  };

  const oauthLogin = async () => {
    if (process.env.NEXT_PUBLIC_API_URL) {
      if (!session || session.user === null || session.user === undefined) {
        return;
      } else {
        try {
          reset();
          // console.log(session.user);
          const url_oauth = `${process.env.NEXT_PUBLIC_API_URL}/auth/oauth-login`;
          if (session.user) {
            await axios.post(url_oauth, {
              oAuthId: session.user.email,
              // oAuthId: session.user.oAuthId,
              imagePath: session.user.image,
            });
          }
          await router.push('/dashboard');
        } catch (e) {
          console.log('[OAuth] signup failure: catch');
          if (axios.isAxiosError(e) && e.response && e.response.data) {
            reset();
            const messages = (e.response.data as AxiosErrorResponse).message;
            if (Array.isArray(messages)) setError(messages);
            else setError([messages]);
          }
        }
      }
    }
  };

  if (status === 'loading') {
    return <Loading fullHeight={true} />;
  }

  if (status === 'authenticated') {
    if (tryLogin == false) {
      setTryLogin(true);
      void (async () => {
        await oauthLogin();
      })();
    }

    return <Loading fullHeight={true} />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Head>
        <title>Auth</title>
      </Head>
      <main className="flex w-screen flex-1 flex-col items-center justify-center">
        <Grid
          container
          justifyContent="center"
          direction="column"
          alignItems="center"
          sx={{ width: 360 }}
        >
          <GppGoodIcon color="primary" sx={{ width: 100, height: 100 }} />
          {error.length !== 0 && (
            <Alert severity="error">
              <>
                <AlertTitle>Authorization Error</AlertTitle>
                {error.map((e, i) => (
                  <Typography variant="body2" key={i}>
                    {e}
                  </Typography>
                ))}
              </>
            </Alert>
          )}
          <form onSubmit={handleSubmit(onSubmit) as VoidFunction}>
            <Controller
              name="username"
              control={control}
              render={({ field }) => (
                <TextField
                  fullWidth
                  size="small"
                  sx={{ my: 2 }}
                  label="Username"
                  error={errors.username ? true : false}
                  helperText={errors.username?.message}
                  {...field}
                />
              )}
            />
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
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
                          {showPassword ? (
                            <VisibilityOffIcon />
                          ) : (
                            <Visibility />
                          )}
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
            <Grid container justifyContent="space-between">
              <Grid item>
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={() => {
                    clearErrors();
                    setError([]);
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
                  onClick={() => {
                    setError([]);
                  }}
                >
                  {isRegister ? 'Register' : 'Login'}
                </Button>
              </Grid>
            </Grid>
          </form>
          <br />
          <Grid container justifyContent="space-evenly">
            <Grid item>
              <Image
                src="/images/ico-42-logo.jpg"
                onClick={() => {
                  void (async () => {
                    await signIn('42-school');
                  })();
                }}
                width={50}
                height={50}
              />
            </Grid>
            <Grid item>
              <Image
                src="/images/ico-google-logo-96.png"
                onClick={() => {
                  void (async () => {
                    await signIn('google');
                  })();
                }}
                width={50}
                height={50}
              />
            </Grid>
          </Grid>
        </Grid>
      </main>
    </div>
  );
};

export default Home;
