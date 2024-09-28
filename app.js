// Sélectionner le logo, le canvas et les textes
const logo = document.getElementById('logo');
const canvas = document.getElementById('audioCanvas');
const textAbsinthe = document.getElementById('animatedText');
const textTime = document.getElementById('animatedTextBottom');
const ctx = canvas.getContext('2d');

// Définir la taille du canvas
canvas.width = 300;
canvas.height = 300;

// Créer un contexte audio
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioContext.createAnalyser();
analyser.fftSize = 2048; // Taille de la fenêtre FFT
const frequencyData = new Uint8Array(analyser.frequencyBinCount);

// Accéder au microphone virtuel (VB-Audio Virtual Cable)
navigator.mediaDevices.getUserMedia({ audio: { deviceId: '7db0f4fbb810dab50c56844353cf12b2e7548b7c7bc2a121d9f8d398826face5' } })
  .then(stream => {
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    updateLogoAndBars(); // Démarrer l'animation
  })
  .catch(error => {
    console.error('Erreur d\'accès au microphone virtuel:', error);
  });

// Fonction pour animer le logo, les textes et dessiner les barres de son
function updateLogoAndBars() {
  requestAnimationFrame(updateLogoAndBars);

  analyser.getByteFrequencyData(frequencyData);

  const bassFrequencyRange = frequencyData.slice(0, 20);
  let bassAmplitude = 0;
  bassFrequencyRange.forEach(f => bassAmplitude += f);
  bassAmplitude /= bassFrequencyRange.length;

  // Ajuster la taille et la rotation du logo en fonction des basses
  const scale = 1 + bassAmplitude / 255;
  const currentScale = parseFloat(logo.style.transform.replace('scale(', '').replace(')', '')) || 1;
  const newScale = currentScale + (scale - currentScale) * 0.1;
  logo.style.transform = `scale(${newScale}) rotate(${bassAmplitude * 0.1}deg)`;

  // Changer la couleur du logo et des textes en fonction des basses
  const colorValue = Math.floor(bassAmplitude);
  const newColor = `rgb(${colorValue}, ${255 - colorValue}, ${colorValue / 2})`;
  logo.style.backgroundColor = newColor;

  // Texte ABSINTHE – Ajuster la taille du texte en fonction de l'amplitude des basses
  const textScaleAbsinthe = 1 + bassAmplitude / 300;
  textAbsinthe.style.transform = `scale(${textScaleAbsinthe})`;
  textAbsinthe.style.color = newColor; // Modifier la couleur du texte pour correspondre

  // Ajouter un effet de lumière avec text-shadow en fonction des basses pour ABSINTHE
  textAbsinthe.style.textShadow = `0 0 ${bassAmplitude / 10}px rgba(255, 255, 255, 0.8)`;

  // Texte TIME – Appliquer les mêmes transformations que pour ABSINTHE
  const textScaleTime = 1 + bassAmplitude / 300;
  textTime.style.transform = `scale(${textScaleTime})`;
  textTime.style.color = newColor; // Modifier la couleur du texte pour correspondre

  // Ajouter un effet de lumière avec text-shadow en fonction des basses pour TIME
  textTime.style.textShadow = `0 0 ${bassAmplitude / 10}px rgba(255, 255, 255, 0.8)`;

  // Dessiner les barres de son avec différentes fréquences pour chaque partie du cercle
  drawSoundBars(frequencyData);
}

function drawSoundBars(frequencyData) {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Effacer le canvas

  const numberOfBars = 96; // Nombre de barres
  const radius = 15; // Rayon de la base des barres
  const outerRadius = radius + 60; // Ajuster pour que les barres soient visibles

  // Utiliser la couleur de fond du logo pour les barres
  const logoColor = getComputedStyle(logo).backgroundColor;

  // Convertir la couleur du logo en valeurs RGB
  const rgbValues = logoColor.match(/\d+/g); // Récupérer les valeurs RGB
  const r = rgbValues[0];
  const g = rgbValues[1];
  const b = rgbValues[2];

  // Déterminer combien de fréquences assigner à chaque barre
  const frequenciesPerBar = Math.floor(frequencyData.length / numberOfBars);

  for (let i = 0; i < numberOfBars; i++) {
    const angle = (i / numberOfBars) * Math.PI * 2; // Calculer l'angle

    // Calculer la moyenne des fréquences assignées à cette barre
    const startFreqIndex = i * frequenciesPerBar;
    const endFreqIndex = startFreqIndex + frequenciesPerBar;
    const barFrequencies = frequencyData.slice(startFreqIndex, endFreqIndex);

    let amplitude = 0;
    barFrequencies.forEach(f => amplitude += f);
    amplitude /= barFrequencies.length; // Amplitude moyenne pour cette barre

    const height = (amplitude / 255) * 80; // Hauteur de la barre (ajustée)

    // Déterminer les coordonnées de la base de la barre (sur le cercle)
    const x = 150 + Math.cos(angle) * radius; // Coordonnée x de la base
    const y = 150 + Math.sin(angle) * radius; // Coordonnée y de la base

    // Déterminer les coordonnées de l'extrémité de la barre
    const endX = 150 + Math.cos(angle) * (outerRadius + height); // Coordonnée x de l'extrémité
    const endY = 150 + Math.sin(angle) * (outerRadius + height); // Coordonnée y de l'extrémité

    // Dessiner la barre avec un dégradé basé sur la couleur du logo
    const gradient = ctx.createLinearGradient(x, y, endX, endY);
    const alphaValue = amplitude / 255; // Intensité alpha pour le dégradé
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alphaValue})`); // Couleur avec opacité
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${alphaValue * 0.5})`); // Dégradé vers une teinte plus transparente

    ctx.strokeStyle = gradient; // Utiliser le dégradé
    ctx.lineWidth = 5 + Math.sin(i + Date.now() * 0.002) * 2; // Variation de la largeur de la barre
    ctx.beginPath(); // Commencer un nouveau chemin
    ctx.moveTo(x, y); // Définir le point de départ
    ctx.lineTo(endX, endY); // Tracer la ligne vers l'extérieur
    ctx.stroke(); // Dessiner la barre

    // Dessiner le cercle au sommet de la barre
    const circleRadius = 1 + (amplitude / 255) * 10; // Taille du cercle en fonction de l'amplitude
    const circleGradient = ctx.createRadialGradient(endX, endY, circleRadius / 2, endX, endY, circleRadius);
    circleGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`); // Couleur du centre
    circleGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.5)`); // Couleur à l'extérieur

    ctx.fillStyle = circleGradient; // Utiliser le dégradé pour le cercle
    ctx.beginPath(); // Commencer un nouveau chemin
    ctx.arc(endX, endY, circleRadius, 0, Math.PI * 2); // Créer le cercle
    ctx.fill(); // Remplir le cercle

    // Ombre portée pour le cercle
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
  }
}

// Attendre que l'utilisateur interagisse avec la page pour commencer le contexte audio
document.body.addEventListener('click', function () {
  audioContext.resume().then(() => {
    console.log('Le contexte audio a été redémarré');
  });
});
