document.addEventListener('DOMContentLoaded', () => {
    const statusEl = document.getElementById('status');
    const loginBtn = document.getElementById('login-btn-test');
    const userInfoEl = document.getElementById('user-info');

    try {
        // --- KONFIGURASI FIREBASE ANDA ---
        const firebaseConfig = {
            apiKey: "AIzaSyAFNMqqfIoYJk9uV63MRBRBxCgzT3DI-g",
            authDomain: "cakra-brankas-pribadi.firebaseapp.com",
            projectId: "cakra-brankas-pribadi",
            storageBucket: "cakra-brankas-pribadi.appspot.com",
            messagingSenderId: "973097679765",
            appId: "1:973097679765:web:d242994d12560b4fdfd49c",
            measurementId: "G-99MFT3FNBQ"
        };

        // --- INITIALIZE FIREBASE ---
        firebase.initializeApp(firebaseConfig);
        const auth = firebase.auth();
        const googleProvider = new firebase.auth.GoogleAuthProvider();
        
        statusEl.textContent = 'Firebase Siap. Silakan Login.';
        statusEl.style.color = 'green';

        // --- LOGIN BUTTON LISTENER ---
        loginBtn.addEventListener('click', () => {
            statusEl.textContent = 'Mencoba redirect ke Google...';
            auth.signInWithRedirect(googleProvider)
                .catch(error => {
                    statusEl.textContent = `Error: ${error.message}`;
                    statusEl.style.color = 'red';
                });
        });

        // --- CHECK LOGIN STATE AFTER REDIRECT ---
        auth.onAuthStateChanged(user => {
            if (user) {
                // User is signed in.
                statusEl.textContent = 'Login Berhasil!';
                loginBtn.style.display = 'none';
                userInfoEl.textContent = `Selamat datang, ${user.displayName} (${user.email})`;
            } else {
                // User is signed out.
                console.log('User is signed out.');
            }
        });

    } catch (error) {
        statusEl.textContent = `Error Kritis: ${error.message}`;
        statusEl.style.color = 'red';
        console.error("Critical Error: ", error);
    }
});
