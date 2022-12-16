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
  ): Promise<Msg> {
    const jwt = await this.authService.login(dto);
    res.cookie('access_token', jwt.accessToken, {
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
  ): Promise<Msg> {
    const jwt = await this.authService.oauthlogin(dto);
    res.cookie('access_token', jwt.accessToken, {
      httpOnly: true,
      secure: true, //Postmanからアクセスするときはfalse
      sameSite: 'none',
      path: '/',
    });

    return {
      message: 'ok',
    };
  }

  //
  // API for 2Factor Auth
  //
  @Get('qr2fa/:id')
  generateQrCode(@Param('id') id: string): Promise<string> {
    return this.authService.generateQrCode(Number(id));
  }

  @Post('send2facode')
  send2FACode(@Body() dto: Validate2FACodeDto): Promise<string> {
    return this.authService.send2FACode(dto);
  }

  @Get('has2fa')
  has2FA(@Param('id') id: string): Promise<string> {
    return this.authService.has2FA(Number(id));
  }

  @Post('validate2fa')
  async validate2FA(
    @Body() dto: Validate2FACodeDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Msg> {
    const jwt = await this.authService.validate2FA(dto);
    res.cookie('access_token', jwt.accessToken, {
      httpOnly: true,
      secure: true, //Postmanからアクセスするときはfalse
      sameSite: 'none',
      path: '/',
    });

    return {
      message: 'ok',
    };
  }

  @Post('disable2fa')
  disable2FA(@Body() dto: Validate2FACodeDto): Promise<string> {
    return this.authService.disable2FA(dto);
  }
}
