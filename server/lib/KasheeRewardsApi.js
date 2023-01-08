const axios = require('axios');
const config = require('../config');
//const cookie = require('cookie');

class KasheeRewardsApi {
  constructor(ctx = null) {
    this.authorizationHeader = null;

    if (ctx) {
      console.log('ctx', JSON.stringify(ctx));
    }
  }

  async signup(shop, accessToken) {
    const { data, status } = await axios.post(
      `${config.KasheeRewardsApiUrl}/store/signup`,
      {
        providerName: 'shopify',
        providerSettings: {
          shop,
          accessToken,
        },
      }
    );

    return data;
  }

  async delete(shop) {
    console.log('delete this.authorizationHeader', shop);
    const { data, status } = await axios.delete(
      `${config.KasheeRewardsApiUrl}/store/${shop}`,
      {
        headers: {
          Authorization: `Azure ${config.AzureKey}`,
        },
      }
    );

    return data;
  }
}

module.exports = KasheeRewardsApi;
