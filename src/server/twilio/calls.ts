import { env } from "~/env";
import { twilioClient } from "./index";

export async function makePhoneCall(to: string, message: string) {
  try {
    const call = await twilioClient.calls.create({
      to,
      from: env.TWILIO_PHONE_NUMBER,
      twiml: `<Response><Say>${message}</Say></Response>`,
    });
    
    return {
      success: true,
      callSid: call.sid,
    };
  } catch (error) {
    console.error("Error making phone call:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
