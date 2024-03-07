import React from "react";
import darkImage from "../../images/darkmode.png";
import lightImage from "../../images/lightmode.png";

interface LogoProps {
  mode: "light" | "dark";
}

const Logo: React.FC<LogoProps> = ({ mode }) => {
  const logoImage = mode === "light" ? lightImage : darkImage;

  return (
    <img
      src={logoImage}
      alt="Nebula Metrics"
      style={{ height: "60px" }}
      className="ml-4"
    />
  );
};

export default Logo;
