import React from "react";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import Logo from "./Logo";

const NavBar: React.FC = () => {
  return (
    <Navbar bg="dark" variant="dark" expand="md">
      <Navbar.Brand href="/">
        <Logo />
      </Navbar.Brand>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="ml-auto mr-4">
          <Nav.Link href="/" style={{ color: 'white' }}>Home</Nav.Link>
          <Nav.Link href="/system" style={{ color: 'white' }}>System</Nav.Link>
          <Nav.Link href="/process" style={{ color: 'white' }}>Process</Nav.Link>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
};

export default NavBar;