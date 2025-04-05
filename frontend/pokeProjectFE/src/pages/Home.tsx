import React from 'react';
import {
  IonApp,
  IonFooter,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonPage,
  IonMenuToggle,
  IonButton,
  IonButtons,
} from '@ionic/react';
import Sidebar from '../components/Sidebar/Sidebar';
import { colorFill, menuOutline } from 'ionicons/icons';
import { IonIcon } from '@ionic/react';


const Home: React.FC = () => {
  return (
    <IonApp>
      <Sidebar /> {/* Importamos el menú lateral */}

      <IonPage id="main-content">
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonMenuToggle menu="main-menu">
                <IonButton fill="clear">
                  <IonIcon icon={menuOutline} slot="start"
                    className="menu-icon" style={{ fontSize: '50px', color: '#4A7C99', margin: '10px' }} />
                </IonButton>
              </IonMenuToggle>
            </IonButtons>

            <div style={{ position: 'relative', left: 0, right: 15, textAlign: 'center', pointerEvents: 'none', marginTop: '10px' }}>
              <IonTitle className='pokemon-title' style={{ color: '#4A7C99', display: 'inline-block', pointerEvents: 'auto', fontSize: '3rem' }}>
                PokeLab
              </IonTitle>
            </div>

            <IonButtons slot="end">
              <img src="public/assets/pokemon.png" alt="Pokémon Logo"
                style={{ height: '60px', marginRight: '20px', margin: '10px' }} />
            </IonButtons>
          </IonToolbar>

        </IonHeader>

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
            <source src="public/assets/video2.mp4" type="video/mp4" />
            Tu navegador no soporta el video.
          </video>
        </IonContent>
      </IonPage>
    </IonApp>
  );
};

export default Home;
