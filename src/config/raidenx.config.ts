import { ConfigType, registerAs } from '@nestjs/config';

export const raidenxRegToken = 'raidenx';

const RaidenxConfig = registerAs(raidenxRegToken, () => ({
  commonUrl: process.env.RAIDENX_COMMON_URL || 'https://api.dextrade.bot',
  oauth2Url: process.env.RAIDENX_OAUTH2_URL || 'https://api-oauth2.dextrade.bot',
  walletsUrl: process.env.RAIDENX_WALLETS_URL || 'https://api-wallets.dextrade.bot',
  insightUrl: process.env.RAIDENX_INSIGHT_URL || 'https://api-insight.dextrade.bot',
  sponsorAddress: '0x34b2c6c1ef038334f2bc5142d0613c7b5f6ec5a67ae4a7cf37340adefdf2cfb6',
  dexes: {
    bluemove: {
      package: '0x496d3ea87e24d055328c329e65d433c0ee2254c9154dbf66c6f95af578ae6353',
      module: 'bluemove_router',
      feeObjectId: '0x0e3a32590abb7ca1d2877898a3a7a3ff5dc68679e9dd7672c43e6bfdb0b9d9a8',
      configObjectId: '0x3f2d9f724f4a1ce5e71676448dc452be9a6243dac9c5b975a588c8c867066e92',
    },
    cetus: {
      package: '0x2930c3fbb379fa20107c8c8f0bbb9d43ea8afd761460a369709194632976f2e9',
      module: 'cetus_router',
      feeObjectId: '0x619e3dcda4ba7dbd10faca80913fc25de1d493c39f2505b2edc5e5f8132259eb',
      configObjectId: '0xdaa46292632c3c4d8f31f23ea0f9b36a28ff3677e9684980e4438403a67a3d8f',
    },
    flowx: {
      package: '0xbab579951c9d9fdefbbe34cbdfbbef843a80a6c83ef5f852f67dcd02147ecd99',
      module: 'flow_x_router',
      feeObjectId: '0x9a57d1f6fdff284d085b3a00afcf22031b2cb5981b9502b64c225d5ccf9d1db4',
      configObjectId: '0xb65dcbf63fd3ad5d0ebfbf334780dc9f785eff38a4459e37ab08fa79576ee511',
    },
    movepump: {
      package: '0x2f5c6c8c8d7b4302f3d8acb75f69b0ded47a109f26b92ad09bd02b78c6569474',
      module: 'move_pump_router',
      feeObjectId: '0x04bb2e8a0e4710b8bf8124b1057653036dcac7060094e19a046ec9232f70b319',
      configObjectId: '0xd746495d04a6119987c2b9334c5fefd7d8cff52a8a02a3ea4e3995b9a041ace4',
      dexObjectId: '0x3f2d9f724f4a1ce5e71676448dc452be9a6243dac9c5b975a588c8c867066e92',
      fee: 0.005,
      tradingFee: 0.01,
    },
    turbos: {
      package: '0x3c8deea4edcd2e67bbc93c8387723f0905aaa1771599ae68f149eae4b9cff540',
      module: 'turbos_router',
      feeObjectId: '0x31a7f4d439b2e8d464a47e31974563146da3c467eaf840e2a8e2c20da47e643c',
      configObjectId: '0xf1cf0e81048df168ebeb1b8030fad24b3e0b53ae827c25053fff0779c1445b6f',
    },
    turbosfun: {
      package: '0x2051a7293411938c9598c86eb374099f350f5d6080c7f4d58d975b39efb1321c',
      module: 'turbospump_router',
      feeObjectId: '0x7c6f2d2acce69c51463d714407f8d3a1d6ce06bf750e4a0c05b228d54dcdf9a9',
      configObjectId: '0xd86685fc3c3d989385b9311ef55bfc01653105670209ac4276ebb6c83d7df928',
    },
    sevenkfun: {
      package: '0x7ee7a76a0adc4263837e6908729e50fb9573dc1483091e0070c65c1ae35f1302',
      module: 'fun_7k_router',
      feeObjectId: '0xf9fc90f1f88b071f53b445af85bed421fd0238b5061dc226e5d60e29ed9bcb28',
      configObjectId: '0xe79fff6c77d81f9a8efb729e25bf0037deec42518d40b978f274a4915d7e1ec9',
      aggregatorConfigObjectId: '0x0f8fc23dbcc9362b72c7a4c5aa53fcefa02ebfbb83a812c8c262ccd2c076d9ee',
      aggregatorVaultObject: '0x39a3c55742c0e011b6f65548e73cf589e1ae5e82dbfab449ca57f24c3bcd9514',
    },
    bluefin: {
      package: '0x3de1d8df57158d1c93e3e1b614f38ee5163286257710fd352ac7a12c0e0a09e3',
      module: 'bluefin_router',
      feeObjectId: '',
      configObjectId: '0x03db251ba509a8d5d8777b6338836082335d93eecbdd09a11e190a1cff51c352',
    },
    suiaifun: {
      package: '0xd285c96690ddcee3245d32f356464520362f7e7df0ffc98ff1d3a310d1421e38',
      module: 'suiai_router',
      feeObjectId: '',
      configObjectId: '0xd9b810f0d1f4c024dd7190bac834de764cb09054246f86981cb63d36ae51bf5c',
      configObjectIdSui: '0x2c84cf1031e454c5787308bcd87c3b14ba26296316880d79698d5cb49a5b0b68',
    },
  },
}));

export type IRaidenxConfig = ConfigType<typeof RaidenxConfig>;

export default RaidenxConfig;
