import React from 'react';
import './QrOrder.css';
import Button from '../../../components/Button/Button';

const QrOrder = ({ onBack }) => {
  return (
    <div className="kiosk-qr-order">
      <div className="qr-card glass">
        <button className="back-btn" onClick={onBack}>← Back</button>
        
        <h2>Scan to Order on Phone</h2>
        <p>Skip the screen and customize your order on your own device.</p>
        
        <div className="qr-container">
          <img src="/kiosk_qr_code.png" alt="QR Code" className="qr-image" />
        </div>

        <div className="instructions">
          <ol>
            <li>Open your phone camera</li>
            <li>Scan the QR code</li>
            <li>Complete your order on mobile</li>
          </ol>
        </div>

        <Button variant="secondary" size="large" onClick={onBack}>Continue on Kiosk</Button>
      </div>
    </div>
  );
};

export default QrOrder;
