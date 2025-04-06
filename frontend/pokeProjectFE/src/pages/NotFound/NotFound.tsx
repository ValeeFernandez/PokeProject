import React from 'react';
import './NotFound.css';
import { IonButton } from '@ionic/react';
import { useHistory } from 'react-router-dom';


const NotFound: React.FC = () => {
  const history = useHistory();

  return (
    <div className="notfound-container">
      <img src="/assets/pikachuError.jpg" alt="Pikachu Error" className="notfound-img" />
      <div className="notfound-text">
        <h1 className="notfound-title">404</h1>
        <p className="notfound-subtitle">Lo siento, no encontramos esa página jiji.</p>
      </div>
    </div>
  );
};

export default NotFound;
