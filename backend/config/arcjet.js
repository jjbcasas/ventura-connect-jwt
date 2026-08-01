import arcjet, { shield, detectBot, slidingWindow } from "@arcjet/node"
import dotenv from 'dotenv'
dotenv.config({ path: './backend/config/.env'})

const aj = arcjet({
  key: process.env.ARCJET_KEY,
  rules: [
    // Shield protects your app from common attacks e.g. SQL injection
    shield({ mode: "LIVE" }),
    // Create a bot detection rule
    detectBot({
      mode: "LIVE", // Blocks requests. Use "DRY_RUN" to log only
      // Block all bots except the following
      allow: [
        "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc
        // "CATEGORY:MONITORING", // Automatically includes UptimeRobot & similar services
        "UPTIMEROBOT", // Allows strictly UptimeRobot
        "POSTMAN" // Permits Postman requests
        // Uncomment to allow these other common bot categories
        // See the full list at https://arcjet.com/bot-list
        //"CATEGORY:PREVIEW", // Link previews e.g. Slack, Discord
      ],
    }),
    // Create a token bucket rate limit. Other algorithms are supported.
    slidingWindow({
        mode: "LIVE",
        max: 100,
        interval: 60
    })
  ],
});

export default aj