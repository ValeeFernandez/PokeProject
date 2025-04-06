import React from 'react';
import './NotFound.css';
import { IonButton, IonPage, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import TopBar from '../../components/TopBar/TopBar';

const NotFound: React.FC = () => {
  const history = useHistory();

  return (
    <>
      <Sidebar /> {/* Menú lateral */}
      
      <IonPage id="main-content">
        <TopBar title="PokeLab" />
        
        <IonContent>
          <div className="notfound-container">
            <img src="/assets/pikachuError.jpg" alt="Pikachu Error" className="notfound-img" />
            <div className="notfound-text">
              <h1 className="notfound-title">404</h1>
              <p className="notfound-subtitle">Lo siento, no encontramos esa página jiji.</p>
            </div>
          </div>
        </IonContent>
      </IonPage>
    </>
  );
};

export default NotFound;