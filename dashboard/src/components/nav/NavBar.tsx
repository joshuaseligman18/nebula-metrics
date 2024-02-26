// NavBar.tsx
import React from "react";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import Logo from "./Logo";

interface NavBarProps {
  mode: "light" | "dark";
}

const NavBar: React.FC<NavBarProps> = ({ mode }) => {
  return (
    <Navbar
      bg={mode === "light" ? "light" : "dark"}
      variant={mode === "light" ? "light" : "dark"}
      expand="md"
    >
      <Navbar.Brand href="/web">
        <Logo mode={mode} />
      </Navbar.Brand>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="ml-auto mr-4">
          <Nav.Link
            href="/web"
            style={{ color: mode === "light" ? "black" : "white" }}
          >
            Home
          </Nav.Link>
          <Nav.Link
            href="/web/system"
            style={{ color: mode === "light" ? "black" : "white" }}
          >
            System
          </Nav.Link>
          <Nav.Link
            href="/web/process"
            style={{ color: mode === "light" ? "black" : "white" }}
          >
            Process
          </Nav.Link>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
};

export default NavBar;
