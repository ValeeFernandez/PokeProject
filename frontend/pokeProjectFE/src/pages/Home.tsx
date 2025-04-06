import React from 'react';
import {
  IonApp,
  IonContent,
  IonPage,
} from '@ionic/react';
import Sidebar from '../components/Sidebar/Sidebar';
import TopBar from '../components/TopBar/TopBar';

const Home: React.FC = () => {
  return (
    <IonApp>
      <Sidebar /> {/* Menú lateral */}

      <IonPage id="main-content">
        {/* Reemplazamos todo el IonHeader con el nuevo componente TopBar */}
        <TopBar title="PokeLab" />

        <IonContent fullscreen>
          <video
            autoPlay
            muted
            loop
            playsInline
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              minWidth: '100%',
              minHeight: '100%',
              objectFit: 'cover',
              zIndex: -1,
            }}
          >
            {/* Cambiamos la ruta del video */}
            <source src="/assets/video2.mp4" type="video/mp4" />
            Tu navegador no soporta el video.
          </video>
        </IonContent>
      </IonPage>
    </IonApp>
  );
};

export default Home;