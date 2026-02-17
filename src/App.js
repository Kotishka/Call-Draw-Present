import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Navbar, Container } from 'react-bootstrap';
import "bootstrap/dist/css/bootstrap.min.css";
import { SocketProvider } from "./contexts/SocketContext";
import Home from "./components/home.component.js";
import NewGame from "./components/newGame.component.js";
import Game from "./components/game.component.js";
import Results from "./components/results.component.js";

function App() {
  return (
    <SocketProvider>
      <Router>
      <Navbar expand="md" bg="dark" variant="dark">
        <Container>
          <Navbar.Brand href="/">Call, Draw, Present</Navbar.Brand>
        </Container>
      </Navbar>
      <br />
      <Container>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/newGame" element={<NewGame />} />
          <Route path="/game/:code" element={<Game />} />
          <Route path="/results/:code" element={<Results />} />
        </Routes>
      </Container>
    </Router>
    </SocketProvider>
  );
}

export default App;
