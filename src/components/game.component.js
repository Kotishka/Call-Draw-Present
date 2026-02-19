import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button, Form, ListGroup, Alert, Spinner, Badge } from 'react-bootstrap';
import { useSocket } from '../contexts/SocketContext';

export default function Game() {
    const { code } = useParams();
    const navigate = useNavigate();
    const { socket } = useSocket();
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [game, setGame] = useState(null);
    const [players, setPlayers] = useState([]);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [playerName, setPlayerName] = useState('');
    const [hasJoined, setHasJoined] = useState(false);
    const [currentSubmission, setCurrentSubmission] = useState('');
    const [previousSubmission, setPreviousSubmission] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [canvasColor, setCanvasColor] = useState('#000000');
    const [canvasSize, setCanvasSize] = useState(3);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submittedCount, setSubmittedCount] = useState(0);
    const [secondsLeft, setSecondsLeft] = useState(null);
    const [timerDuration, setTimerDuration] = useState(null);

    useEffect(() => {
        if (!socket) return;

        // Load game data
        const SERVER_URL = process.env.REACT_APP_SERVER_URL || '';
        fetch(`${SERVER_URL}/api/game/${code}`)
            .then(res => res.json())
            .then(data => {
                if (data.game) {
                    setGame(data.game);
                    setPlayers(data.game.players);

                    // Check if current socket is already a player in this game
                    const existingPlayer = data.game.players.find(p => p.socketId === socket.id);
                    if (existingPlayer) {
                        setCurrentPlayer(existingPlayer);
                        setHasJoined(true);
                        console.log('Player already in game:', existingPlayer.name);
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

        // Socket event listeners
        socket.on('playerJoined', ({ player, game: updatedGame }) => {
            setCurrentPlayer(player);
            setGame(updatedGame);
            setPlayers(updatedGame.players);
            setHasJoined(true);
            setLoading(false);
        });

        socket.on('playersUpdate', ({ players: updatedPlayers }) => {
            setPlayers(updatedPlayers);
        });

        socket.on('gameStarted', ({ game: updatedGame }) => {
            setGame(updatedGame);
            setTimerDuration(updatedGame.timerDuration || null);
            socket.emit('getPreviousSubmission', { gameCode: code });
        });

        socket.on('timerUpdate', ({ secondsLeft: sLeft, roundNumber }) => {
            setSecondsLeft(sLeft);
        });

        socket.on('previousSubmission', ({ submission }) => {
            setPreviousSubmission(submission);
        });

        socket.on('submissionReceived', ({ playerName: submittedPlayer, submitted, total }) => {
            setSubmittedCount(submitted);
        });

        socket.on('nextRound', ({ game: updatedGame }) => {
            setGame(updatedGame);
            setCurrentSubmission('');
            setPreviousSubmission(null);
            setIsSubmitting(false);
            setSubmittedCount(0);
            setSecondsLeft(null);
            clearCanvas();
            socket.emit('getPreviousSubmission', { gameCode: code });
        });

        socket.on('gameComplete', ({ game: updatedGame, submissions }) => {
            setGame(updatedGame);
            // Navigate to results page
            setTimeout(() => {
                navigate(`/results/${code}`);
            }, 1000);
        });

        socket.on('playerLeft', ({ playerName: leftPlayer, players: updatedPlayers }) => {
            setPlayers(updatedPlayers);
            alert(`${leftPlayer} left the game`);
        });

        socket.on('error', ({ message }) => {
            alert(message);
            setIsSubmitting(false);
        });

        return () => {
            socket.off('playerJoined');
            socket.off('playersUpdate');
            socket.off('gameStarted');
            socket.off('timerUpdate');
            socket.off('previousSubmission');
            socket.off('submissionReceived');
            socket.off('nextRound');
            socket.off('gameComplete');
            socket.off('playerLeft');
            socket.off('error');
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket, code]);

    const handleJoinGame = () => {
        const trimmedName = playerName.trim();

        if (!trimmedName) {
            setError('Please enter your name');
            return;
        }

        if (trimmedName.length < 2) {
            setError('Name must be at least 2 characters long');
            return;
        }

        if (trimmedName.length > 20) {
            setError('Name must be 20 characters or less');
            return;
        }

        setError('');
        setLoading(true);

        socket.emit('joinGame', {
            gameCode: code,
            playerName: trimmedName
        });
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const ctx = canvas.getContext('2d');
        ctx.lineTo(x, y);
        ctx.strokeStyle = canvasColor;
        ctx.lineWidth = canvasSize;
        ctx.lineCap = 'round';
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const handleSubmitDrawing = () => {
        setIsSubmitting(true);
        const canvas = canvasRef.current;
        const imageData = canvas.toDataURL('image/png');

        socket.emit('submitContent', {
            gameCode: code,
            type: 'DRAWING',
            content: 'Drawing',
            imageData: imageData
        });
    };

    const handleSubmitText = () => {
        if (!currentSubmission.trim()) {
            alert('Please enter some text');
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

    if (loading) {
        return (
            <div className="text-center my-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Loading game...</p>
            </div>
        );
    }

    if (error) {
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
                                    isInvalid={error && !playerName.trim()}
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
                                        <span>
                                            {player.name}
                                        </span>
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

    const isCurrentPlayerTurn = game.currentRound % 2 === 1;
    const hasSubmitted = isSubmitting;

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
                <Card className="shadow">
                    <Card.Body>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h3 className="mb-0">
                                {isCurrentPlayerTurn ? '📝 Write Your Phrase' : '🎨 Draw What You See'}
                            </h3>
                            {timerDuration && secondsLeft !== null && (
                                <div className="text-end" style={{ minWidth: '120px' }}>
                                    <div className={`fw-bold fs-4 ${secondsLeft <= 10 ? 'text-danger' : 'text-dark'}`}>
                                        ⏱ {secondsLeft > 0 ? `${secondsLeft}s` : 'Time\'s up!'}
                                    </div>
                                    <div style={{ height: '6px', background: '#dee2e6', borderRadius: '3px', marginTop: '4px' }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${Math.max(0, (secondsLeft / timerDuration) * 100)}%`,
                                            background: secondsLeft <= 10 ? '#dc3545' : '#0d6efd',
                                            borderRadius: '3px',
                                            transition: 'width 1s linear'
                                        }} />
                                    </div>
                                </div>
                            )}
                        </div>

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

                        {hasSubmitted ? (
                            <Alert variant="success">
                                <h5>Submission received!</h5>
                                <p>Waiting for other players... ({submittedCount}/{players.length})</p>
                            </Alert>
                        ) : (
                            <>
                                {isCurrentPlayerTurn ? (
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
                                            {isSubmitting ? 'Submitting...' : 'Submit'}
                                        </Button>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="mb-3">
                                            <Row className="mb-2">
                                                <Col>
                                                    <Form.Label>Brush Color:</Form.Label>
                                                    <Form.Control
                                                        type="color"
                                                        value={canvasColor}
                                                        onChange={(e) => setCanvasColor(e.target.value)}
                                                    />
                                                </Col>
                                                <Col>
                                                    <Form.Label>Brush Size: {canvasSize}px</Form.Label>
                                                    <Form.Range
                                                        min="1"
                                                        max="20"
                                                        value={canvasSize}
                                                        onChange={(e) => setCanvasSize(parseInt(e.target.value))}
                                                    />
                                                </Col>
                                                <Col className="d-flex align-items-end">
                                                    <Button variant="secondary" onClick={clearCanvas}>
                                                        Clear Canvas
                                                    </Button>
                                                </Col>
                                            </Row>
                                        </div>
                                        <canvas
                                            ref={canvasRef}
                                            width={800}
                                            height={600}
                                            style={{
                                                border: '2px solid #ddd',
                                                borderRadius: '8px',
                                                cursor: 'crosshair',
                                                backgroundColor: '#ffffff',
                                                maxWidth: '100%'
                                            }}
                                            onMouseDown={startDrawing}
                                            onMouseMove={draw}
                                            onMouseUp={stopDrawing}
                                            onMouseLeave={stopDrawing}
                                        />
                                        <div className="mt-3">
                                            <Button
                                                variant="success"
                                                size="lg"
                                                onClick={handleSubmitDrawing}
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? 'Submitting...' : 'Submit Drawing'}
                                            </Button>
                                        </div>
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
