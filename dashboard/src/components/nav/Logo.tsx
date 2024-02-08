import React from 'react';
import logoImage from '../../images/darkmode.png';

const Logo: React.FC = () => {
  return <img src={logoImage} alt="Nebula Metrics" style={{ height: '60px' }} className='ml-4' />;
};

export default Logo;