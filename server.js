require('@babel/polyfill');
const dotenv =  require('dotenv');
require('isomorphic-fetch');
const { default: createShopifyAuth } = require('@shopify/koa-shopify-auth');
const { verifyRequest } = require('@shopify/koa-shopify-auth');
const { default: Shopify, ApiVersion } = require('@shopify/shopify-api');
const Koa = require('koa');
const next = require('next');
const Router = require('koa-router');
const KasheeRewardsApi = require('./server/lib/KasheeRewardsApi');
const ShopifyApi = require('./server/lib/ShopifyApi');
const config = require('./server/config');
const RedisSessionStorage = require('./server/config/redisSessionStorage');
const isCompositeType = require('graphql');


dotenv.config();
const port = parseInt(process.env.PORT, 10) || 8081;
const dev = process.env.NODE_ENV !== 'production';
const app = next({
  dev,
});
const handle = app.getRequestHandler();

const sessionStorage = new RedisSessionStorage();

const key = process.env.SHOPIFY_API_KEY;

Shopify.Context.initialize({
  API_KEY: key,
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
  SCOPES: process.env.SCOPES.split(','),
  HOST_NAME: process.env.HOST.replace(/https:\/\/|\/$/g, ''),
  API_VERSION: ApiVersion.April21,
  IS_EMBEDDED_APP: false,
  // This should be replaced with your preferred storage strategy
  SESSION_STORAGE: new Shopify.Session.CustomSessionStorage(
    sessionStorage.storeCallback,
    sessionStorage.loadCallback,
    sessionStorage.deleteCallback
  ),
});

// Storing the currently active shops in memory will force them to re-login when your server restarts. You should
// persist this object in your app.
const ACTIVE_SHOPIFY_SHOPS = {};

app.prepare().then(async () => {
  const server = new Koa();
  const router = new Router();
  server.keys = [Shopify.Context.API_SECRET_KEY];

  server.use(
    createShopifyAuth({
      accessMode: 'offline',
      async afterAuth(ctx) {
        // Access token and shop available in ctx.state.shopify
        const { shop, accessToken, scope } = ctx.state.shopify;
        const host = ctx.query.host;
        ACTIVE_SHOPIFY_SHOPS[shop] = scope;

        const api = new KasheeRewardsApi();
        const account = await api.signup(shop, accessToken);

        const shopifyApi = new ShopifyApi();
        await shopifyApi.subscribeOrderCreateTopic(shop, accessToken);
        await shopifyApi.subscribeProductUpdatedTopic(shop, accessToken);
        await shopifyApi.subscribeOrderFulfilledTopic(shop, accessToken);

        const shopDetails = await shopifyApi.fetchShopDetails(
          shop,
          accessToken
        );

        ctx.cookies.set('shopDetails', JSON.stringify(shopDetails.body.data), {
          httpOnly: false,
          secure: true,
          sameSite: 'none',
        });

        const unistallAppResponse = await Shopify.Webhooks.Registry.register({
          shop,
          accessToken,
          path: '/webhooks',
          topic: 'APP_UNINSTALLED',
          webhookHandler: async (topic, shop, body) => {
            delete ACTIVE_SHOPIFY_SHOPS[shop];
            const kasheeApi = new KasheeRewardsApi(ctx);
            await kasheeApi.delete(shop);
            return;
          },
        });

        if (!unistallAppResponse.success) {
          console.log(
            `Failed to register APP_UNINSTALLED webhook: ${unistallAppResponse.result}`
          );
        }

        // Redirect to app with shop parameter upon auth
        ctx.redirect(`/?shop=${shop}&host=${host}`);
      },
    })
  );

  const handleRequest = async (ctx) => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.res.statusCode = 200;
  };

  router.post('/webhooks', async (ctx) => {
    try {
      await Shopify.Webhooks.Registry.process(ctx.req, ctx.res);
      console.log(`Webhook processed, returned status code 200`);
    } catch (error) {
      console.log(`Failed to process webhook: ${error}`);
    }
  });

  router.post(
    '/graphql',
    verifyRequest({ returnHeader: true }),
    async (ctx, next) => {
      await Shopify.Utils.graphqlProxy(ctx.req, ctx.res);
    }
  );

  router.get('(/_next/static/.*)', handleRequest); // Static content is clear
  router.get('/_next/webpack-hmr', handleRequest); // Webpack content is clear
  router.get('(.*)', async (ctx) => {
    const shop = ctx.query.shop;

    // This shop hasn't been seen yet, go through OAuth to create a session
    if (ACTIVE_SHOPIFY_SHOPS[shop] === undefined) {
      ctx.redirect(`/auth?shop=${shop}`);
    } else {
      await handleRequest(ctx);
    }
  });

  server.use(router.allowedMethods());
  server.use(router.routes());

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
