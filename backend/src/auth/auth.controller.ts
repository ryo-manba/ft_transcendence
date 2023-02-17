import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  Get,
  Param,
  Patch,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { CreateOAuthDto } from './dto/create-oauth.dto';
import { Validate2FACodeDto } from './dto/validate-2FACode.dto';
import { LogoutDto } from './dto/logout.dto';
import { Csrf, Msg, LoginResult } from './interfaces/auth.interface';

class LoginResultStatus {
  static readonly SUCCESS = 'success';
  static readonly NEED2FA = 'need2fa';
  static readonly FAILURE = 'failure';
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('csrf')
  getCsfrToken(@Req() req: Request): Csrf {
    return { csrfToken: req.csrfToken() };
  }

  @Post('signup')
  async signUp(@Body() dto: AuthDto): Promise<Msg> {
    try {
      return await this.authService.singUp(dto);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        return {
          message: error.message,
        };
      }

      return {
        message: undefined,
      };
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() dto: AuthDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResult> {
    try {
      const loginInfo = await this.authService.login(dto);
      if (loginInfo.has2fa) {
        return {
          res: LoginResultStatus.NEED2FA,
          userId: loginInfo.userId,
        };
      }
      res.cookie('access_token', loginInfo.accessToken, {
        httpOnly: true,
        secure: true, //Postmanからアクセスするときはfalse
        sameSite: 'none',
        path: '/',
      });

      return {
        res: LoginResultStatus.SUCCESS,
        userId: undefined,
      };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        const errorMessage = error.message;

        return {
          res: LoginResultStatus.FAILURE,
          userId: undefined,
          errorMessage,
        };
      } else {
        return {
          res: LoginResultStatus.FAILURE,
          userId: undefined,
        };
      }
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: LogoutDto,
  ): Msg {
    this.authService.logout(dto);

    res.cookie('access_token', '', {
      httpOnly: true,
      secure: true, //Postmanからアクセスするときはfalse
      sameSite: 'none',
      path: '/',
    });

    return {
      message: 'ok',
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('oauth-login')
  async oAuthLogin(
    @Body() dto: CreateOAuthDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResult> {
    try {
      const loginInfo = await this.authService.oauthlogin(dto);
      if (loginInfo.has2fa) {
        return {
          res: LoginResultStatus.NEED2FA,
          userId: loginInfo.userId,
        };
      }
      res.cookie('access_token', loginInfo.accessToken, {
        httpOnly: true,
        secure: true, //Postmanからアクセスするときはfalse
        sameSite: 'none',
        path: '/',
      });

      return {
        res: LoginResultStatus.SUCCESS,
        userId: undefined,
      };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        return {
          res: LoginResultStatus.FAILURE,
          userId: undefined,
          errorMessage: error.message,
        };
      }

      return {
        res: LoginResultStatus.FAILURE,
        userId: undefined,
      };
    }
  }

  //
  // API for 2Factor Auth
  //
  @Get('qr2fa/:id')
  generateQrCode(@Param('id', ParseIntPipe) id: number): Promise<string> {
    return this.authService.generateQrCode(id);
  }

  @Patch('send2facode')
  send2FACode(@Body() dto: Validate2FACodeDto): Promise<boolean> {
    return this.authService.send2FACode(dto);
  }

  @Patch('validate2fa')
  async validate2FA(
    @Body() dto: Validate2FACodeDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<boolean> {
    try {
      const accessToken = await this.authService.validate2FA(dto);
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: true, //Postmanからアクセスするときはfalse
        sameSite: 'none',
        path: '/',
      });
    } catch {
      return false;
    }

    return true;
  }

  @Patch('disable2fa/:id')
  disable2FA(@Param('id', ParseIntPipe) id: number): Promise<boolean> {
    return this.authService.disable2FA(id);
  }
}
