export const name = "comms";

import VoiceResponse from 'twilio/lib/twiml/VoiceResponse.js'

export function generateInitialTwiML(message: string, wakeUpCallId: number): string {
    const twiml = new VoiceResponse();
    twiml.say(message);
    twiml.gather({
        input: ['speech', 'dtmf'],
        action: '/api/trpc/wakeupCall.snooze?wakeUpCallId={wakeUpCallId}',
        method: 'POST'
    }).say('If you\'d like to snooze, say how many minutes.');
    return twiml.toString();
}

export function generateSnoozeResponseTwiML(message: string): string {
    const twiml = new VoiceResponse();
    twiml.say(message);
    return twiml.toString();
}