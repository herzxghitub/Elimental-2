// mabar.js - Sistem Multiplayer untuk Game Elemental 3D

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAQobSSWqAnctUFiGjf4RNMWueo3SV_fMY",
    authDomain: "taher-my-id.firebaseapp.com",
    databaseURL: "https://taher-my-id-default-rtdb.firebaseio.com",
    projectId: "taher-my-id",
    storageBucket: "taher-my-id.appspot.com",
    messagingSenderId: "844154238987",
    appId: "1:844154238987:web:7f7bb48c3c4a89f9442f0e",
    measurementId: "G-MPK8W5SB88"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Variables untuk multiplayer
let playerId;
let playersRef;
let currentPlayerRef;
let otherPlayers = {};
let otherPlayerObjects = {};

// Generate unique player ID
function generatePlayerId() {
    return 'player_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// Initialize multiplayer system
function initMultiplayer() {
    playerId = generatePlayerId();
    playersRef = database.ref('players');
    currentPlayerRef = playersRef.child(playerId);
    
    console.log('Player ID:', playerId);
    
    // Simpan data pemain awal
    savePlayerData();
    
    // Update posisi pemain secara berkala
    setInterval(savePlayerData, 100);
    
    // Listen untuk perubahan data pemain lain
    playersRef.on('value', (snapshot) => {
        const players = snapshot.val();
        renderOtherPlayers(players);
    });
    
    // Hapus data pemain saat keluar
    window.addEventListener('beforeunload', () => {
        currentPlayerRef.remove();
    });
    
    // Handle disconnect
    currentPlayerRef.onDisconnect().remove();
}

// Simpan data pemain ke Firebase
function savePlayerData() {
    if (!player || !currentPlayerRef) return;
    
    const playerData = {
        name: "User_" + playerId.substr(7, 5), // Nama pendek untuk tampilan
        x: player.position.x,
        y: player.position.y,
        z: player.position.z,
        rotationY: player.rotation.y,
        element: currentSkill,
        timestamp: Date.now()
    };
    
    currentPlayerRef.set(playerData);
}

// Render pemain lain di layar
function renderOtherPlayers(players) {
    if (!players) return;
    
    // Hapus pemain yang sudah tidak aktif (lebih dari 10 detik)
    const currentTime = Date.now();
    Object.keys(otherPlayerObjects).forEach(playerKey => {
        if (!players[playerKey] || (currentTime - players[playerKey].timestamp) > 10000) {
            if (otherPlayerObjects[playerKey]) {
                scene.remove(otherPlayerObjects[playerKey]);
                delete otherPlayerObjects[playerKey];
                delete otherPlayers[playerKey];
            }
        }
    });
    
    // Tambah atau update pemain lain
    Object.keys(players).forEach(playerKey => {
        if (playerKey !== playerId) {
            const playerData = players[playerKey];
            
            if (!otherPlayerObjects[playerKey]) {
                // Buat karakter baru untuk pemain lain
                createOtherPlayer(playerKey, playerData);
            } else {
                // Update posisi dan rotasi pemain yang sudah ada
                updateOtherPlayer(playerKey, playerData);
            }
            
            otherPlayers[playerKey] = playerData;
        }
    });
}

// Buat karakter untuk pemain lain
function createOtherPlayer(playerKey, playerData) {
    const otherPlayer = new THREE.Group();
    
    // Kepala
    const headGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0x00FF00 }); // Hijau untuk pemain lain
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.7;
    otherPlayer.add(head);
    
    // Badan
    const bodyGeometry = new THREE.BoxGeometry(1, 1.2, 0.5);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x00AA00 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.8;
    otherPlayer.add(body);
    
    // Tangan
    const armGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 8);
    const armMaterial = new THREE.MeshStandardMaterial({ color: 0x00AA00 });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(0.6, 0.7, 0);
    leftArm.rotation.z = Math.PI / 6;
    otherPlayer.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(-0.6, 0.7, 0);
    rightArm.rotation.z = -Math.PI / 6;
    otherPlayer.add(rightArm);
    
    // Kaki
    const legGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.2, 8);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x008800 });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(0.25, -0.8, 0);
    otherPlayer.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(-0.25, -0.8, 0);
    otherPlayer.add(rightLeg);
    
    // Nama pemain
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 128;
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = '24px Arial';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.fillText(playerData.name, canvas.width/2, canvas.height/2 + 8);
    
    const nameTexture = new THREE.CanvasTexture(canvas);
    const nameMaterial = new THREE.SpriteMaterial({ map: nameTexture });
    const nameSprite = new THREE.Sprite(nameMaterial);
    nameSprite.position.y = 3;
    nameSprite.scale.set(3, 1.5, 1);
    otherPlayer.add(nameSprite);
    
    // Set posisi awal
    otherPlayer.position.set(playerData.x, playerData.y, playerData.z);
    otherPlayer.rotation.y = playerData.rotationY || 0;
    
    // Tambah ke scene
    scene.add(otherPlayer);
    otherPlayerObjects[playerKey] = otherPlayer;
    
    console.log('Pemain baru bergabung:', playerData.name);
}

