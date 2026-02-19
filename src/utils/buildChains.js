/**
 * Organises a completed game's submissions into per-chain arrays.
 * Each chain starts from one player and follows the telephone sequence
 * through all rounds.
 *
 * @param {object} game - Game object from the server
 * @returns {Array<{ startPlayer: object, submissions: object[] }>}
 */
export function buildChains(game) {
    const playerCount = game.players.length;
    const chains = [];

    for (let startOrder = 0; startOrder < playerCount; startOrder++) {
        const chain = {
            startPlayer: game.players[startOrder],
            submissions: []
        };

        for (let round = 1; round <= game.maxRounds; round++) {
            const playerOrder = (startOrder + round - 1) % playerCount;
            const player = game.players.find(p => p.order === playerOrder);

            if (player) {
                const submission = game.submissions.find(
                    s => s.playerId === player.id && s.round === round
                );

                if (submission) {
                    chain.submissions.push({
                        ...submission,
                        player,
                        round
                    });
                }
            }
        }

        chains.push(chain);
    }

    return chains;
}
