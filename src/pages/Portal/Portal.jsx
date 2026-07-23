import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Portal.css';
import { useAuthStore } from '../../store/useAuthStore';
import { t } from '../../utils/i18n';
import toast from 'react-hot-toast';

const Portal = () => {
  const navigate = useNavigate();
  const loginStore = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('12345');
  const [loading, setLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading(t('portal.loggingIn', 'Authenticating...'));
    try {
      const result = await loginStore(email, password);

      if (result.success) {
        toast.success(t('portal.loginSuccess', 'Welcome to CHILLD CRM! ☕'), { id: toastId });
        let destination = '/admin';
        const role = (result.role || '').toLowerCase();
        if (role === 'staff' || role === 'barista' || role === 'kitchen') {
          destination = '/barista';
        } else {
          destination = '/admin';
        }
        navigate(destination);
      } else {
        toast.error(result.error || t('portal.loginFailed', 'Login failed. Please check your credentials.'), { id: toastId });
      }
    } catch (err) {
      console.error('Login failed:', err);
      toast.error(t('portal.loginError', 'Connection error. Please try again later.'), { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleAutofill = (selectedEmail, selectedPassword, roleName) => {
    setEmail(selectedEmail);
    setPassword(selectedPassword);
    toast.success(t('portal.autofillLoaded', `Filled ${roleName} credentials! ⚡`), {
      duration: 1500,
      icon: '☕'
    });
  };

  return (
    <div className="portal-page">
      <div className="portal-card-glow"></div>
      <div className="portal-card glass">
        {/* Modern Lock Badge */}
        <div className="portal-badge">
          <span className="badge-icon">☕</span>
          <span className="badge-text">{t('portal.badgeText', 'CHILLD COFFEE • Authorised CRM Access')}</span>
        </div>

        {/* Official Kiosk Website Chilld Logo & COFFEE */}
        <div className="portal-logo-container">
          <div className="portal-brand-logo">
            <svg
              width="145"
              height="55"
              viewBox="0 0 392 150"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="kiosk-chilld-logo-svg"
            >
              <path
                d="M83.6241 126.264C75.5315 131.479 64.0219 133.997 50.8938 133.997C17.9837 133.997 0 112.956 0 86.6994C0 50.0127 25.1772 24.6557 61.684 24.6557C74.8121 24.6557 87.2209 27.7129 94.9539 33.1081L88.8394 48.9337C82.725 43.8983 71.3952 40.841 61.3244 40.841C34.5287 40.841 17.9837 59.3642 17.9837 85.0809C17.9837 104.683 31.6513 117.811 53.5914 117.811C65.2808 117.811 76.7903 114.394 84.883 108.819L83.6241 126.264Z"
                fill="#007AFF"
              />
              <path
                d="M164.632 132.738H147.728L156 85.0809C156.36 83.1027 156.54 81.1245 156.54 79.506C156.54 71.4133 151.864 67.2771 142.692 67.2771C135.678 67.2771 127.046 70.3343 119.313 75.7294L109.242 132.738H92.3378L111.94 19.6203L129.025 18.7211L121.471 62.4215C130.104 56.1272 140.174 52.3506 150.065 52.3506C165.172 52.3506 174.343 59.9037 174.343 74.2907C174.343 76.6286 173.984 79.506 173.444 82.2035L164.632 132.738Z"
                fill="#007AFF"
              />
              <path
                d="M206.663 19.0808C211.879 19.0808 215.475 22.8574 215.475 27.5331C215.475 34.0072 210.44 38.5032 204.326 38.5032C199.11 38.5032 195.514 34.7266 195.514 29.871C195.514 23.5767 200.369 19.0808 206.663 19.0808ZM209.721 53.2498L195.873 132.738H178.969L192.636 53.9691L209.721 53.2498Z"
                fill="#007AFF"
              />
              <path
                d="M247.141 18.7211L227.359 132.738H210.454L230.056 19.6203L247.141 18.7211Z"
                fill="#007AFF"
              />
              <path
                d="M278.626 18.7211L258.844 132.738H241.94L261.542 19.6203L278.626 18.7211Z"
                fill="#007AFF"
              />
              <path
                d="M352.91 0.00287359C359.919 0.12526 366.052 2.82242 369.724 8.83257C372.961 14.1322 373.44 20.7341 373.02 26.9347C372.171 39.4593 367.106 56.2999 361.343 74.2189L361.273 74.436L361.191 74.6492C357.232 84.9088 352.436 96.5472 347.462 104.515C348.914 108.852 350.599 112.451 352.448 115.214C354.772 118.686 357.037 120.385 359.018 121.062L356.432 128.633L353.846 136.205C347.51 134.041 342.712 129.438 339.149 124.113C337.889 122.23 336.744 120.199 335.703 118.056C328.049 124.917 319.069 130.437 309.802 132.319C304.127 133.472 298.157 132.756 292.44 130.44C286.697 128.113 281.828 124.414 277.981 118.499C269.28 105.118 273.559 87.4638 281.306 74.8511C289.144 62.0899 303.034 50.2714 319.155 50.5528L318.876 66.5523C310.783 66.4111 301.312 72.8546 294.942 83.2262C288.48 93.7463 287.703 103.563 291.396 109.242C293.747 112.858 296.2 115.231 298.449 116.143C300.724 117.065 303.415 117.288 306.616 116.638C313.288 115.282 321.224 110.288 328.559 102.745C329.032 102.258 329.484 101.772 329.919 101.286C325.437 82.8534 324.341 59.9491 326.592 41.0966C327.799 30.9954 330.036 21.4174 333.651 14.1384C337.109 7.17343 343.206 -0.166409 352.91 0.00287359ZM352.631 16.0024C352.456 15.9994 350.593 15.9995 347.983 21.255C345.528 26.1986 343.588 33.7282 342.481 42.9937C341.158 54.0749 341.13 66.7245 342.34 78.6922C343.622 75.6207 344.907 72.3922 346.179 69.1018C352.063 50.7973 356.367 36.0038 357.055 25.8526C357.404 20.6955 356.688 18.188 356.069 17.1747C355.884 16.872 355.498 16.0525 352.631 16.0024Z"
                fill="#007AFF"
              />
              <path
                d="M386.065 123.99C383.529 125.555 380.689 128.493 378.556 133.517C376.417 138.556 375.085 140.983 373.311 142.722C371.809 144.195 369.943 145.229 366.758 146.826C366.646 146.758 366.56 146.686 366.467 146.579C366.383 146.483 366.218 146.236 366.1 146.032C365.983 145.829 365.819 145.522 365.737 145.352C365.654 145.182 365.511 144.842 365.418 144.597C365.325 144.352 365.219 144.055 365.182 143.937C365.145 143.819 365.075 143.565 365.027 143.372C364.979 143.179 364.9 142.805 364.853 142.54C364.806 142.275 364.755 141.918 364.741 141.748C364.727 141.577 364.707 141.167 364.697 140.836C364.687 140.505 364.687 140.056 364.698 139.839C364.708 139.621 364.739 139.233 364.766 138.977C364.793 138.721 364.845 138.342 364.883 138.137C364.921 137.93 364.99 137.579 365.037 137.355C365.084 137.131 365.22 136.622 365.339 136.224C365.458 135.827 365.65 135.261 365.765 134.966C365.88 134.672 366.088 134.187 366.228 133.889C366.368 133.591 366.585 133.157 366.71 132.926C366.835 132.695 367.066 132.297 367.222 132.041C367.379 131.785 367.625 131.401 367.771 131.189C367.916 130.976 368.186 130.603 368.371 130.36C368.556 130.118 368.985 129.608 369.323 129.227C369.703 128.8 370.126 128.357 370.43 128.069C370.701 127.813 371.12 127.437 371.362 127.233C371.603 127.03 371.989 126.722 372.219 126.548C372.449 126.374 372.914 126.051 373.251 125.83C373.589 125.61 374.11 125.295 374.408 125.131C374.706 124.967 375.097 124.763 375.278 124.677C375.459 124.591 375.825 124.429 376.091 124.316C376.357 124.203 376.587 124.111 376.603 124.111C376.619 124.113 376.798 124.049 377.001 123.971C377.205 123.893 377.604 123.762 377.889 123.679C378.174 123.597 378.496 123.513 378.604 123.493C378.713 123.473 378.914 123.43 379.05 123.398C379.187 123.365 379.541 123.302 379.837 123.256C380.133 123.211 380.795 123.159 381.308 123.142C381.821 123.125 382.452 123.131 382.711 123.154C382.97 123.178 383.239 123.209 383.309 123.224C383.378 123.239 383.577 123.272 383.751 123.298C383.925 123.324 384.18 123.371 384.319 123.402C384.457 123.433 384.587 123.474 384.608 123.493C384.628 123.512 384.675 123.526 384.713 123.524C384.75 123.523 384.94 123.572 385.137 123.634C385.333 123.696 385.597 123.789 385.724 123.84C385.85 123.891 385.978 123.942 386.006 123.955C386.02 123.961 386.042 123.974 386.065 123.99Z"
                fill="#007AFF"
              />
              <path
                d="M389.749 138.634C389.643 138.884 389.484 139.239 389.395 139.424C389.305 139.608 389.146 139.92 389.042 140.117C388.937 140.314 388.734 140.672 388.59 140.913C388.447 141.154 388.178 141.573 387.994 141.843C387.81 142.113 387.509 142.533 387.324 142.776C387.14 143.019 386.717 143.523 386.385 143.896C386.024 144.301 385.583 144.763 385.289 145.041C385.019 145.298 384.638 145.644 384.443 145.81C384.248 145.977 383.931 146.235 383.739 146.384C383.547 146.533 383.199 146.788 382.965 146.952C382.732 147.116 382.307 147.394 382.02 147.569C381.734 147.744 381.313 147.986 381.085 148.109C380.857 148.231 380.515 148.404 380.324 148.494C380.133 148.584 379.873 148.702 379.745 148.757C379.617 148.812 379.321 148.93 379.087 149.02C378.853 149.11 378.45 149.25 378.193 149.331C377.935 149.412 377.538 149.524 377.311 149.58C377.084 149.636 376.713 149.716 376.486 149.759C376.259 149.803 375.857 149.867 375.594 149.903C375.331 149.938 374.821 149.978 374.461 149.99C374.101 150.003 373.618 150.003 373.389 149.991C373.159 149.978 372.823 149.952 372.641 149.931C372.459 149.911 372.15 149.866 371.955 149.831C371.76 149.797 371.405 149.719 371.166 149.66C370.927 149.6 370.534 149.48 370.294 149.394C370.054 149.307 369.718 149.173 369.549 149.097C369.34 149.003 369.189 149.11 369.083 148.812C369.046 148.778 369.01 148.737 368.977 148.696C371.63 147.34 373.572 146.201 375.178 144.626C377.374 142.474 378.878 139.585 381.011 134.559C383.321 129.117 386.374 126.684 388.495 125.712C388.578 125.765 388.69 125.847 388.747 125.897C388.806 125.949 388.932 126.096 389.028 126.223C389.124 126.35 389.291 126.593 389.401 126.763C389.769 127.386 389.863 127.559 390.107 128.069C390.198 128.272 390.348 128.663 390.44 128.939C390.531 129.214 390.645 129.608 390.694 129.815C390.742 130.022 390.81 130.349 390.844 130.542C390.878 130.735 390.927 131.082 390.953 131.313C390.979 131.543 391.006 132.008 391.014 132.346C391.021 132.684 391.017 133.137 391.005 133.354C390.993 133.57 390.965 133.916 390.943 134.123C390.921 134.33 390.866 134.718 390.822 134.984C390.777 135.251 390.7 135.649 390.649 135.87C390.598 136.09 390.482 136.52 390.392 136.824C390.302 137.129 390.164 137.558 390.085 137.778C390.005 137.999 389.854 138.384 389.749 138.634Z"
                fill="#007AFF"
              />
            </svg>
          </div>
          <span className="logo-text-coffee">COFFEE</span>
          <p className="portal-brand-subtitle">{t('portal.subtitle', 'Enterprise Management & Kiosk Operations Hub')}</p>
        </div>

        <form className="portal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('portal.emailLabel', 'Work Email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="portal-input"
              placeholder="operator@coffeesystem.com"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t('portal.passwordLabel', 'Password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="portal-input"
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="portal-login-btn" disabled={loading}>
            {loading ? (
              <span className="btn-spinner"></span>
            ) : (
              <>
                {t('portal.loginBtn', 'Access Dashboard')}
                <span className="btn-arrow">➔</span>
              </>
            )}
          </button>
        </form>

        <p className="portal-disclaimer">
          {t('portal.disclaimerText', 'This is a private internal tool. Unauthorised access is prohibited.')}
        </p>

        <div className="portal-partner-branding">
          <span className="partner-circle"></span>
          <span className="partner-text">{t('portal.partnerText', 'VasifyTech PVT LTD • WhatsApp Business Partner')}</span>
        </div>

        {/* Collapsible Login Credentials Drawer */}
        <div className="login-credentials-drawer">
          <button
            type="button"
            className={`credentials-toggle-btn ${showCredentials ? 'active' : ''}`}
            onClick={() => setShowCredentials(!showCredentials)}
          >
            {showCredentials 
              ? t('portal.hideCredentials', 'HIDE LOGIN CREDENTIALS ▲') 
              : t('portal.showCredentials', 'SHOW LOGIN CREDENTIALS ▼')}
          </button>
          
          <div className={`credentials-table-wrapper ${showCredentials ? 'expanded' : ''}`}>
            <div className="credentials-table-container">
              <table className="credentials-table">
                <thead>
                  <tr>
                    <th>{t('portal.colEmail', 'Email')}</th>
                    <th>{t('portal.colPass', 'Pass')}</th>
                    <th>{t('portal.colRole', 'Role')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr onClick={() => handleAutofill('admin@example.com', '12345', 'Admin')}>
                    <td><code>admin@example.com</code></td>
                    <td><code>12345</code></td>
                    <td><span className="role-tag tag-admin">Admin</span></td>
                  </tr>
                  <tr onClick={() => handleAutofill('bianchi@gmail.com', '12345', 'Barista')}>
                    <td><code>bianchi@gmail.com</code></td>
                    <td><code>12345</code></td>
                    <td><span className="role-tag tag-barista">Barista</span></td>
                  </tr>
                  <tr onClick={() => handleAutofill('counter@gmail.com', '12345', 'Kiosk')}>
                    <td><code>counter@gmail.com</code></td>
                    <td><code>12345</code></td>
                    <td><span className="role-tag tag-kiosk">Kiosk</span></td>
                  </tr>
                </tbody>
              </table>
              <p className="autofill-hint">
                {t('portal.autofillHint', '* Click any row to automatically fill credentials.')}
              </p>
            </div>
          </div>
        </div>

        {/* Secondary Navigation Link to Kiosk Website */}
        <div className="d2c-shortcut-container">
          <a
            href="https://coffee-ordering-kiosk.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="back-btn-d2c"
          >
            Access Coffee Ordering Kiosk (coffee-ordering-kiosk.vercel.app)
            <span className="d2c-arrow">↗</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Portal;

