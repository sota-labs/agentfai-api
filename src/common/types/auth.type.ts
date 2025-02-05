export type TGoogleUserInfo = {
  id: string;
  email: string;
  verified_email: boolean;
  picture: string;
  hd: string;
  name: string;
};

export type TAccessTokenPayload = {
  userId: string;
  id?: string;
  sub: string;
  email?: string;
};

export type TLoginResponse = {
  accessToken: string;
  salt: string;
};
