/* Introduction-only, progressive enhancement for the existing Governance as Code workbench.
 * The lab is a hypothetical teaching example; it never changes or invents recorded case data.
 * The six-step guided tour annotates (but never replaces) the existing overview cards.
 */
(function () {
  'use strict';

  const steps = [
    {
      title: 'Ask for documents',
      purpose: 'Start with a request for the invoice and the agreed supporting reports. Follow up if a submission is incomplete.',
      safeguard: 'Collection and reminders are part of the reference workflow, but this public site does not send real supplier emails.',
      destination: 'Document collection',
      view: 'submissions'
    },
    {
      title: 'Receive the invoice',
      purpose: 'Check that the required fields and supporting materials exist before relying on the submitted information.',
      safeguard: 'The reference runner validates typed input. Invalid fields cannot be treated as verified evidence.',
      destination: 'Recorded cases',
      view: 'cases'
    },
    {
      title: 'Check the facts',
      purpose: 'Reconcile quantities, totals, rates, purchase-order details and contractual limits using repeatable rules.',
      safeguard: 'Deterministic checks can flag inconsistent arithmetic or unsupported rates without asking a language model to guess.',
      destination: 'Governance controls',
      view: 'governance'
    },
    {
      title: 'Review unusual cases',
      purpose: 'Use differing scripted review perspectives to question exceptions and surface possible issues.',
      safeguard: 'These are AI-style stand-ins, not live model calls. Verification limits unsupported findings before human review.',
      destination: 'AI roles & controls',
      view: 'personas'
    },
    {
      title: 'A person decides',
      purpose: 'Present the facts and open questions to an authorised person who can approve, reject or request corrections.',
      safeguard: 'A reviewer gate keeps final authority with a person. No real payment is initiated by this demonstration.',
      destination: 'Recorded cases',
      view: 'cases'
    },
    {
      title: 'Keep the record',
      purpose: 'Preserve the order of checks, observations, evidence pointers and the recorded disposition for inspection.',
      safeguard: 'Published synthetic event traces are inspectable here; they are not evidence of live ERP or durable archive integration.',
      destination: 'Evidence & learning',
      view: 'evidence'
    }
  ];

  function buildTour(section) {
    const grid = section.querySelector('.journey-grid');
    if (!grid) return;
    const cards = Array.from(grid.querySelectorAll('.journey-step'));
    if (cards.length !== 6) return;
    cards.forEach(function (card, index) {
      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'intro-step-trigger';
      trigger.dataset.introStep = String(index);
      trigger.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');
      trigger.setAttribute('aria-label', 'Inspect stage ' + (index + 1) + ': ' + steps[index].title);
      trigger.textContent = 'Inspect this stage →';
      card.appendChild(trigger);
    });
    const guide = document.createElement('div');
    guide.className = 'intro-tour';
    guide.id = 'intro-guided-tour';
    guide.setAttribute('aria-label', 'Guided six-stage workflow');
    guide.innerHTML =
      '<div class="intro-tour-top"><span class="intro-panel-kicker">INTERACTIVE WALKTHROUGH</span><span class="intro-tour-position" data-intro-position></span></div>' +
      '<div class="intro-tour-progress" role="progressbar" aria-label="Selected workflow stage" aria-valuemin="1" aria-valuemax="6" aria-valuenow="1"><span data-intro-progress></span></div>' +
      '<div class="intro-tour-content"><div class="intro-tour-heading"><span class="intro-tour-number" data-intro-number>01</span>' +
      '<div><span class="intro-tour-label">SELECTED WORKFLOW STAGE</span><h3 data-intro-title></h3></div></div>' +
      '<div class="intro-tour-points"><div><span class="intro-tour-label">WHAT HAPPENS</span><p data-intro-purpose></p></div>' +
      '<div><span class="intro-tour-label">WHAT KEEPS IT GOVERNED</span><p data-intro-safeguard></p></div></div></div>' +
      '<div class="intro-tour-actions"><div class="intro-tour-navigation">' +
        '<button type="button" data-intro-prev>← Previous</button><button type="button" data-intro-next>Next stage →</button>' +
      '</div><a data-intro-destination href="?view=architecture" data-view="architecture">Inspect the evidence ↗</a></div>';
    grid.insertAdjacentElement('afterend', guide);

    let selected = 0;
    function select(index, moveFocus) {
      selected = Math.min(steps.length - 1, Math.max(0, index));
      const item = steps[selected];
      cards.forEach(function (card, number) {
        const active = number === selected;
        card.classList.toggle('intro-step-active', active);
        card.querySelector('[data-intro-step]').setAttribute('aria-pressed', String(active));
      });
      guide.querySelector('[data-intro-position]').textContent = 'Stage ' + (selected + 1) + ' / 6';
      guide.querySelector('[data-intro-number]').textContent = String(selected + 1).padStart(2, '0');
      guide.querySelector('[data-intro-title]').textContent = item.title;
      guide.querySelector('[data-intro-purpose]').textContent = item.purpose;
      guide.querySelector('[data-intro-safeguard]').textContent = item.safeguard;
      guide.querySelector('[data-intro-progress]').style.width = ((selected + 1) / steps.length * 100) + '%';
      guide.querySelector('[role="progressbar"]').setAttribute('aria-valuenow', String(selected + 1));
      const dest = guide.querySelector('[data-intro-destination]');
      dest.dataset.view = item.view;
      dest.href = '?view=' + encodeURIComponent(item.view);
      dest.textContent = 'Open ' + item.destination + ' ↗';
      const prev = guide.querySelector('[data-intro-prev]');
      const next = guide.querySelector('[data-intro-next]');
      prev.disabled = selected === 0;
      next.disabled = selected === steps.length - 1;
      if (moveFocus && moveFocus.isConnected && !moveFocus.disabled) moveFocus.focus();
    }
    section.addEventListener('click', function (event) {
      const stepButton = event.target.closest('[data-intro-step]');
      if (stepButton) {
        select(Number(stepButton.dataset.introStep), stepButton);
        return;
      }
      if (event.target.closest('[data-intro-prev]')) {
        select(selected - 1, guide.querySelector('[data-intro-prev]'));
      }
      if (event.target.closest('[data-intro-next]')) {
        select(selected + 1, guide.querySelector('[data-intro-next]'));
      }
    });
    select(0, null);
  }

  function enhanceIntroduction() {
    const overview = document.querySelector('#main .overview-page');
    if (!overview || overview.dataset.introEnhanced === 'true') return;
    const journey = overview.querySelector('.journey-section');
    if (!journey) return;
    overview.dataset.introEnhanced = 'true';
    buildTour(journey);
  }

  const main = document.getElementById('main');
  if (!main) return;
  const observer = new MutationObserver(enhanceIntroduction);
  observer.observe(main, { childList: true });
  enhanceIntroduction();
})();
