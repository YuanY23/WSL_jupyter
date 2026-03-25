// CSS-only JupyterLab labextension — injects custom logo CSS
(function () {
  var style = document.createElement('style');
  style.textContent = [
    /* Hide the default JupyterLab SVG logo */
    '#jp-MainLogo svg { display: none !important; }',
    /* Replace with a yellow "Y" text logo */
    '#jp-MainLogo::before {',
    '  content: "Y";',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  width: 28px;',
    '  height: 28px;',
    '  background: linear-gradient(135deg, #f59e0b, #fbbf24);',
    '  border-radius: 7px;',
    '  font-size: 18px;',
    '  font-weight: 800;',
    '  color: #1a1a2e;',
    '  font-family: "Inter", "PingFang SC", sans-serif;',
    '  letter-spacing: -0.03em;',
    '  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);',
    '  margin: auto 4px;',
    '  cursor: pointer;',
    '  flex-shrink: 0;',
    '}',
    /* Make the logo container behave correctly */
    '#jp-MainLogo { display: flex !important; align-items: center !important; }',
    /* Button inside jp-MainLogo: keep the click area but hide default styling */
    '#jp-MainLogo button { background: transparent !important; border: none !important; padding: 0 !important; }'
  ].join('\n');
  document.head.appendChild(style);
})();
