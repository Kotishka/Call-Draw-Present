import React, { Component } from "react";
import { BrowserRouter as Router, Route } from "react-router-dom";
import { Navbar } from 'react-bootstrap';
import "bootstrap/dist/css/bootstrap.min.css";
import Home from "./components/home.component.js";
import NewGame from "./components/newGame.component.js";
import Game from "./components/game.component.js";

class App extends Component {
  render() {
    return (
      <Router>
        <Navbar expand="md" bg="dark" variant="dark">
        <div className="container">
          <Navbar.Brand href="/">Call, Draw, Present</Navbar.Brand>
          </div>
        </Navbar>
        <br />
        <div className="container">
          <Route path="/" exact component={Home} />
          <Route path="/newGame" exact component={NewGame} />
          <Route path="/game" exact component={Game} />
        </div>
      </Router>
    );
  }
}
export default App;