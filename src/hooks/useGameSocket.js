import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';

/**
 * Registers all Socket.IO listeners needed by the Game component and
 * cleans them up on unmount.
 *
 * @param {string}   code     - Game code from the URL
 * @param {object}   handlers - Callback map for each socket event
 */
export function useGameSocket(code, handlers) {
    const { socket } = useSocket();
    const navigate = useNavigate();

    useEffect(() => {
        if (!socket) return;

        socket.on('playerJoined', handlers.onPlayerJoined);
        socket.on('playersUpdate', handlers.onPlayersUpdate);
        socket.on('gameStarted', ({ game: updatedGame }) => {
            handlers.onGameStarted(updatedGame);
            socket.emit('getPreviousSubmission', { gameCode: code });
        });
        socket.on('previousSubmission', handlers.onPreviousSubmission);
        socket.on('submissionReceived', handlers.onSubmissionReceived);
        socket.on('nextRound', ({ game: updatedGame }) => {
            handlers.onNextRound(updatedGame);
            socket.emit('getPreviousSubmission', { gameCode: code });
        });
        socket.on('gameComplete', ({ game: updatedGame }) => {
            handlers.onGameComplete(updatedGame);
            setTimeout(() => navigate(`/results/${code}`), 1000);
        });
        socket.on('playerLeft', handlers.onPlayerLeft);
        socket.on('error', handlers.onError);

        return () => {
            socket.off('playerJoined');
            socket.off('playersUpdate');
            socket.off('gameStarted');
            socket.off('previousSubmission');
            socket.off('submissionReceived');
            socket.off('nextRound');
            socket.off('gameComplete');
            socket.off('playerLeft');
            socket.off('error');
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket, code]);

    return socket;
}
