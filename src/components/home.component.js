import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, InputGroup, FormControl, Row, Col, Card, Alert } from 'react-bootstrap';

export default function Home() {
    const [gameCode, setGameCode] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleJoinGame = () => {
        const trimmedCode = gameCode.trim().toUpperCase();

        if (!trimmedCode) {
            setError('Please enter a game code');
            return;
        }

        if (trimmedCode.length !== 6) {
            setError('Game code must be 6 characters');
            return;
        }

        setError('');
        navigate(`/game/${trimmedCode}`);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleJoinGame();
        }
    };

    return (
        <Container>
            <Card className="text-center my-4 p-4 shadow">
                <Card.Body>
                    <h1 className="display-4 mb-4">Welcome to Call, Draw, and Present!</h1>
                    <p className="lead mb-5">The telephone game with a twist - draw what you see and describe what you draw!</p>

                    {error && (
                        <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-4">
                            {error}
                        </Alert>
                    )}

                    <Row className="justify-content-center align-items-center mb-4">
                        <Col md={4} className="mb-3">
                            <Button
                                variant="success"
                                size="lg"
                                onClick={() => navigate('/newGame')}
                                className="w-100"
                            >
                                Start New Game
                            </Button>
                        </Col>
                        <Col md={1} className="mb-3 text-center">
                            <div style={{fontSize: 22, fontWeight: 'bold'}}>OR</div>
                        </Col>
                        <Col md={5} className="mb-3">
                            <InputGroup size="lg">
                                <FormControl
                                    placeholder="Enter 6-Character Code"
                                    aria-label="Game Code"
                                    value={gameCode}
                                    onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                                    onKeyPress={handleKeyPress}
                                    maxLength={6}
                                    isInvalid={error && !gameCode.trim()}
                                />
                                <Button
                                    variant="success"
                                    onClick={handleJoinGame}
                                    disabled={!gameCode.trim()}
                                >
                                    Join!
                                </Button>
                            </InputGroup>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Card className="my-4 p-4">
                <Card.Body>
                    <h2 className="mb-4">How to Play</h2>
                    <Row>
                        <Col md={6} className="mb-3">
                            <h5>📝 Round 1: Write a Phrase</h5>
                            <p>Start by writing a fun phrase or sentence that the next player will need to draw.</p>
                        </Col>
                        <Col md={6} className="mb-3">
                            <h5>🎨 Round 2: Draw It</h5>
                            <p>View the previous player's phrase and draw a picture representing it.</p>
                        </Col>
                        <Col md={6} className="mb-3">
                            <h5>📖 Round 3: Describe It</h5>
                            <p>Look at the drawing and write what you think it is.</p>
                        </Col>
                        <Col md={6} className="mb-3">
                            <h5>🔄 Repeat & Reveal</h5>
                            <p>Keep alternating between drawing and writing until everyone has contributed. Then see how much the original phrase changed!</p>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </Container>
    );
}
