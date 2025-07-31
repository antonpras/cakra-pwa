// Wait until the document is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const notesContainer = document.getElementById('notes-container');
    const addNoteButton = document.getElementById('add-note-btn');
    const STORAGE_KEY = 'cakra-notes';

    // --- FUNGSI DATABASE LOKAL ---
    function getNotes() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    }

    function saveNotes(notes) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    }

    // --- FUNGSI TAMPILAN (UI) ---
    function renderNotes() {
        const notes = getNotes();
        notesContainer.innerHTML = ''; 

        if (notes.length === 0) {
            notesContainer.innerHTML = '<p class="placeholder-text">Belum ada catatan. Tekan tombol + untuk memulai.</p>';
        } else {
            notes.forEach(note => {
                const noteCard = createNoteCard(note);
                notesContainer.appendChild(noteCard);
            });
        }
    }

    function createNoteCard(note) {
        const noteCard = document.createElement('div');
        noteCard.className = 'note-card';
        noteCard.dataset.id = note.id;

        const noteContent = document.createElement('p');
        noteContent.className = 'note-content';
        
        // --- LOGIKA BARU: TAMPILAN BERDASARKAN JENIS CATATAN ---
        switch (note.type) {
            case 'PASSWORD':
                noteContent.textContent = '••••••••••';
                noteContent.style.fontFamily = 'monospace';
                break;
            case 'CODE':
                noteContent.textContent = note.text;
                noteContent.style.fontFamily = 'monospace';
                noteContent.style.whiteSpace = 'pre'; // Preserve formatting
                noteContent.style.backgroundColor = '#e9ecef';
                noteContent.style.padding = '0.5rem';
                noteContent.style.borderRadius = '4px';
                break;
            default: // TEXT
                noteContent.textContent = note.text;
                break;
        }

        const noteActions = document.createElement('div');
        noteActions.className = 'note-actions';
        
        const copyButton = document.createElement('button');
        copyButton.className = 'action-btn';
        copyButton.textContent = 'Salin';
        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(note.text).then(() => {
                alert('Teks berhasil disalin!');
            }).catch(err => console.error('Gagal menyalin teks: ', err));
        });

        const deleteButton = document.createElement('button');
        deleteButton.className = 'action-btn';
        deleteButton.textContent = 'Hapus';
        deleteButton.style.color = '#dc3545';
        deleteButton.addEventListener('click', () => {
            if (confirm('Anda yakin ingin menghapus catatan ini?')) {
                deleteNote(note.id);
            }
        });

        noteActions.appendChild(copyButton);
        noteActions.appendChild(deleteButton);
        
        // --- Tombol "Lihat" khusus untuk Sandi ---
        if (note.type === 'PASSWORD') {
            const peekButton = document.createElement('button');
            peekButton.className = 'action-btn';
            peekButton.textContent = 'Lihat';
            peekButton.addEventListener('click', function() {
                // Temporarily show the password
                const originalText = this.textContent;
                noteContent.textContent = note.text;
                this.textContent = 'Sembunyikan';
                
                setTimeout(() => {
                    noteContent.textContent = '••••••••••';
                    this.textContent = originalText;
                }, 3000); // Hide again after 3 seconds
            });
            noteActions.prepend(peekButton); // Add "Lihat" button before others
        }
        
        noteCard.appendChild(noteContent);
        noteCard.appendChild(noteActions);
        
        return noteCard;
    }
    
    // --- FUNGSI LOGIKA APLIKASI ---
    function addNote() {
        const noteTypeText = prompt("Pilih jenis catatan:\n1. Teks Biasa\n2. Sandi\n3. Kode");
        if (!noteTypeText) return; // User cancelled

        let noteType = 'TEXT';
        switch(noteTypeText.trim()) {
            case '1':
                noteType = 'TEXT';
                break;
            case '2':
                noteType = 'PASSWORD';
                break;
            case '3':
                noteType = 'CODE';
                break;
            default:
                alert('Pilihan tidak valid.');
                return;
        }

        const noteText = prompt(`Masukkan ${noteType.toLowerCase()} baru:`);
        if (noteText && noteText.trim() !== '') {
            const notes = getNotes();
            const newNote = {
                id: Date.now().toString(),
                text: noteText,
                type: noteType // Menyimpan jenis catatan
            };
            notes.unshift(newNote); 
            saveNotes(notes);
            renderNotes();
        }
    }
    
    function deleteNote(id) {
        let notes = getNotes();
        notes = notes.filter(note => note.id !== id);
        saveNotes(notes);
        renderNotes();
    }

    // Initial setup
    addNoteButton.addEventListener('click', addNote);
    renderNotes();
});