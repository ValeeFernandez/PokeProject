import React from 'react';
import './PokeSearch.css';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import PokemonList from '../../components/Poke/PokemonList'; 

const PokeSearch: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonContent fullscreen>
        <PokemonList />
      </IonContent>
    </IonPage>
  );
};

export default PokeSearch;