// Update posisi dan rotasi pemain lain
function updateOtherPlayer(playerKey, playerData) {
    const otherPlayer = otherPlayerObjects[playerKey];
    if (otherPlayer) {
        // Smooth movement
        otherPlayer.position.lerp(
            new THREE.Vector3(playerData.x, playerData.y, playerData.z), 
            0.5
        );
        otherPlayer.rotation.y = playerData.rotationY || 0;
        
        // Update warna berdasarkan elemen
        updateOtherPlayerElement(otherPlayer, playerData.element);
    }
}

// Update tampilan pemain lain berdasarkan elemen
function updateOtherPlayerElement(otherPlayer, element) {
    // Default warna hijau
    let bodyColor = 0x00AA00;
    let headColor = 0x00FF00;
    let armColor = 0x00AA00;
    let legColor = 0x008800;
    
    switch(element) {
        case 'root':
            bodyColor = 0x00AA00;
            headColor = 0x00FF00;
            armColor = 0x00AA00;
            legColor = 0x006600;
            break;
        case 'solar':
            bodyColor = 0xFFFFFF;
            headColor = 0xFFFF00;
            armColor = 0xFFFFFF;
            legColor = 0xFFFFFF;
            break;
        case 'wave':
            bodyColor = 0x00BFFF;
            headColor = 0x00FFFF;
            armColor = 0x00BFFF;
            legColor = 0x0000FF;
            break;
        case 'tornado':
            bodyColor = 0x000080;
            headColor = 0x4169E1;
            armColor = 0x000080;
            legColor = 0x000080;
            break;
        case 'blaze':
            bodyColor = 0xFF4500;
            headColor = 0xFF0000;
            armColor = 0xFF4500;
            legColor = 0xFF4500;
            break;
        case 'earthquake':
            bodyColor = 0x8B4513;
            headColor = 0xA0522D;
            armColor = 0x8B4513;
            legColor = 0x8B4513;
            break;
        case 'thunder':
            bodyColor = 0xFF0000;
            headColor = 0xFF4500;
            armColor = 0xFF0000;
            legColor = 0xFF0000;
            break;
    }
    
    // Terapkan warna
    if (otherPlayer.children[0]) otherPlayer.children[0].material.color.setHex(headColor); // Kepala
    if (otherPlayer.children[1]) otherPlayer.children[1].material.color.setHex(bodyColor); // Badan
    if (otherPlayer.children[2]) otherPlayer.children[2].material.color.setHex(armColor);  // Tangan kiri
    if (otherPlayer.children[3]) otherPlayer.children[3].material.color.setHex(armColor);  // Tangan kanan
    if (otherPlayer.children[4]) otherPlayer.children[4].material.color.setHex(legColor);  // Kaki kiri
    if (otherPlayer.children[5]) otherPlayer.children[5].material.color.setHex(legColor);  // Kaki kanan
}

// Hapus semua pemain lain (saat reset game)
function clearOtherPlayers() {
    Object.keys(otherPlayerObjects).forEach(playerKey => {
        scene.remove(otherPlayerObjects[playerKey]);
    });
    otherPlayerObjects = {};
    otherPlayers = {};
}

// Fungsi untuk mendapatkan jumlah pemain online
function getOnlinePlayersCount() {
    return Object.keys(otherPlayers).length;
}

// Tambah UI untuk info multiplayer
function addMultiplayerUI() {
    const multiplayerInfo = document.createElement('div');
    multiplayerInfo.id = 'multiplayer-info';
    multiplayerInfo.style.position = 'absolute';
    multiplayerInfo.style.top = '100px';
    multiplayerInfo.style.right = '20px';
    multiplayerInfo.style.color = 'white';
    multiplayerInfo.style.fontSize = '16px';
    multiplayerInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    multiplayerInfo.style.padding = '5px 10px';
    multiplayerInfo.style.borderRadius = '5px';
    multiplayerInfo.style.zIndex = '100';
    multiplayerInfo.innerHTML = 'Pemain Online: <span id="player-count">1</span>';
    
    document.body.appendChild(multiplayerInfo);
    
    // Update jumlah pemain secara berkala
    setInterval(() => {
        const count = getOnlinePlayersCount() + 1; // +1 untuk pemain sendiri
        document.getElementById('player-count').textContent = count;
    }, 2000);
}