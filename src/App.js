import React, { Component } from "react";
import { BrowserRouter as Router, Route } from "react-router-dom";
import { Navbar, Nav } from 'react-bootstrap';
import "bootstrap/dist/css/bootstrap.min.css";
import Home from "./components/home.component.js";
import Login from "./components/login.component.js";

class App extends Component {
  render() {
    return (
      <Router>
        <Navbar collapseOnSelect expand="md" bg="dark" variant="dark">
        <div className="container">
          <Navbar.Brand href="#home">Call, Draw, Present</Navbar.Brand>
          <Navbar.Toggle aria-controls="responsive-navbar-nav" />
          <Navbar.Collapse id="responsive-navbar-nav">
            <Nav className="mr-auto">
              <Nav.Link href="/#top">Home</Nav.Link>
              <Nav.Link href="/#play">Play</Nav.Link>
              <Nav.Link href="/#rules">Rules</Nav.Link>
            </Nav>
            <Nav>
              <Nav.Link href="/login">Login / Sign Up</Nav.Link>
            </Nav>
          </Navbar.Collapse>
          </div>
        </Navbar>
        <br />
        <div className="container">
          <Route path="/" exact component={Home} />
          <Route path="/login" exact component={Login} />
        </div>
      </Router>
    );
  }
}
export default App;