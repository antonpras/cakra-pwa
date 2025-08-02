document.addEventListener('DOMContentLoaded', () => {
    const statusEl = document.getElementById('status');
    const loginBtn = document.getElementById('login-btn-test');
    const userInfoEl = document.getElementById('user-info');

    // Blok try...catch ini untuk menangkap error kritis jika ada,
    // misalnya jika script Firebase gagal dimuat.
    try {
        // ===================================================================
        // == INI ADALAH SATU-SATUNYA BAGIAN YANG BISA MENYEBABKAN ERROR    ==
        // == 'API KEY NOT VALID'.                                          ==
        // ==                                                               ==
        // == Pastikan Anda menyalin ini dari proyek Firebase yang BARU     ==
        // == dan SEHAT, yang telah mengikuti semua langkah setup.          ==
        // ===================================================================
        const firebaseConfig = {
            apiKey: "AIzaSyAfNMqqY1oYJK9uV63MRBRRBxCgzT3dI-g", // Ganti dengan API Key dari proyek BARU
            authDomain: "cakra-brankas-pribadi.firebaseapp.com", // Ganti dengan Auth Domain dari proyek BARU
            projectId: "cakra-brankas-pribadi", // Ganti dengan Project ID dari proyek BARU
            storageBucket: "cakra-brankas-pribadi.appspot.com", // Ganti dengan Storage Bucket dari proyek BARU
            messagingSenderId: "973097679765", // Ganti dengan Sender ID dari proyek BARU
            appId: "1:973097679765:web:d242994d12560b4fdfd49c" // Ganti dengan App ID dari proyek BARU
        };

        // Langkah ini menginisialisasi koneksi ke Firebase menggunakan config di atas.
        // Jika config salah, error akan muncul dari sini.
        firebase.initializeApp(firebaseConfig);
        const auth = firebase.auth();
        const googleProvider = new firebase.auth.GoogleAuthProvider();
        
        statusEl.textContent = 'Firebase Siap. Silakan Login.';
        statusEl.style.color = 'green';

        // Event listener ini sudah benar. Ia akan menunggu tombol ditekan,
        // lalu memanggil fungsi login dari Firebase.
        loginBtn.addEventListener('click', () => {
            statusEl.textContent = 'Mencoba redirect ke Google...';
            auth.signInWithRedirect(googleProvider)
                .catch(error => {
                    // Jika ada error setelah mencoba login, akan ditampilkan di sini.
                    statusEl.textContent = `Error: ${error.message}`;
                    statusEl.style.color = 'red';
                });
        });

        // Fungsi ini akan memeriksa status login setelah redirect kembali ke aplikasi.
        auth.onAuthStateChanged(user => {
            if (user) {
                statusEl.textContent = 'Login Berhasil!';
                loginBtn.style.display = 'none';
                userInfoEl.textContent = `Selamat datang, ${user.displayName} (${user.email})`;
            }
        });

    } catch (error) {
        statusEl.textContent = `Error Kritis: ${error.message}`;
        statusEl.style.color = 'red';
        console.error("Critical Error: ", error);
    }
});
