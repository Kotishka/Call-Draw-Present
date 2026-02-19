import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Alert, Spinner, Accordion, Badge } from 'react-bootstrap';
import ExportButton from './ExportButton';

export default function Results() {
    const { code } = useParams();
    const navigate = useNavigate();
    const [chains, setChains] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeKeys, setActiveKeys] = useState(['0']);
    const fullGameRef = useRef(null);
    const chainRefs = useRef([]);

    useEffect(() => {
        loadResults();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [code]);

    const loadResults = async () => {
        try {
            const SERVER_URL = process.env.REACT_APP_SERVER_URL || '';
            const response = await fetch(`${SERVER_URL}/api/game/${code}`);
            const data = await response.json();

            if (!response.ok || !data.game) {
                setError('Game not found');
                setLoading(false);
                return;
            }

            const playerChains = buildChains(data.game);
            setChains(playerChains);
            setLoading(false);
        } catch (err) {
            console.error('Error loading results:', err);
            setError('Failed to load results');
            setLoading(false);
        }
    };

    const buildChains = (game) => {
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
                            player: player,
                            round: round
                        });
                    }
                }
            }

            chains.push(chain);
        }

        return chains;
    };

    if (loading) {
        return (
            <div className="text-center my-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Loading results...</p>
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

    return (
        <div>
            <Card className="mb-4 shadow text-center">
                <Card.Body>
                    <h1 className="mb-3">🎉 Game Complete!</h1>
                    <p className="lead">See how the phrases transformed through the telephone chain!</p>
                    <p className="text-muted">Game Code: <strong>{code}</strong></p>
                </Card.Body>
            </Card>

            <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="mb-0">Submission Chains</h3>
                <ExportButton
                    targetRef={fullGameRef}
                    filename={`call-draw-present-${code}`}
                    label="Export Full Game"
                    variant="outline-primary"
                    size="sm"
                />
            </div>
            <p className="text-muted mb-4">Follow each chain from start to finish to see how the phrase evolved</p>

            <div ref={fullGameRef}>
            <Accordion activeKey={activeKeys} onSelect={(key) => setActiveKeys(key ? [key] : [])}>
                {chains.map((chain, index) => (
                    <Accordion.Item eventKey={index.toString()} key={index}>
                        <Accordion.Header>
                            <strong>Chain {index + 1}:</strong>&nbsp;Started by {chain.startPlayer.name}
                            <Badge bg="secondary" className="ms-2">{chain.submissions.length} steps</Badge>
                        </Accordion.Header>
                        <Accordion.Body>
                            {chain.submissions.length === 0 ? (
                                <Alert variant="info">No submissions in this chain</Alert>
                            ) : (
                                <>
                                <div className="d-flex justify-content-end mb-2">
                                    <ExportButton
                                        targetRef={{ current: chainRefs.current[index] }}
                                        filename={`chain-${index + 1}-${chain.startPlayer.name}`}
                                        label="Export Chain"
                                    />
                                </div>
                                <div
                                    ref={el => chainRefs.current[index] = el}
                                    style={{
                                        display: 'flex',
                                        overflowX: 'auto',
                                        gap: '0',
                                        padding: '8px 0 16px 0',
                                        alignItems: 'stretch',
                                        background: '#fff'
                                    }}
                                >
                                    {chain.submissions.map((submission, subIndex) => (
                                        <React.Fragment key={subIndex}>
                                            {/* Step Card */}
                                            <div style={{ minWidth: '220px', maxWidth: '260px', flexShrink: 0 }}>
                                                <Card className="h-100 shadow-sm">
                                                    <Card.Header className="bg-light py-2">
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <Badge bg={submission.type === 'TEXT' ? 'info' : 'success'}>
                                                                {submission.type === 'TEXT' ? '📝 Text' : '🎨 Drawing'}
                                                            </Badge>
                                                            <Badge bg="primary">Round {submission.round}</Badge>
                                                        </div>
                                                        <div className="text-muted small mt-1 text-center">
                                                            {submission.player.name}
                                                        </div>
                                                    </Card.Header>
                                                    <Card.Body className="d-flex align-items-center justify-content-center p-2" style={{ minHeight: '160px' }}>
                                                        {submission.type === 'TEXT' ? (
                                                            <p className="fs-6 text-center mb-0 fst-italic">
                                                                "{submission.content}"
                                                            </p>
                                                        ) : (
                                                            <img
                                                                src={submission.imageData}
                                                                alt={`Drawing by ${submission.player.name}`}
                                                                style={{
                                                                    maxWidth: '100%',
                                                                    maxHeight: '200px',
                                                                    borderRadius: '4px',
                                                                    border: '1px solid #ddd'
                                                                }}
                                                            />
                                                        )}
                                                    </Card.Body>
                                                </Card>
                                            </div>

                                            {/* Arrow between steps */}
                                            {subIndex < chain.submissions.length - 1 && (
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: '0 8px',
                                                    color: '#6c757d',
                                                    fontSize: '1.5rem',
                                                    flexShrink: 0
                                                }}>
                                                    →
                                                </div>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                                </>
                            )}
                        </Accordion.Body>
                    </Accordion.Item>
                ))}
            </Accordion>
            </div>

            <div className="text-center mt-5 mb-4">
                <Button variant="primary" size="lg" onClick={() => navigate('/')}>
                    Play Again
                </Button>
            </div>
        </div>
    );
}
