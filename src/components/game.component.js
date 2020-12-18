import React, { Component } from 'react';
import { ListGroup, Row, Col } from 'react-bootstrap';

export default class NewGame extends Component {
    render() {
        return (
            <Row>
                <Col lg="3">
                    <h2>Players</h2>
                    <ListGroup>
                        <ListGroup.Item>Cras justo odio</ListGroup.Item>
                    </ListGroup>
                </Col>
            </Row>

        )
    }
}