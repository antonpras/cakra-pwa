document.addEventListener('DOMContentLoaded', () => {
    // --- GLOBAL VARIABLES & CONSTANTS ---
    const notesContainer = document.getElementById('notes-container');
    const addNoteButton = document.getElementById('add-note-btn');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    const noteForm = document.getElementById('note-form');
    const modalTitle = document.getElementById('modal-title');
    const cancelBtn = document.getElementById('cancel-btn');
    const noteTypeSelect = document.getElementById('note-type');
    const noteTextInput = document.getElementById('note-text');
    const noteTextLabel = document.getElementById('note-text-label');

    const STORAGE_KEY = 'cakra-notes-v1';
    let state = {
        notes: [],
        editingNoteId: null,
        activeTOTPTimers: {}
    };

    // --- SVG ICONS ---
    const ICONS = {
        copy: `<svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`,
        edit: `<svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`,
        delete: `<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`,
        pin: `<svg viewBox="0 0 24 24"><path d="M16 9V4h-2v5l-2 2v2h6v-2l-2-2zM12 2C8.69 2 6 4.69 6 8c0 1.66.79 3.16 2.08 4.08L6 14v2h12v-2l-2.08-1.92C17.21 11.16 18 9.66 18 8c0-3.31-2.69-6-6-6z"/></svg>`,
        peek: `<svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 12c-2.48 0-4.5-2.02-4.5-4.5S9.52 7.5 12 7.5s4.5 2.02 4.5 4.5-2.02 4.5-4.5 4.5zm0-7c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5z"/></svg>`
    };

    // --- DATABASE FUNCTIONS ---
    function getNotes() { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    function saveNotes() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.notes)); }

    // --- UI/DOM FUNCTIONS ---
    function renderNotes() {
        // Clear all active timers before re-rendering
        Object.values(state.activeTOTPTimers).forEach(clearInterval);
        state.activeTOTPTimers = {};
        
        notesContainer.innerHTML = '';
        const notes = state.notes.sort((a, b) => b.isPinned - a.isPinned || b.updatedAt - a.updatedAt);

        if (notes.length === 0) {
            notesContainer.innerHTML = '<p class="placeholder-text">Belum ada catatan. Tekan tombol + untuk memulai.</p>';
        } else {
            notes.forEach(note => notesContainer.appendChild(createNoteCard(note)));
        }
        // Apply syntax highlighting after rendering
        hljs.highlightAll();
    }

    function createNoteCard(note) {
        const noteCard = document.createElement('div');
        noteCard.className = 'note-card';
        if(note.isPinned) noteCard.classList.add('pinned');
        noteCard.dataset.id = note.id;

        const mainContent = document.createElement('div');
        mainContent.className = 'note-main';

        const noteContent = document.createElement('div');
        noteContent.className = 'note-content';

        switch (note.type) {
            case 'PASSWORD':
                noteContent.textContent = '••••••••••';
                break;
            case 'CODE':
                const pre = document.createElement('pre');
                const code = document.createElement('code');
                code.textContent = note.text;
                pre.appendChild(code);
                noteContent.appendChild(pre);
                break;
            case 'TOTP':
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
                        let totp = new otpauth.TOTP({
                            secret: otpauth.Secret.fromBase32(note.text.toUpperCase().replace(/\s/g, ''))
                        });
                        totpCode.textContent = totp.generate();
                        const remaining = (totp.period - (Math.floor(Date.now() / 1000) % totp.period));
                        totpTimerBar.style.width = `${(remaining / totp.period) * 100}%`;
                    } catch (e) {
                        totpCode.textContent = 'SECRET-KEY-INVALID';
                        clearInterval(state.activeTOTPTimers[note.id]);
                    }
                };
                updateTOTP();
                state.activeTOTPTimers[note.id] = setInterval(updateTOTP, 1000);
                break;
            default: // TEXT
                noteContent.textContent = note.text;
                break;
        }
        mainContent.appendChild(noteContent);
        
        const noteActions = createActionButtons(note, noteContent);
        noteCard.appendChild(mainContent);
        noteCard.appendChild(noteActions);
        return noteCard;
    }

    function createActionButtons(note, noteContentElement) {
        const actions = document.createElement('div');
        actions.className = 'note-actions';
        
        const createBtn = (icon, handler, danger = false) => {
            const btn = document.createElement('button');
            btn.className = 'action-btn';
            if(danger) btn.classList.add('danger');
            btn.innerHTML = icon;
            btn.addEventListener('click', handler);
            return btn;
        };

        // Pin Button
        actions.appendChild(createBtn(ICONS.pin, () => togglePin(note.id)));
        
        // Peek Button (for Passwords)
        if(note.type === 'PASSWORD') {
            actions.appendChild(createBtn(ICONS.peek, () => {
                noteContentElement.textContent = noteContentElement.textContent === '••••••••••' ? note.text : '••••••••••';
            }));
        }

        // Copy Button
        actions.appendChild(createBtn(ICONS.copy, () => {
             navigator.clipboard.writeText(note.text).then(() => alert('Teks berhasil disalin!'));
        }));
        
        // Edit Button
        actions.appendChild(createBtn(ICONS.edit, () => openModal(note.id)));
        
        // Delete Button
        actions.appendChild(createBtn(ICONS.delete, () => deleteNote(note.id), true));

        return actions;
    }

    // --- MODAL FUNCTIONS ---
    function openModal(noteId = null) {
        noteForm.reset();
        state.editingNoteId = noteId;
        if (noteId) {
            modalTitle.textContent = 'Edit Catatan';
            const note = state.notes.find(n => n.id === noteId);
            noteTypeSelect.value = note.type;
            noteTextInput.value = note.text;
        } else {
            modalTitle.textContent = 'Tambah Catatan Baru';
        }
        updateFormForType();
        modalOverlay.classList.remove('hidden');
    }

    function closeModal() {
        modalOverlay.classList.add('hidden');
    }
    
    function updateFormForType() {
        const type = noteTypeSelect.value;
        if(type === 'TOTP') {
            noteTextLabel.textContent = 'Kunci Rahasia (Secret Key)';
            noteTextInput.placeholder = 'Contoh: JBSWY3DPEHPK3PXP';
        } else {
            noteTextLabel.textContent = 'Isi Catatan';
            noteTextInput.placeholder = '';
        }
    }

    // --- CORE LOGIC FUNCTIONS ---
    function handleFormSubmit(e) {
        e.preventDefault();
        const text = noteTextInput.value;
        const type = noteTypeSelect.value;

        if (state.editingNoteId) { // Editing
            const note = state.notes.find(n => n.id === state.editingNoteId);
            note.text = text;
            note.type = type;
            note.updatedAt = Date.now();
        } else { // Adding new
            const newNote = {
                id: Date.now().toString(),
                text: text,
                type: type,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                isPinned: false
            };
            state.notes.push(newNote);
        }
        saveNotes();
        renderNotes();
        closeModal();
    }

    function deleteNote(id) {
        if (confirm('Anda yakin ingin menghapus catatan ini?')) {
            state.notes = state.notes.filter(note => note.id !== id);
            saveNotes();
            renderNotes();
        }
    }

    function togglePin(id) {
        const note = state.notes.find(n => n.id === id);
        note.isPinned = !note.isPinned;
        note.updatedAt = Date.now();
        saveNotes();
        renderNotes();
    }

    // --- INITIALIZATION & EVENT LISTENERS ---
    state.notes = getNotes();
    renderNotes();

    addNoteButton.addEventListener('click', () => openModal());
    cancelBtn.addEventListener('click', closeModal);
    noteForm.addEventListener('submit', handleFormSubmit);
    noteTypeSelect.addEventListener('change', updateFormForType);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
});