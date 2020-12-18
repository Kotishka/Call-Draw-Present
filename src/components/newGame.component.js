import React, { Component } from 'react';
import { ListGroup, Row, Col, Button, Alert } from 'react-bootstrap';
import copy from 'copy-to-clipboard';

export default class NewGame extends Component {
    constructor() {
        super();
        this.state = {
            textToCopy: "Code",
            btnText: "Copy",
            show: false,
        };
        this.copyGameCode = this.copyGameCode.bind(this);
    }

    copyGameCode() {
        copy(this.state.textToCopy);
    }

    render() {
        const { textToCopy, btnText, show } = this.state;

        return (
            <Row className="d-flex align-items-center justify-content-center">
                <Col md="6" className="mb-3">
                    <p>Share the following code:</p>
                    <div className="d-flex">
                        <ListGroup.Item>{textToCopy}</ListGroup.Item>
                        <Button variant="primary" onClick={this.copyGameCode}>{btnText}</Button>
                    </div>
                    <Alert show={show} variant="success">
                        Group code successfully copied.
                    </Alert>
                </Col>
                <Col md="6" className="mb-3">
                    <p>Or copy the link below:</p>
                    <div className="d-flex">
                        <ListGroup.Item>Cras justo odio</ListGroup.Item>
                        <Button variant="primary">Copy</Button>
                    </div>
                </Col>
                <Col lg="12" className="mb-3">
                    <h2>Modifiers</h2>
                    <div className="d-flex">
                    <ListGroup>
                        <ListGroup.Item>Cras justo odio</ListGroup.Item>
                    </ListGroup>
                    </div>
                </Col>
                <Col lg="12" className="mb-3">
                    <h2>Players</h2>
                    <div className="d-flex">
                    <ListGroup>
                        <ListGroup.Item>Cras justo odio</ListGroup.Item>
                    </ListGroup>
                    </div>
                </Col>
                <Col lg="12" className="mb-3">
                <Button variant="success" size="lg" href="/newGame">
                                Start Game
                            </Button>
                </Col>
            </Row>

        )
    }
}