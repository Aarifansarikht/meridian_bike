import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectConfigurationId, selectConfigurationSummary, selectShareUrl } from '../../store/selectors.js';
import { summaryToText } from '../../utils/formatConfiguration.js';
import {
  canNativeShare,
  copyToClipboard,
  shareNative,
  shareViaEmail,
  shareViaWhatsApp,
} from '../../utils/shareConfiguration.js';
import Icon from '../common/Icon.jsx';

export default function ShareConfiguration() {
  const summary = useSelector(selectConfigurationSummary);
  const configId = useSelector(selectConfigurationId);
  const url = useSelector(selectShareUrl);
  const [status, setStatus] = useState('');
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const text = useMemo(
    () => (summary ? summaryToText(summary, { configurationId: configId, url }) : ''),
    [summary, configId, url],
  );
  if (!summary) return null;

  const flash = (msg) => {
    setStatus(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus(''), 2400);
  };

  const actions = [
    { id: 'whatsapp', icon: 'whatsapp', label: 'WhatsApp', run: () => shareViaWhatsApp(text) },
    {
      id: 'email',
      icon: 'mail',
      label: 'Email',
      run: () => shareViaEmail({ subject: `My ${summary.bike.name} configuration (${configId})`, body: text }),
    },
    {
      id: 'copy',
      icon: 'copy',
      label: 'Copy summary',
      run: async () => flash((await copyToClipboard(text)) ? 'Configuration copied to clipboard' : 'Copy failed'),
    },
    {
      id: 'link',
      icon: 'link',
      label: 'Copy link',
      run: async () => flash((await copyToClipboard(url)) ? 'Share link copied' : 'Copy failed'),
    },
  ];
  if (canNativeShare()) {
    actions.push({
      id: 'native',
      icon: 'share',
      label: 'More…',
      run: () => shareNative({ title: `${summary.bike.name} — ${configId}`, text, url }),
    });
  }

  return (
    <section className="share" aria-labelledby="share-title">
      <h3 id="share-title" className="share__title">
        Share this build
      </h3>
      <div className="share__grid">
        {actions.map((a) => (
          <button key={a.id} type="button" className={`share__btn share__btn--${a.id}`} onClick={a.run}>
            <Icon name={a.icon} size={18} />
            <span>{a.label}</span>
          </button>
        ))}
      </div>
      <p className="share__status" role="status" aria-live="polite">
        {status && (
          <>
            <Icon name="check" size={14} /> {status}
          </>
        )}
      </p>
    </section>
  );
}
