// Wait until the document is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const notesContainer = document.getElementById('notes-container');
    const addNoteButton = document.getElementById('add-note-btn');
    const STORAGE_KEY = 'cakra-notes';

    // Function to get notes from localStorage
    function getNotes() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    }

    // Function to save notes to localStorage
    function saveNotes(notes) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    }

    // Function to render all notes to the DOM
    function renderNotes() {
        const notes = getNotes();
        // Clear a container before rendering new list
        notesContainer.innerHTML = ''; 

        if (notes.length === 0) {
            notesContainer.innerHTML = '<p class="placeholder-text">Belum ada catatan. Tekan tombol + untuk memulai.</p>';
        } else {
            notes.forEach(note => {
                const noteCard = createNoteCard(note);
                notesContainer.appendChild(noteCard); // append, so older notes are at the top
            });
        }
    }

    // Function to create a note card element
    function createNoteCard(note) {
        const noteCard = document.createElement('div');
        noteCard.className = 'note-card';
        noteCard.dataset.id = note.id; // Store note id in the element

        const noteContent = document.createElement('p');
        noteContent.className = 'note-content';
        noteContent.textContent = note.text;

        const noteActions = document.createElement('div');
        noteActions.className = 'note-actions';
        
        const copyButton = document.createElement('button');
        copyButton.className = 'action-btn';
        copyButton.textContent = 'Salin';
        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(note.text).then(() => {
                alert('Teks berhasil disalin!');
            }).catch(err => {
                console.error('Gagal menyalin teks: ', err);
            });
        });
        
        const deleteButton = document.createElement('button');
        deleteButton.className = 'action-btn';
        deleteButton.textContent = 'Hapus';
        deleteButton.style.color = '#dc3545'; // Make delete button red
        deleteButton.addEventListener('click', () => {
            if (confirm('Anda yakin ingin menghapus catatan ini?')) {
                deleteNote(note.id);
            }
        });

        noteActions.appendChild(copyButton);
        noteActions.appendChild(deleteButton);
        noteCard.appendChild(noteContent);
        noteCard.appendChild(noteActions);
        
        return noteCard;
    }
    
    // Function to add a new note
    function addNote() {
        const noteText = prompt("Masukkan catatan baru:");
        if (noteText && noteText.trim() !== '') {
            const notes = getNotes();
            const newNote = {
                id: Date.now().toString(), // Simple unique ID
                text: noteText
            };
            // Add new note to the beginning of the array
            notes.unshift(newNote); 
            saveNotes(notes);
            renderNotes();
        }
    }
    
    // Function to delete a note
    function deleteNote(id) {
        let notes = getNotes();
        notes = notes.filter(note => note.id !== id);
        saveNotes(notes);
        renderNotes();
    }

    // Initial setup
    addNoteButton.addEventListener('click', addNote);
    renderNotes(); // Load and display notes when the app starts
});