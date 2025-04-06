// src/components/TopBar/TopBar.txx
import React from 'react';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonMenuToggle,
  IonIcon
} from '@ionic/react';
import { menuOutline } from 'ionicons/icons';
import './TopBar.css'; // Asegúrate de crear este archivo CSS

interface TopBarProps {
  title?: string;
}

const TopBar: React.FC<TopBarProps> = ({ title = 'PokeLab' }) => {
  return (
    <IonHeader>
      <IonToolbar>
        <IonButtons slot="start">
          <IonMenuToggle menu="main-menu">
            <IonButton fill="clear">
              <IonIcon 
                icon={menuOutline} 
                slot="start"
                className="menu-icon" 
              />
            </IonButton>
          </IonMenuToggle>
        </IonButtons>

        <div className="title-container">
          <IonTitle className='pokemon-title'>
            {title}
          </IonTitle>
        </div>

        <IonButtons slot="end">
          <img 
            src="/assets/pokemon.png" 
            alt="Pokémon Logo"
            className="pokemon-logo" 
          />
        </IonButtons>
      </IonToolbar>
    </IonHeader>
  );
};

export default TopBar;