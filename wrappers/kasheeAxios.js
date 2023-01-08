import axios from 'axios';
import { getSessionToken } from '@shopify/app-bridge-utils';
const kasheeAxios = axios.create();

kasheeAxios.interceptors.request.use(async function (config) {
  const token = await getSessionToken(window.app);
  config.url = `${process.env.NEXT_PUBLIC_KASHEE_REWARDS_API_URL}/${config.url}`;
  config.headers['Authorization'] = `Shopify ${token}`;
  return config;
});

export default kasheeAxios;
