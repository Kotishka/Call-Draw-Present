/**
 * Validates a player name.
 * Returns an error string if invalid, or null if valid.
 */
export function validatePlayerName(name) {
    const trimmed = (name || '').trim();

    if (!trimmed) {
        return 'Please enter your name';
    }

    if (trimmed.length < 2) {
        return 'Name must be at least 2 characters long';
    }

    if (trimmed.length > 20) {
        return 'Name must be 20 characters or less';
    }

    return null;
}
