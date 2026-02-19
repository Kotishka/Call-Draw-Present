import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button, Form, ListGroup, Alert, Spinner, Badge } from 'react-bootstrap';
import { useSocket } from '../contexts/SocketContext';
import { useGameSocket } from '../hooks/useGameSocket';
import DrawingCanvas from './DrawingCanvas';
import { validatePlayerName } from '../utils/validation';

export default function Game() {
    const { code } = useParams();
    const navigate = useNavigate();
    const { socket } = useSocket();
    const canvasRef = useRef(null);

    const [game, setGame] = useState(null);
    const [players, setPlayers] = useState([]);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [playerName, setPlayerName] = useState('');
    const [hasJoined, setHasJoined] = useState(false);
    const [currentSubmission, setCurrentSubmission] = useState('');
    const [previousSubmission, setPreviousSubmission] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notification, setNotification] = useState('');
    const [submittedCount, setSubmittedCount] = useState(0);

    // Load initial game data
    useEffect(() => {
        if (!socket) return;

        const SERVER_URL = process.env.REACT_APP_SERVER_URL || '';
        fetch(`${SERVER_URL}/api/game/${code}`)
            .then(res => res.json())
            .then(data => {
                if (data.game) {
                    setGame(data.game);
                    setPlayers(data.game.players);

                    const existingPlayer = data.game.players.find(p => p.socketId === socket.id);
                    if (existingPlayer) {
                        setCurrentPlayer(existingPlayer);
                        setHasJoined(true);
                    }

                    setLoading(false);
                } else {
                    setError('Game not found');
                    setLoading(false);
                }
            })
            .catch(err => {
                console.error('Error loading game:', err);
                setError('Failed to load game');
                setLoading(false);
            });
    }, [socket, code]);

    // Socket event handlers
    useGameSocket(code, {
        onPlayerJoined: ({ player, game: updatedGame }) => {
            setCurrentPlayer(player);
            setGame(updatedGame);
            setPlayers(updatedGame.players);
            setHasJoined(true);
            setLoading(false);
        },
        onPlayersUpdate: ({ players: updatedPlayers }) => {
            setPlayers(updatedPlayers);
        },
        onGameStarted: (updatedGame) => {
            setGame(updatedGame);
        },
        onPreviousSubmission: ({ submission }) => {
            setPreviousSubmission(submission);
        },
        onSubmissionReceived: ({ submitted }) => {
            setSubmittedCount(submitted);
        },
        onNextRound: (updatedGame) => {
            setGame(updatedGame);
            setCurrentSubmission('');
            setPreviousSubmission(null);
            setIsSubmitting(false);
            setSubmittedCount(0);
        },
        onGameComplete: (updatedGame) => {
            setGame(updatedGame);
        },
        onPlayerLeft: ({ playerName: leftPlayer, players: updatedPlayers }) => {
            setPlayers(updatedPlayers);
            setNotification(`${leftPlayer} left the game`);
        },
        onError: ({ message }) => {
            setError(message);
            setIsSubmitting(false);
        }
    });

    const handleJoinGame = () => {
        const nameError = validatePlayerName(playerName);
        if (nameError) {
            setError(nameError);
            return;
        }

        setError('');
        setLoading(true);
        socket.emit('joinGame', {
            gameCode: code,
            playerName: playerName.trim()
        });
    };

    const handleSubmitText = () => {
        if (!currentSubmission.trim()) {
            setError('Please enter some text');
            return;
        }

        setIsSubmitting(true);
        socket.emit('submitContent', {
            gameCode: code,
            type: 'TEXT',
            content: currentSubmission.trim(),
            imageData: null
        });
    };

    const handleSubmitDrawing = () => {
        const imageData = canvasRef.current?.getImageData();
        if (!imageData) return;
        setIsSubmitting(true);
        socket.emit('submitContent', {
            gameCode: code,
            type: 'DRAWING',
            content: 'Drawing',
            imageData
        });
    };

    if (loading) {
        return (
            <div className="text-center my-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Loading game...</p>
            </div>
        );
    }

    if (error && !hasJoined) {
        return (
            <Alert variant="danger" className="text-center">
                {error}
                <div className="mt-3">
                    <Button variant="primary" onClick={() => navigate('/')}>
                        Return Home
                    </Button>
                </div>
            </Alert>
        );
    }

    if (!hasJoined) {
        return (
            <Row className="justify-content-center">
                <Col md={6}>
                    <Card className="p-4 shadow">
                        <h2 className="mb-4">Join Game: {code}</h2>

                        {error && (
                            <Alert variant="danger" dismissible onClose={() => setError('')}>
                                {error}
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
                                    onKeyPress={(e) => e.key === 'Enter' && handleJoinGame()}
                                    isInvalid={!!error && !playerName.trim()}
                                    maxLength={20}
                                />
                                <Form.Text className="text-muted">
                                    2-20 characters
                                </Form.Text>
                            </Form.Group>
                            <Button
                                variant="success"
                                size="lg"
                                className="w-100"
                                onClick={handleJoinGame}
                                disabled={loading}
                            >
                                {loading ? 'Joining...' : 'Join Game'}
                            </Button>
                        </Form>
                    </Card>
                </Col>
            </Row>
        );
    }

    if (!game || game.status === 'WAITING') {
        return (
            <Row className="justify-content-center">
                <Col md={6}>
                    <Card className="shadow">
                        <Card.Body>
                            <Alert variant="info" className="text-center mb-4">
                                <h4>Waiting for host to start the game...</h4>
                                <p className="mb-0">Game Code: <strong>{code}</strong></p>
                            </Alert>

                            <h5 className="mb-3">Players in Lobby ({players.length})</h5>
                            <ListGroup>
                                {players.map((player) => (
                                    <ListGroup.Item key={player.id} className="d-flex justify-content-between align-items-center">
                                        <span>{player.name}</span>
                                        <span>
                                            {player.isHost && <Badge bg="primary" className="me-2">Host</Badge>}
                                            {currentPlayer && player.id === currentPlayer.id && <Badge bg="success">You</Badge>}
                                        </span>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>

                            {game && game.minPlayers && players.length < game.minPlayers && (
                                <Alert variant="warning" className="mt-3 mb-0">
                                    Waiting for more players... ({players.length}/{game.minPlayers} minimum)
                                </Alert>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        );
    }

    const isTextRound = game.currentRound % 2 === 1;

    return (
        <Row>
            <Col lg={3}>
                <Card className="mb-3 shadow">
                    <Card.Body>
                        <h5>Game: {code}</h5>
                        <p className="mb-1">Round: {game.currentRound} / {game.maxRounds}</p>
                        <p className="mb-2">Status: <Badge bg="info">{game.status}</Badge></p>
                        {submittedCount > 0 && (
                            <p className="mb-0 text-muted">
                                Submitted: {submittedCount}/{players.length}
                            </p>
                        )}
                    </Card.Body>
                </Card>
                <Card className="shadow">
                    <Card.Body>
                        <h5 className="mb-3">Players ({players.length})</h5>
                        <ListGroup variant="flush">
                            {players.map((player) => (
                                <ListGroup.Item key={player.id}>
                                    {player.name}
                                    {player.id === currentPlayer?.id && <Badge bg="success" className="ms-2">You</Badge>}
                                    {player.isHost && <Badge bg="primary" className="ms-2">Host</Badge>}
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    </Card.Body>
                </Card>
            </Col>

            <Col lg={9}>
                {notification && (
                    <Alert variant="warning" dismissible onClose={() => setNotification('')} className="mb-3">
                        {notification}
                    </Alert>
                )}
                {error && (
                    <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-3">
                        {error}
                    </Alert>
                )}
                <Card className="shadow">
                    <Card.Body>
                        <h3 className="mb-4">
                            {isTextRound ? '📝 Write Your Phrase' : '🎨 Draw What You See'}
                        </h3>

                        {previousSubmission && (
                            <Alert variant="info">
                                <strong>Previous submission:</strong>
                                {previousSubmission.type === 'TEXT' ? (
                                    <p className="mb-0 mt-2 fs-5">"{previousSubmission.content}"</p>
                                ) : (
                                    <div className="mt-2">
                                        <img src={previousSubmission.imageData} alt="Previous drawing" className="img-fluid" style={{ maxHeight: '300px' }} />
                                    </div>
                                )}
                            </Alert>
                        )}

                        {isSubmitting ? (
                            <Alert variant="success">
                                <h5>Submission received!</h5>
                                <p>Waiting for other players... ({submittedCount}/{players.length})</p>
                            </Alert>
                        ) : (
                            <>
                                {isTextRound ? (
                                    <div>
                                        <Form.Group className="mb-3">
                                            <Form.Label>
                                                {game.currentRound === 1
                                                    ? 'Enter a fun phrase to start the game:'
                                                    : 'Describe what you see in the drawing:'}
                                            </Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                value={currentSubmission}
                                                onChange={(e) => setCurrentSubmission(e.target.value)}
                                                placeholder="Type your phrase here..."
                                            />
                                        </Form.Group>
                                        <Button
                                            variant="success"
                                            size="lg"
                                            onClick={handleSubmitText}
                                            disabled={isSubmitting}
                                        >
                                            Submit
                                        </Button>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="mb-3">
                                            <DrawingCanvas ref={canvasRef} />
                                        </div>
                                        <Button
                                            variant="success"
                                            size="lg"
                                            onClick={handleSubmitDrawing}
                                            disabled={isSubmitting}
                                        >
                                            Submit Drawing
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    );
}
