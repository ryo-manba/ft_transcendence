/* eslint-disable react/jsx-props-no-spreading */
import type { NextPage } from 'next';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios, { isAxiosError } from 'axios';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import Image from 'next/image';
import GppGoodIcon from '@mui/icons-material/GppGood';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import {
  AuthForm,
  AxiosErrorResponse,
  LoginResult,
  LoginResultStatus,
} from '../types/utils';
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
import { ValidationDialog } from 'components/auth/ValidationDialog';
import { useQueryClient } from '@tanstack/react-query';
import { useSocketStore } from 'store/game/ClientSocket';

const usernameMaxLen = 50;
const passwordMinLen = 5;

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
  const [error, setError] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [openValidationDialog, setOpenValidationDialog] = useState(false);
  const [validationUserId, setValidationUserId] = useState(0);
  const queryClient = useQueryClient();
  const { socket } = useSocketStore();

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
  const { status } = useSession();

  useEffect(() => {
    queryClient.removeQueries(['user']);
    socket.disconnect();
  }, [socket, queryClient]);

  const onSubmit: SubmitHandler<AuthForm> = async (formData: AuthForm) => {
    try {
      if (process.env.NEXT_PUBLIC_API_URL) {
        if (isRegister) {
          const urlSignup = `${process.env.NEXT_PUBLIC_API_URL}/auth/signup`;
          await axios.post(urlSignup, {
            password: formData.password,
            username: formData.username,
          });
        }
        const { data } = await axios.post<LoginResult>(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
          {
            username: formData.username,
            password: formData.password,
          },
        );
        if (data.res === LoginResultStatus.SUCCESS) {
          await router.push('/dashboard');
        } else if (
          data.res === LoginResultStatus.NEED2FA &&
          data.userId !== undefined
        ) {
          setValidationUserId(data.userId);
          setOpenValidationDialog(true);
        } else {
          const messages = data.errorMessage
            ? data.errorMessage
            : 'Login Failure';
          if (Array.isArray(messages)) {
            setError(messages);
          } else {
            setError([messages]);
          }
        }
      }
    } catch (e) {
      if (isAxiosError(e) && e.response && e.response.data) {
        reset();
        const messages = (e.response.data as AxiosErrorResponse).message;
        if (Array.isArray(messages)) {
          setError(messages);
        } else {
          if (messages == 'invalid csrf token') {
            setError(['Internal error. Please reload the page.']);
          } else {
            setError([messages]);
          }
        }
      } else {
        setError(['Internal error. Please reload the page.']);
      }
    }
  };

  // ValidateのDialogが失敗したら呼ばれる
  const handleClose = useCallback(() => {
    // ダイアログを閉じる
    setOpenValidationDialog(false);
    setValidationUserId(0);
    void router.push('/');
  }, [setOpenValidationDialog, setValidationUserId, router]);

  if (status === 'loading') {
    return <Loading fullHeight={true} />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Head>
        <title>ft_transcendence</title>
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
                  startIcon={<LockOpenIcon />}
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
              <Button>
                <Image
                  src="/images/ico-42-logo.jpg"
                  onClick={() => {
                    void (async () => {
                      await signIn('42-school', {
                        callbackUrl: '/auth',
                      });
                    })();
                  }}
                  width={50}
                  height={50}
                  alt="42 Logo"
                />
              </Button>
            </Grid>
            <Grid item>
              <Button>
                <Image
                  src="/images/ico-google-logo-96.png"
                  onClick={() => {
                    void (async () => {
                      await signIn('google', { callbackUrl: '/auth' });
                    })();
                  }}
                  width={50}
                  height={50}
                  alt="Google Logo"
                />
              </Button>
            </Grid>
          </Grid>
          <ValidationDialog
            open={openValidationDialog}
            userId={validationUserId}
            onClose={handleClose}
          />
        </Grid>
      </main>
    </div>
  );
};

export default Home;
