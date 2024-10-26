import twilio from "twilio";
import { env } from "~/env";

console.log(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
export const twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);



