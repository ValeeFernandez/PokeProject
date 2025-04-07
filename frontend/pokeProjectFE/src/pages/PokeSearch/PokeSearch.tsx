import React from 'react';
import './PokeSearch.css';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import PokemonList from '../../components/Poke/PokemonList'; 
import Sidebar from '../../components/Sidebar/Sidebar';
import TopBar from '../../components/TopBar/TopBar';

const PokeSearch: React.FC = () => {
  const history = useHistory();
  return (
    <>
      <Sidebar /> {/* Menú lateral */}
      
      <IonPage id="main-content">
        <TopBar title="PokeLab" /> {/* Barra superior con título */}
        
        <IonContent fullscreen>
          <PokemonList />
        </IonContent>
      </IonPage>
    </>
  );
};

export default PokeSearch;
