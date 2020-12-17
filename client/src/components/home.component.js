import React, { Component } from 'react';
import { Button } from 'react-bootstrap';

export default class CreateTodo extends Component {
    render() {
        return (
            <div>
                <div className="my-auto" id="top">
                <h1>Welcome to Call, Draw, and Present!</h1>
                </div>
                <div className="my-auto" id="play">
                <Button variant="primary" size="lg">
                    Start New Game
                </Button>
                </div>
                <div className="my-auto" id="rules">
                <h2>Rules</h2>
                </div>
            </div>
            
        )
    }
}