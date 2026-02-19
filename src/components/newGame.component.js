import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListGroup, Row, Col, Button, Alert, Card, Form, InputGroup } from 'react-bootstrap';
import { useSocket } from '../contexts/SocketContext';
import copy from 'copy-to-clipboard';

export default function NewGame() {
    const navigate = useNavigate();
    const { socket } = useSocket();
    const [gameCode, setGameCode] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [players, setPlayers] = useState([]);
    const [showCopyAlert, setShowCopyAlert] = useState(false);
    const [isCreatingGame, setIsCreatingGame] = useState(false);
    const [gameCreated, setGameCreated] = useState(false);
    const [maxRounds, setMaxRounds] = useState(6);
    const [minPlayers, setMinPlayers] = useState(3);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!socket) return;

        // Listen for player join confirmation
        socket.on('playerJoined', ({ player, game }) => {
            setCurrentPlayer(player);
            setGameCode(game.code);
            setPlayers(game.players);
            setGameCreated(true);
            setIsCreatingGame(false);
            setErrorMessage('');
        });

        // Listen for player updates
        socket.on('playersUpdate', ({ players }) => {
            setPlayers(players);
        });

        // Listen for game started
        socket.on('gameStarted', ({ game }) => {
            navigate(`/game/${game.code}`);
        });

        // Listen for errors
        socket.on('error', ({ message }) => {
            setErrorMessage(message);
            setIsCreatingGame(false);
        });

        return () => {
            socket.off('playerJoined');
            socket.off('playersUpdate');
            socket.off('gameStarted');
            socket.off('error');
        };
    }, [socket, navigate]);

    const validateInputs = () => {
        if (!playerName.trim()) {
            setErrorMessage('Please enter your name');
            return false;
        }

        if (playerName.trim().length < 2) {
            setErrorMessage('Name must be at least 2 characters long');
            return false;
        }

        if (playerName.trim().length > 20) {
            setErrorMessage('Name must be 20 characters or less');
            return false;
        }

        if (maxRounds < 3 || maxRounds > 10) {
            setErrorMessage('Number of rounds must be between 3 and 10');
            return false;
        }

        if (minPlayers < 2 || minPlayers > 10) {
            setErrorMessage('Minimum players must be between 2 and 10');
            return false;
        }

        setErrorMessage('');
        return true;
    };

    const handleCreateGame = async () => {
        if (!validateInputs()) {
            return;
        }

        setIsCreatingGame(true);
        setErrorMessage('');

        try {
            // Call backend API to create game
            const SERVER_URL = process.env.REACT_APP_SERVER_URL || '';
            const response = await fetch(`${SERVER_URL}/api/game/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hostName: playerName.trim(),
                    maxRounds: maxRounds,
                    minPlayers: minPlayers
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setErrorMessage(data.error || 'Failed to create game');
                setIsCreatingGame(false);
                return;
            }

            if (data.game) {
                // Join the game via Socket.IO
                socket.emit('joinGame', {
                    gameCode: data.game.code,
                    playerName: playerName.trim()
                });
            }
        } catch (error) {
            console.error('Error creating game:', error);
            setErrorMessage('Failed to create game. Please check your connection and try again.');
            setIsCreatingGame(false);
        }
    };

    const copyGameCode = () => {
        copy(gameCode);
        setShowCopyAlert(true);
        setTimeout(() => setShowCopyAlert(false), 3000);
    };

    const copyGameLink = () => {
        const link = `${window.location.origin}${window.location.pathname}#/game/${gameCode}`;
        copy(link);
        setShowCopyAlert(true);
        setTimeout(() => setShowCopyAlert(false), 3000);
    };

    const handleStartGame = () => {
        const game = { minPlayers };
        if (players.length < game.minPlayers) {
            setErrorMessage(`You need at least ${game.minPlayers} players to start the game!`);
            return;
        }

        setErrorMessage('');
        socket.emit('startGame', { gameCode });
    };

    if (!gameCreated) {
        return (
            <Row className="justify-content-center">
                <Col md={6}>
                    <Card className="p-4 shadow">
                        <h2 className="mb-4">Create New Game</h2>

                        {errorMessage && (
                            <Alert variant="danger" dismissible onClose={() => setErrorMessage('')}>
                                {errorMessage}
                            </Alert>
                        )}

                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label>Your Name <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter your name"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleCreateGame()}
                                    isInvalid={errorMessage && !playerName.trim()}
                                    maxLength={20}
                                />
                                <Form.Text className="text-muted">
                                    2-20 characters
                                </Form.Text>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Number of Rounds</Form.Label>
                                <Form.Control
                                    type="number"
                                    min="3"
                                    max="10"
                                    value={maxRounds}
                                    onChange={(e) => setMaxRounds(parseInt(e.target.value) || 3)}
                                />
                                <Form.Text className="text-muted">
                                    Each player contributes once per round (3-10 rounds)
                                </Form.Text>
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label>Minimum Players to Start</Form.Label>
                                <Form.Control
                                    type="number"
                                    min="2"
                                    max="10"
                                    value={minPlayers}
                                    onChange={(e) => setMinPlayers(parseInt(e.target.value) || 2)}
                                />
                                <Form.Text className="text-muted">
                                    Minimum number of players required to start the game (2-10)
                                </Form.Text>
                            </Form.Group>

                            <Button
                                variant="success"
                                size="lg"
                                className="w-100"
                                onClick={handleCreateGame}
                                disabled={isCreatingGame}
                            >
                                {isCreatingGame ? 'Creating Game...' : 'Create Game'}
                            </Button>
                        </Form>
                    </Card>
                </Col>
            </Row>
        );
    }

    return (
        <Row className="justify-content-center">
            <Col lg={8}>
                {showCopyAlert && (
                    <Alert variant="success" className="text-center">
                        Copied to clipboard!
                    </Alert>
                )}

                {errorMessage && (
                    <Alert variant="danger" dismissible onClose={() => setErrorMessage('')}>
                        {errorMessage}
                    </Alert>
                )}

                <Card className="mb-3 p-3 shadow">
                    <h3 className="mb-3">Share Game Code</h3>
                    <Row>
                        <Col md={6} className="mb-3">
                            <p className="mb-2"><strong>Game Code:</strong></p>
                            <InputGroup>
                                <Form.Control
                                    value={gameCode}
                                    readOnly
                                    className="text-center"
                                    style={{ fontSize: '1.5rem', fontWeight: 'bold' }}
                                />
                                <Button variant="primary" onClick={copyGameCode}>
                                    Copy Code
                                </Button>
                            </InputGroup>
                        </Col>
                        <Col md={6} className="mb-3">
                            <p className="mb-2"><strong>Or share the link:</strong></p>
                            <InputGroup>
                                <Form.Control
                                    value={`${window.location.origin}${window.location.pathname}#/game/${gameCode}`}
                                    readOnly
                                    className="text-truncate"
                                />
                                <Button variant="primary" onClick={copyGameLink}>
                                    Copy Link
                                </Button>
                            </InputGroup>
                        </Col>
                    </Row>
                </Card>

                <Card className="mb-3 p-3 shadow">
                    <h3 className="mb-3">Players ({players.length})</h3>
                    <ListGroup>
                        {players.map((player) => (
                            <ListGroup.Item key={player.id} className="d-flex justify-content-between align-items-center">
                                <span>
                                    {player.name}
                                    {player.isHost && <span className="badge bg-primary ms-2">Host</span>}
                                    {currentPlayer && player.id === currentPlayer.id && <span className="badge bg-success ms-2">You</span>}
                                </span>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                    {players.length < minPlayers && (
                        <Alert variant="info" className="mt-3 mb-0">
                            Waiting for more players... ({players.length}/{minPlayers} minimum)
                        </Alert>
                    )}
                </Card>

                <div className="d-grid">
                    <Button
                        variant="success"
                        size="lg"
                        onClick={handleStartGame}
                        disabled={players.length < minPlayers}
                    >
                        Start Game {players.length < minPlayers && `(${minPlayers - players.length} more needed)`}
                    </Button>
                </div>
            </Col>
        </Row>
    );
}
