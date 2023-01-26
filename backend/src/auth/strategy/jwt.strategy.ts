import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { UserService } from '../../user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly user: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => {
          // for eslint
          interface ResponseHeaders {
            access_token: string;
            [key: string]: string;
          }
          let jwt: string = null;
          if (req && req.cookies) {
            const headers: ResponseHeaders = req.cookies as ResponseHeaders;
            jwt = headers['access_token'];
            // jwt = req.cookies['access_token'];
          }

          return jwt;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  // PassportStrategyの抽象メソッド
  async validate(payload: { sub: number; username: string }) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
    });

    return this.user.convertToClientUserFrom(user);
  }
}
