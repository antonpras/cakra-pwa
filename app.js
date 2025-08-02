document.addEventListener('DOMContentLoaded', () => {
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
    const db = firebase.firestore();
    const googleProvider = new firebase.auth.GoogleAuthProvider();

    // --- ELEMENT SELECTORS ---
    const loginScreen = document.getElementById('login-screen');
    const keyScreen = document.getElementById('key-screen');
    const appContainer = document.getElementById('app-container');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userPhoto = document.getElementById('user-photo');
    const userName = document.getElementById('user-name');
    const keyForm = document.getElementById('key-form');
    const keyTitle = document.getElementById('key-title');
    const keySubtitle = document.getElementById('key-subtitle');
    const keyInput = document.getElementById('key-input');
    const keyConfirmInput = document.getElementById('key-confirm-input');
    const keySubmitBtn = document.getElementById('key-submit-btn');
    const keyErrorMessage = document.getElementById('key-error-message');
    const notesContainer = document.getElementById('notes-container');
    const addNoteButton = document.getElementById('add-note-btn');
    const modalOverlay = document.getElementById('modal-overlay');
    const noteForm = document.getElementById('note-form');
    const modalTitle = document.getElementById('modal-title');
    const cancelBtn = document.getElementById('cancel-btn');
    const noteTypeSelect = document.getElementById('note-type');
    const noteTitleInput = document.getElementById('note-title');
    const noteTagsInput = document.getElementById('note-tags');
    const noteContentInput = document.getElementById('note-content');
    const contentLabel = document.getElementById('content-label');
    const loginFields = document.getElementById('login-fields');
    const noteWebsiteInput = document.getElementById('note-website');
    const noteUsernameInput = document.getElementById('note-username');
    const filterContainer = document.getElementById('filter-container');

    // --- STATE MANAGEMENT ---
    let sessionEncryptionKey = null;
    let state = {
        currentUser: null,
        entries: [],
        unsubscribe: null,
        editingEntryId: null,
        activeTOTPTimers: {},
        activeFilter: null
    };

    // --- SVG ICONS ---
    const ICONS = {
        copy: `<svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`,
        edit: `<svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`,
        delete: `<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`,
        pin: `<svg viewBox="0 0 24 24"><path d="M16 9V4h-2v5l-2 2v2h6v-2l-2-2zM12 2C8.69 2 6 4.69 6 8c0 1.66.79 3.16 2.08 4.08L6 14v2h12v-2l-2.08-1.92C17.21 11.16 18 9.66 18 8c0-3.31-2.69-6-6-6z"/></svg>`,
        peek: `<svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 12c-2.48 0-4.5-2.02-4.5-4.5S9.52 7.5 12 7.5s4.5 2.02 4.5 4.5-2.02 4.5-4.5 4.5zm0-7c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5z"/></svg>`
    };

    // --- ENCRYPTION/DECRYPTION ---
    function encrypt(data, key) {
        return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
    }
    function decrypt(encryptedData, key) {
        try {
            const bytes = CryptoJS.AES.decrypt(encryptedData, key);
            const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
            if (!decryptedString) return null;
            return JSON.parse(decryptedString);
        } catch { return null; }
    }

    // --- AUTHENTICATION & KEY MANAGEMENT ---
    auth.onAuthStateChanged(user => {
        if (user) {
            state.currentUser = user;
            loginScreen.classList.add('hidden');
            keyScreen.classList.remove('hidden');
            checkEncryptionKeySetup(user);
        } else {
            state.currentUser = null;
            if (state.unsubscribe) state.unsubscribe();
            sessionEncryptionKey = null;
            loginScreen.classList.remove('hidden');
            keyScreen.classList.add('hidden');
            appContainer.classList.add('hidden');
            state.entries = [];
            renderApp();
        }
    });

    function checkEncryptionKeySetup(user) {
        const keyHashRef = db.collection('users').doc(user.uid);
        keyHashRef.get().then(doc => {
            if (!doc.exists || !doc.data().keyHash) {
                keyTitle.textContent = 'Buat Kunci Enkripsi';
                keySubtitle.textContent = 'Kunci ini tidak bisa dipulihkan. Jika lupa, data Anda tidak bisa dibuka.';
                keyConfirmInput.classList.remove('hidden');
                keySubmitBtn.textContent = 'Simpan Kunci';
            } else {
                keyTitle.textContent = 'Buka Brankas';
                keySubtitle.textContent = `Selamat datang, ${user.displayName.split(' ')[0]}. Masukkan Kunci Enkripsi Anda.`;
                keyConfirmInput.classList.add('hidden');
                keySubmitBtn.textContent = 'Buka';
            }
        });
    }

    keyForm.addEventListener('submit', e => {
        e.preventDefault();
        const user = auth.currentUser;
        const key = keyInput.value;
        const keyHashRef = db.collection('users').doc(user.uid);
        keyErrorMessage.classList.add('hidden');

        keyHashRef.get().then(doc => {
            if (!doc.exists || !doc.data().keyHash) {
                const confirmKey = keyConfirmInput.value;
                if (key !== confirmKey) return showKeyError('Kunci tidak cocok.');
                if (key.length < 6) return showKeyError('Kunci minimal 6 karakter.');
                
                const keyHash = CryptoJS.SHA256(key).toString();
                keyHashRef.set({ keyHash }).then(() => unlockApp(key));
            } else {
                const storedHash = doc.data().keyHash;
                const inputHash = CryptoJS.SHA256(key).toString();
                if (inputHash === storedHash) {
                    unlockApp(key);
                } else {
                    showKeyError('Kunci Enkripsi salah.');
                }
            }
        });
    });

    function unlockApp(key) {
        sessionEncryptionKey = key;
        keyScreen.classList.add('hidden');
        appContainer.classList.remove('hidden');
        userPhoto.src = auth.currentUser.photoURL;
        userName.textContent = auth.currentUser.displayName;
        loadAndRenderEntries();
    }

    function showKeyError(message) {
        keyErrorMessage.textContent = message;
        keyErrorMessage.classList.remove('hidden');
    }

    loginBtn.addEventListener('click', () => auth.signInWithRedirect(googleProvider));
    logoutBtn.addEventListener('click', () => auth.signOut());

    // --- FIRESTORE & CORE LOGIC ---
    function getEntriesCollection() {
        return db.collection('users').doc(auth.currentUser.uid).collection('entries');
    }

    function loadAndRenderEntries() {
        if (state.unsubscribe) state.unsubscribe();
        state.unsubscribe = getEntriesCollection().onSnapshot(snapshot => {
            const encryptedDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            state.entries = encryptedDocs.map(ed => {
                if (!ed.encryptedContent) return null;
                const decryptedContent = decrypt(ed.encryptedContent, sessionEncryptionKey);
                // Convert Firestore Timestamps to JS Dates for sorting
                const createdAt = ed.createdAt ? ed.createdAt.toMillis() : 0;
                const updatedAt = ed.updatedAt ? ed.updatedAt.toMillis() : 0;
                return decryptedContent ? { ...ed, content: decryptedContent, createdAt, updatedAt } : null;
            }).filter(Boolean);
            renderApp();
        }, error => console.error("Error fetching entries:", error));
    }

    // --- UI/DOM FUNCTIONS ---
    function renderApp() {
        Object.values(state.activeTOTPTimers).forEach(clearInterval);
        state.activeTOTPTimers = {};
        
        notesContainer.innerHTML = '';
        let entriesToRender = state.activeFilter ? state.entries.filter(e => e.tags && e.tags.includes(state.activeFilter)) : state.entries;
        
        const sortedEntries = entriesToRender.sort((a, b) => (b.isPinned - a.isPinned) || (b.updatedAt - a.updatedAt));

        if (sortedEntries.length === 0) {
            notesContainer.innerHTML = state.activeFilter 
                ? `<p class="placeholder-text">Tidak ada entri dengan label "${state.activeFilter}".</p>`
                : '<p class="placeholder-text">Belum ada entri. Tekan tombol + untuk memulai.</p>';
        } else {
            sortedEntries.forEach(entry => notesContainer.appendChild(createEntryCard(entry)));
        }
        hljs.highlightAll();
        renderFilterButtons();
    }

    function createEntryCard(entry) {
        const noteCard = document.createElement('div');
        noteCard.className = 'note-card';
        if(entry.isPinned) noteCard.classList.add('pinned');
        noteCard.dataset.id = entry.id;

        const mainContent = document.createElement('div');
        mainContent.className = 'note-main';

        const noteTitle = document.createElement('h3');
        noteTitle.className = 'note-title';
        noteTitle.textContent = entry.title;
        mainContent.appendChild(noteTitle);

        const noteSubtitle = document.createElement('p');
        noteSubtitle.className = 'note-subtitle';
        mainContent.appendChild(noteSubtitle);

        if (entry.tags && entry.tags.length > 0) {
            const tagsList = document.createElement('div');
            tagsList.className = 'tags-list';
            entry.tags.forEach(tagText => {
                const tagItem = document.createElement('span');
                tagItem.className = 'tag-item';
                tagItem.textContent = tagText;
                tagsList.appendChild(tagItem);
            });
            mainContent.appendChild(tagsList);
        }

        const noteContent = document.createElement('div');
        noteContent.className = 'note-content';
        
        switch (entry.type) {
            case 'LOGIN':
                noteSubtitle.textContent = entry.content.username || 'Tidak ada username';
                noteContent.textContent = '••••••••••';
                break;
            case 'TEXT':
                noteSubtitle.textContent = 'Catatan Teks';
                noteContent.textContent = entry.content.text;
                break;
            case 'CODE':
                noteSubtitle.textContent = 'Potongan Kode';
                const pre = document.createElement('pre');
                const code = document.createElement('code');
                code.textContent = entry.content.text;
                pre.appendChild(code);
                noteContent.appendChild(pre);
                break;
            case 'TOTP':
                noteSubtitle.textContent = 'Kode Autentikasi';
                const totpDisplay = document.createElement('div');
                totpDisplay.className = 'totp-display';
                const totpCode = document.createElement('div');
                totpCode.className = 'totp-code';
                const totpTimer = document.createElement('div');
                totpTimer.className = 'totp-timer';
                const totpTimerBar = document.createElement('div');
                totpTimerBar.className = 'totp-timer-bar';
                totpTimer.appendChild(totpTimerBar);
                totpDisplay.appendChild(totpCode);
                totpDisplay.appendChild(totpTimer);
                noteContent.appendChild(totpDisplay);
                
                const updateTOTP = () => {
                    try {
                        let totp = new otpauth.TOTP({ secret: otpauth.Secret.fromBase32(entry.content.secret.toUpperCase().replace(/\s/g, '')) });
                        totpCode.textContent = totp.generate();
                        const remaining = (totp.period - (Math.floor(Date.now() / 1000) % totp.period));
                        totpTimerBar.style.width = `${(remaining / totp.period) * 100}%`;
                    } catch (e) {
                        totpCode.textContent = 'INVALID';
                        clearInterval(state.activeTOTPTimers[entry.id]);
                    }
                };
                updateTOTP();
                state.activeTOTPTimers[entry.id] = setInterval(updateTOTP, 1000);
                break;
        }
        mainContent.appendChild(noteContent);
        
        const noteActions = createActionButtons(entry, noteContent);
        noteCard.appendChild(mainContent);
        noteCard.appendChild(noteActions);
        return noteCard;
    }
    
    function createActionButtons(entry, noteContentElement) {
        const actions = document.createElement('div');
        actions.className = 'note-actions';
        
        const createBtn = (icon, handler, danger = false) => {
            const btn = document.createElement('button');
            btn.className = 'action-btn';
            if(danger) btn.classList.add('danger');
            btn.innerHTML = icon;
            btn.addEventListener('click', (e) => { e.stopPropagation(); handler(); });
            return btn;
        };

        actions.appendChild(createBtn(ICONS.pin, () => togglePin(entry.id)));
        
        if(entry.type === 'LOGIN') {
            actions.appendChild(createBtn(ICONS.peek, () => {
                noteContentElement.textContent = noteContentElement.textContent === '••••••••••' ? entry.content.password : '••••••••••';
            }));
        }

        const copyText = entry.type === 'LOGIN' ? entry.content.password : (entry.type === 'TOTP' ? '' : entry.content.text);
        if (copyText) {
            actions.appendChild(createBtn(ICONS.copy, () => navigator.clipboard.writeText(copyText).then(() => alert('Konten disalin!'))));
        }
        
        actions.appendChild(createBtn(ICONS.edit, () => openModal(entry.id)));
        actions.appendChild(createBtn(ICONS.delete, () => deleteEntry(entry.id), true));

        return actions;
    }
    
    function renderFilterButtons() {
        filterContainer.innerHTML = '';
        const allTags = new Set(state.entries.flatMap(e => e.tags || []));

        const createFilterBtn = (tag, isActive) => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn';
            if (isActive) btn.classList.add('active');
            btn.textContent = tag || 'Semua';
            btn.addEventListener('click', () => {
                state.activeFilter = tag;
                renderApp();
            });
            return btn;
        };

        filterContainer.appendChild(createFilterBtn(null, !state.activeFilter));
        allTags.forEach(tag => filterContainer.appendChild(createFilterBtn(tag, tag === state.activeFilter)));
    }

    // --- MODAL & FORM FUNCTIONS ---
    function openModal(entryId = null) {
        noteForm.reset();
        state.editingEntryId = entryId;
        if (entryId) {
            modalTitle.textContent = 'Edit Entri';
            const entry = state.entries.find(e => e.id === entryId);
            noteTypeSelect.value = entry.type;
            noteTitleInput.value = entry.title;
            noteTagsInput.value = entry.tags ? entry.tags.join(', ') : '';
            
            if (entry.type === 'LOGIN') {
                noteWebsiteInput.value = entry.content.website || '';
                noteUsernameInput.value = entry.content.username || '';
                noteContentInput.value = entry.content.password || '';
            } else {
                noteContentInput.value = entry.content.text || entry.content.secret || '';
            }
        } else {
            modalTitle.textContent = 'Tambah Entri Baru';
        }
        updateFormDisplay();
        modalOverlay.classList.remove('hidden');
    }

    function closeModal() { modalOverlay.classList.add('hidden'); }

    function updateFormDisplay() {
        const type = noteTypeSelect.value;
        loginFields.classList.add('hidden');

        switch (type) {
            case 'LOGIN':
                loginFields.classList.remove('hidden');
                contentLabel.textContent = 'Sandi';
                break;
            case 'TEXT': contentLabel.textContent = 'Isi Catatan'; break;
            case 'CODE': contentLabel.textContent = 'Potongan Kode'; break;
            case 'TOTP': contentLabel.textContent = 'Kunci Rahasia (Secret Key)'; break;
        }
    }
    
    // --- FORM SUBMIT (MAIN LOGIC) ---
    function handleFormSubmit(e) {
        e.preventDefault();
        const type = noteTypeSelect.value;
        const title = noteTitleInput.value;
        const tags = noteTagsInput.value.split(',').map(t => t.trim()).filter(Boolean);
        let content;

        switch (type) {
            case 'LOGIN':
                content = { website: noteWebsiteInput.value, username: noteUsernameInput.value, password: noteContentInput.value };
                break;
            case 'TOTP':
                content = { secret: noteContentInput.value };
                break;
            default:
                content = { text: noteContentInput.value };
                break;
        }

        const dataToSave = {
            title, type, tags,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            encryptedContent: encrypt(content, sessionEncryptionKey)
        };

        if (state.editingEntryId) {
            getEntriesCollection().doc(state.editingEntryId).update(dataToSave);
        } else {
            dataToSave.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            dataToSave.isPinned = false;
            getEntriesCollection().add(dataToSave);
        }
        closeModal();
    }
    
    // --- OTHER CORE LOGIC ---
    function deleteEntry(id) {
        if (confirm('Anda yakin ingin menghapus entri ini?')) {
            getEntriesCollection().doc(id).delete();
        }
    }

    function togglePin(id) {
        const entry = state.entries.find(e => e.id === id);
        getEntriesCollection().doc(id).update({ isPinned: !entry.isPinned });
    }

    // --- INITIALIZATION & EVENT LISTENERS ---
    addNoteButton.addEventListener('click', () => openModal());
    cancelBtn.addEventListener('click', closeModal);
    noteForm.addEventListener('submit', handleFormSubmit);
    noteTypeSelect.addEventListener('change', updateFormDisplay);
    modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

})();
