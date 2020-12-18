import React, { Component } from 'react';
import { Button, Jumbotron, InputGroup, FormControl, Row, Col } from 'react-bootstrap';

export default class Home extends Component {
    render() {
        return (
            <div>
                <Jumbotron>
                    <div className="my-auto">
                        <h1>Welcome to Call, Draw, and Present!</h1>
                        <p className="my-4">Call your friends, draw on a canvas, and present to your friends!</p>
                    </div>
                    <Row className="justify-content-md-left d-flex align-items-center">
                        <Col lg="3">
                            <Button variant="success" size="lg" href="/newGame">
                                Start New Game
                            </Button>
                        </Col>
                        <Col lg="1" className="my-3"><div style={{fontSize: 22}}>OR</div></Col>
                        <Col lg="4">
                            <InputGroup size="lg">
                                <FormControl
                                    placeholder="Enter Group Code"
                                    aria-label="Group Code"
                                    aria-describedby="Group Code"
                                />
                                <InputGroup.Append>
                                    <Button variant="success">Go!</Button>
                                </InputGroup.Append>
                            </InputGroup>
                        </Col>

                    </Row>
                </Jumbotron>
                <div className="my-auto">
                    <h2>Rules</h2>
                </div>
            </div>

        )
    }
}