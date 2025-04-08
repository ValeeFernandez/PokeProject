import React from 'react';
import {
  IonFooter,
  IonItem,
  IonInput,
  IonButton,
  IonSelect,
  IonSelectOption
} from '@ionic/react';
import './footer.css'; // Crearemos este archivo después

const Footer: React.FC = () => {
  return (
    <IonFooter className="pokemon-footer">
      <div className="footer-content">
        {/* Primera columna */}
        <div className="footer-section">
          <h3>CATEGORIES</h3>
          <ul>
            <li>GIFT CARDS (BUYATAB)</li>
            <li>NEW RELEASES</li>
            <li>PLUSH</li>
            <li>FIGURES & PINS</li>
            <li>TRADING CARD GAME</li>
            <li>CLOTHING</li>
            <li>HOME</li>
            <li>VIDEO GAME</li>
          </ul>
        </div>

        {/* Segunda columna */}
        <div className="footer-section">
          <h3>CUSTOMER SERVICE</h3>
          <ul>
            <li>SHIPPING</li>
            <li>RETURN POLICY</li>
            <li>ORDER STATUS</li>
            <li>CONTACT US</li>
            <li>FAQ</li>
          </ul>
        </div>

        {/* Tercera columna */}
        <div className="footer-section">
          <h3>SITE INFO</h3>
          <ul>
            <li>ABOUT POKEMONCENTER.COM</li>
            <li>ABOUT OUR PLUSH</li>
            <li>日本版サイト</li>
          </ul>
        </div>

        {/* Cuarta columna */}
        <div className="footer-section">
          <h3>GET EMAIL UPDATES</h3>
          <div className="email-updates">
            <IonItem>
              <IonInput placeholder="Enter your email"></IonInput>
            </IonItem>
            <IonButton expand="block" color="danger">SUBSCRIBE</IonButton>
            <div className="country-selector">
              <IonSelect placeholder="United States" interface="popover">
                <IonSelectOption value="us">United States</IonSelectOption>
                <IonSelectOption value="uk">United Kingdom</IonSelectOption>
                <IonSelectOption value="jp">Japan</IonSelectOption>
              </IonSelect>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="footer-copyright">
        <p>© 2023 Pokémon. © 1995-2023 Nintendo/Creatures Inc./GAME FREAK inc.</p>
      </div>
    </IonFooter>
  );
};

export default Footer;