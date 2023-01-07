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
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { CreateOAuthDto } from './dto/create-oauth.dto';
import { Validate2FACodeDto } from './dto/validate-2FACode.dto';
import { LogoutDto } from './dto/logout.dto';
import { Csrf, Msg } from './interfaces/auth.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('csrf')
  getCsfrToken(@Req() req: Request): Csrf {
    return { csrfToken: req.csrfToken() };
  }

  @Post('signup')
  signUp(@Body() dto: AuthDto): Promise<Msg> {
    return this.authService.singUp(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() dto: AuthDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<boolean> {
    const loginInfo = await this.authService.login(dto);
    res.cookie('access_token', loginInfo.accessToken, {
      httpOnly: true,
      secure: true, //Postmanからアクセスするときはfalse
      sameSite: 'none',
      path: '/',
    });

    // ログイン完了ならtrue, 2FA確認がまだ必要ならfalse
    return !loginInfo.has2fa;
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: LogoutDto,
  ): Promise<Msg> {
    await this.authService.logout(dto);

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
  ): Promise<boolean> {
    const loginInfo = await this.authService.oauthlogin(dto);

    res.cookie('access_token', loginInfo.accessToken, {
      httpOnly: true,
      secure: true, //Postmanからアクセスするときはfalse
      sameSite: 'none',
      path: '/',
    });

    // ログイン完了ならtrue, 2FA確認がまだ必要ならfalse
    return !loginInfo.has2fa;
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
      console.log('validate Exception!');

      return false;
    }
    console.log('validate OK!');

    return true;
  }

  @Patch('disable2fa/:id')
  disable2FA(@Param('id', ParseIntPipe) id: number): Promise<boolean> {
    return this.authService.disable2FA(id);
  }
}
