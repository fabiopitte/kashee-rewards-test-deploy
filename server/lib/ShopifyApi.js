const axios = require('axios');
const config = require('../config');
const Shopify = require('@shopify/shopify-api');
class ShopifyApi {
  async subscribeOrderCreateTopic(shop, accessToken) {
    const host =
      'https://kashee-rewards-prod-functions.azurewebsites.net/api/{functionName}?code=oUqRZZ612ctwYP/Sp77pe1PukndqA2FrUmaLThq8YeWHfiIINWZd8A==';

    const requestUrl = host.replace(
      '{functionName}',
      'ShopifyOrderCreatedHttpTrigger'
    );

    try {
      const { data, status } = await axios.post(
        `https://${shop}/admin/api/2021-10/webhooks.json`,
        {
          webhook: {
            topic: 'orders/paid',
            address: requestUrl,
            format: 'json',
          },
        },
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
          },
        }
      );

      return data;
    } catch (error) {
      return error;
    }
  }

  async subscribeProductUpdatedTopic(shop, accessToken) {
    const host =
      'https://kashee-rewards-prod-functions.azurewebsites.net/api/{functionName}?code=oUqRZZ612ctwYP/Sp77pe1PukndqA2FrUmaLThq8YeWHfiIINWZd8A==';

    const requestUrl = host.replace(
      '{functionName}',
      'ShopifyProductHasBeenUpdatedHttpTrigger'
    );

    try {
      const { data, status } = await axios.post(
        `https://${shop}/admin/api/2021-10/webhooks.json`,
        {
          webhook: {
            topic: 'products/update',
            address: requestUrl,
            format: 'json',
          },
        },
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
          },
        }
      );

      return data;
    } catch (error) {
      return error;
    }
  }

  async subscribeOrderFulfilledTopic(shop, accessToken) {
    const host =
      'https://kashee-rewards-prod-functions.azurewebsites.net/api/{functionName}?code=oUqRZZ612ctwYP/Sp77pe1PukndqA2FrUmaLThq8YeWHfiIINWZd8A==';

    const requestUrl = host.replace(
      '{functionName}',
      'ShopifyOrderHasBeenFulfilledHttpTrigger'
    );

    try {
      const { data, status } = await axios.post(
        `https://${shop}/admin/api/2021-10/webhooks.json`,
        {
          webhook: {
            topic: 'orders/fulfilled',
            address: requestUrl,
            format: 'json',
          },
        },
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
          },
        }
      );

      return data;
    } catch (error) {
      return error;
    }
  }

  async fetchShopDetails(shop, accessToken) {
    try {
      const client = new Shopify.Clients.Graphql(shop, accessToken);
      const data = await client.query({
        data: `{
          shop {
            name
            url
            myshopifyDomain
            description
            contactEmail
            billingAddress{
              address1
              address2
              city
              company
              country
              countryCodeV2
              firstName
              lastName
              latitude
              longitude
              name
              phone
              province
              provinceCode
              zip
            }
          }
        }`,
      });

      return data;
    } catch (error) {
      return error;
    }
  }
}

module.exports = ShopifyApi;
