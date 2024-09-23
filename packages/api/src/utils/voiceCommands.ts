export function parseVoiceCommand(command: string): number | null {
    const lowerCommand = command.toLowerCase();
    if (lowerCommand.includes('5') || lowerCommand.includes('five')) {
        return 5;
    } else if (lowerCommand.includes('10') || lowerCommand.includes('ten')) {
        return 10;
    } else if (lowerCommand.includes('15') || lowerCommand.includes('fifteen')) {
        return 15;
    }
    return null;
}
