import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button, Alert, Spinner, Accordion, Badge } from 'react-bootstrap';
import { buildChains } from '../utils/buildChains';

export default function Results() {
    const { code } = useParams();
    const navigate = useNavigate();
    const [chains, setChains] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

            setChains(buildChains(data.game));
            setLoading(false);
        } catch (err) {
            console.error('Error loading results:', err);
            setError('Failed to load results');
            setLoading(false);
        }
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

            <h3 className="mb-3">Submission Chains</h3>
            <p className="text-muted mb-4">Each accordion shows one complete chain from start to finish</p>

            <Accordion defaultActiveKey="0">
                {chains.map((chain, index) => (
                    <Accordion.Item eventKey={index.toString()} key={index}>
                        <Accordion.Header>
                            <strong>Chain {index + 1}:</strong>&nbsp;Started by {chain.startPlayer.name}
                            <Badge bg="secondary" className="ms-2">{chain.submissions.length} submissions</Badge>
                        </Accordion.Header>
                        <Accordion.Body>
                            {chain.submissions.length === 0 ? (
                                <Alert variant="info">No submissions in this chain</Alert>
                            ) : (
                                <Row>
                                    {chain.submissions.map((submission, subIndex) => (
                                        <Col md={6} lg={4} key={subIndex} className="mb-4">
                                            <Card className="h-100">
                                                <Card.Header className="bg-light">
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <span>
                                                            <Badge bg="primary">Round {submission.round}</Badge>
                                                        </span>
                                                        <span className="text-muted small">{submission.player.name}</span>
                                                    </div>
                                                </Card.Header>
                                                <Card.Body>
                                                    {submission.type === 'TEXT' ? (
                                                        <>
                                                            <div className="text-center mb-2">
                                                                <Badge bg="info">📝 Text</Badge>
                                                            </div>
                                                            <p className="fs-5 text-center">"{submission.content}"</p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="text-center mb-2">
                                                                <Badge bg="success">🎨 Drawing</Badge>
                                                            </div>
                                                            <div className="text-center">
                                                                <img
                                                                    src={submission.imageData}
                                                                    alt={`Drawing by ${submission.player.name}`}
                                                                    className="img-fluid rounded"
                                                                    style={{ maxHeight: '300px', border: '1px solid #ddd' }}
                                                                />
                                                            </div>
                                                        </>
                                                    )}
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            )}

                            {chain.submissions.length >= 2 && (
                                <Alert variant="success" className="mt-3">
                                    <strong>Transformation:</strong> "{chain.submissions[0].content}"
                                    {chain.submissions.length > 1 && chain.submissions[chain.submissions.length - 1].type === 'TEXT' &&
                                        ` → "${chain.submissions[chain.submissions.length - 1].content}"`
                                    }
                                </Alert>
                            )}
                        </Accordion.Body>
                    </Accordion.Item>
                ))}
            </Accordion>

            <div className="text-center mt-5 mb-4">
                <Button variant="primary" size="lg" onClick={() => navigate('/')}>
                    Play Again
                </Button>
            </div>
        </div>
    );
}
