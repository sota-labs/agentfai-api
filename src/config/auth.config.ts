import { ConfigType, registerAs } from '@nestjs/config';

export const authRegToken = 'auth';

const AuthConfig = registerAs(authRegToken, () => {
  return {
    jwt: {
      secret: process.env.JWT_SECRET || 'secret',
      expiresIn: process.env.JWT_EXPIRES_IN || '2h',
    },
    googleClientId: process.env.GOOGLE_CLIENT_ID,
  };
});

export type IAuthConfig = ConfigType<typeof AuthConfig>;

export default AuthConfig;
