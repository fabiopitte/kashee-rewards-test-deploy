require('dotenv').config();

module.exports = {
  KasheeRewardsApiUrl: process.env.KASHEE_REWARDS_API_URL,
  KasheeRewardsEventsUrl: process.env.KASHEE_REWARDS_EVENTS_URL,
  AzureKey: process.env.AZURE_KEY,
  redisUrl: process.env.REDISCLOUD_URL,
};
