import React from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

interface ModeSelectorModalProps {
  show: boolean;
  onHide: () => void;
  onModeSelect: (mode: "light" | "dark") => void;
  mode: "light" | "dark"; // Add mode prop
}

const ModeSelectorModal: React.FC<ModeSelectorModalProps> = ({
  show,
  onHide,
  onModeSelect,
  mode,
}) => {
  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title className="text-black">Select Mode</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Button
          variant={mode === "dark" ? "outline-dark" : "outline-dark"}
          onClick={() => onModeSelect(mode === "dark" ? "light" : "dark")}
        >
          {mode === "dark" ? "Light Mode" : "Dark Mode"}
        </Button>
      </Modal.Body>
    </Modal>
  );
};

export default ModeSelectorModal;
