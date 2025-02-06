import { ConfigType, registerAs } from '@nestjs/config';

export const authRegToken = 'auth';

const AuthConfig = registerAs(authRegToken, () => {
  return {
    jwt: {
      secret: process.env.JWT_ACCESS_SECRET_KEY || 'secret',
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '6h',
    },
    googleClientId: process.env.GOOGLE_CLIENT_ID,
  };
});

export type IAuthConfig = ConfigType<typeof AuthConfig>;

export default AuthConfig;
