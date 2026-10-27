/* UI-string translations (English, Filipino, Cebuano). Lesson/organism content comes from the JSON database and is shown as written. */
(function (VE) {
  'use strict';
  var S = {
    en: {
      lesson: 'LESSON:', language: 'Language', sound: 'Sound', home: 'Home', start: 'START', learn: 'What we will learn', next: 'Next', back: 'Back',
      description: 'DESCRIPTION', clickBegin: 'Click a level of the pyramid to begin.', mostEnergy: 'Most energy', leastEnergy: 'Least energy',
      energy: 'Energy', dragOrganisms: 'DRAG THESE ORGANISMS', dragEnergy: 'DRAG THE ENERGY LEVELS', hint: 'Hint', reset: 'Reset', play: 'Play', pause: 'Pause',
      day: 'Day', speed: 'Speed', allProducers: 'All Producers', on: 'ON', off: 'OFF', foodPyramid: 'Food Pyramid', howMany: 'How many of each organism? (1–5)',
      populationByDay: 'Population of Organisms by Day', days: 'Days', numberOfOrganisms: 'Number of Organisms', allDone: "You're all done.", pleaseClick: 'Please click the button below.',
      correct: 'Correct!', tryAgain: 'Not quite. Try again!', placed: 'placed', allPlaced: 'All organisms are in the right level!', locked: 'Finish the previous step first.',
      explore: 'Explore', arrange: 'Arrange', ecosystem: 'Ecosystem', transfer: 'Transfer', ecosystemLabel: 'Ecosystem', noLessons: 'No lessons are available. Ask your teacher to enable one in the Admin Dashboard.',
      dataSource: 'Data', reconnect: 'Reconnect folder', loadFile: 'Load database file', admin: 'Admin', replay: 'Replay', stepOf: 'Step', continue: 'Continue',
      producers: 'Producer', herbivores: 'Herbivore', omnivores: 'Omnivore', top: 'Top Predator', completed: 'Completed', score: 'Mistakes', pickUp: 'Selected. Now choose a level.',
      simDone: 'Simulation finished', modelNote: 'A simplified teaching model, not a real-world prediction.', percentOfStart: '% of start', counts: 'Counts', toggleScale: 'Chart scale',
      dismiss: 'Close', showHint: 'Show hint', noOrganisms: 'No organisms yet.', eats: 'Eats', eatenBy: 'Eaten by', role: 'Role', organisms: 'Organisms', foodRelationships: 'Food relationships', nothing: 'nothing'
    },
    fil: {
      lesson: 'ARALIN:', language: 'Wika', sound: 'Tunog', home: 'Tahanan', start: 'SIMULAN', learn: 'Ano ang matututuhan natin', next: 'Susunod', back: 'Bumalik',
      description: 'PAGLALARAWAN', clickBegin: 'Pumili ng antas ng piramide para magsimula.', mostEnergy: 'Pinakamaraming enerhiya', leastEnergy: 'Pinakakaunting enerhiya',
      energy: 'Enerhiya', dragOrganisms: 'I-DRAG ANG MGA ORGANISMO', dragEnergy: 'I-DRAG ANG MGA ANTAS NG ENERHIYA', hint: 'Pahiwatig', reset: 'I-reset', play: 'Simulan', pause: 'Ihinto',
      day: 'Araw', speed: 'Bilis', allProducers: 'Lahat ng Producer', on: 'ON', off: 'OFF', foodPyramid: 'Piramide ng Pagkain', howMany: 'Ilan sa bawat organismo? (1–5)',
      populationByDay: 'Populasyon ng mga Organismo kada Araw', days: 'Araw', numberOfOrganisms: 'Bilang ng Organismo', allDone: 'Tapos ka na!', pleaseClick: 'Pindutin ang button sa ibaba.',
      correct: 'Tama!', tryAgain: 'Hindi pa tama. Subukan muli!', placed: 'nailagay', allPlaced: 'Nasa tamang antas ang lahat ng organismo!', locked: 'Tapusin muna ang nakaraang hakbang.',
      explore: 'Galugarin', arrange: 'Ayusin', ecosystem: 'Ekosistema', transfer: 'Paglipat', ecosystemLabel: 'Ekosistema', noLessons: 'Walang magagamit na aralin. Hilingin sa guro na i-enable ito sa Admin Dashboard.',
      dataSource: 'Datos', reconnect: 'Ikonekta muli ang folder', loadFile: 'Mag-load ng database file', admin: 'Admin', replay: 'Ulitin', stepOf: 'Hakbang', continue: 'Magpatuloy',
      producers: 'Producer', herbivores: 'Herbivore', omnivores: 'Omnivore', top: 'Top Predator', completed: 'Tapos', score: 'Mga mali', pickUp: 'Napili. Pumili na ng antas.',
      simDone: 'Tapos na ang simulation', modelNote: 'Pinasimpleng modelo para sa pag-aaral, hindi hula sa totoong mundo.', percentOfStart: '% ng simula', counts: 'Bilang', toggleScale: 'Sukat ng graph',
      dismiss: 'Isara', showHint: 'Ipakita ang pahiwatig', noOrganisms: 'Wala pang organismo.', eats: 'Kumakain ng', eatenBy: 'Kinakain ng', role: 'Papel', organisms: 'Mga organismo', foodRelationships: 'Ugnayan sa pagkain', nothing: 'wala'
    },
    ceb: {
      lesson: 'LEKSYON:', language: 'Pinulongan', sound: 'Tingog', home: 'Balay', start: 'SUGDI', learn: 'Unsay atong makat-onan', next: 'Sunod', back: 'Balik',
      description: 'PAGHULAGWAY', clickBegin: 'Pili ug lebel sa piramide aron magsugod.', mostEnergy: 'Pinakadaghang enerhiya', leastEnergy: 'Pinakagamayng enerhiya',
      energy: 'Enerhiya', dragOrganisms: 'I-DRAG ANG MGA ORGANISMO', dragEnergy: 'I-DRAG ANG MGA LEBEL SA ENERHIYA', hint: 'Pahibalo', reset: 'I-reset', play: 'Play', pause: 'Hunong',
      day: 'Adlaw', speed: 'Katulin', allProducers: 'Tanang Producer', on: 'ON', off: 'OFF', foodPyramid: 'Piramide sa Pagkaon', howMany: 'Pila kada organismo? (1–5)',
      populationByDay: 'Populasyon sa mga Organismo matag Adlaw', days: 'Adlaw', numberOfOrganisms: 'Gidaghanon sa Organismo', allDone: 'Human na ka!', pleaseClick: 'Pindota ang button sa ubos.',
      correct: 'Husto!', tryAgain: 'Dili pa husto. Sulayi pag-usab!', placed: 'nabutang', allPlaced: 'Naa na sa husto nga lebel ang tanang organismo!', locked: 'Humana una ang miaging lakang.',
      explore: 'Susiha', arrange: 'Ihan-ay', ecosystem: 'Ekosistema', transfer: 'Pagbalhin', ecosystemLabel: 'Ekosistema', noLessons: 'Walay magamit nga leksyon. Pangayoa ang magtutudlo nga i-enable kini sa Admin Dashboard.',
      dataSource: 'Datos', reconnect: 'Ikonekta pag-usab ang folder', loadFile: 'Pag-load og database file', admin: 'Admin', replay: 'Balika', stepOf: 'Lakang', continue: 'Padayon',
      producers: 'Producer', herbivores: 'Herbivore', omnivores: 'Omnivore', top: 'Top Predator', completed: 'Human', score: 'Mga sayop', pickUp: 'Napili na. Pili na og lebel.',
      simDone: 'Human na ang simulation', modelNote: 'Gipasimpleng modelo para sa pagtuon, dili tagna sa tinuod nga kalibutan.', percentOfStart: '% sa sinugdan', counts: 'Ihap', toggleScale: 'Sukod sa graph',
      dismiss: 'Isira', showHint: 'Ipakita ang pahibalo', noOrganisms: 'Wala pay organismo.', eats: 'Mokaon og', eatenBy: 'Gikaon sa', role: 'Papel', organisms: 'Mga organismo', foodRelationships: 'Relasyon sa pagkaon', nothing: 'wala'
    }
  };
  var LANGS = [{ id: 'en', label: 'English' }, { id: 'fil', label: 'Filipino' }, { id: 'ceb', label: 'Bisaya (Cebuano)' }];
  var cur = 'en';
  VE.I18n = {
    langs: LANGS,
    get lang() { return cur; },
    set: function (l) { if (S[l]) cur = l; document.documentElement.lang = cur === 'ceb' ? 'ceb' : cur === 'fil' ? 'fil' : 'en'; },
    t: function (k) { return (S[cur] && S[cur][k]) || S.en[k] || k; }
  };
})(window.VE = window.VE || {});
