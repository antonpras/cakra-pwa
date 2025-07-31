// Wait until the document is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("Cakra PWA Loaded");

    const addNoteButton = document.getElementById('add-note-btn');

    addNoteButton.addEventListener('click', () => {
        // Prompt the user to enter a new note
        const noteText = prompt("Masukkan catatan baru:");

        if (noteText) { // If the user entered text and didn't cancel
            addNoteToDOM(noteText);
        }
    });

    function addNoteToDOM(text) {
        const notesContainer = document.getElementById('notes-container');
        const placeholder = document.querySelector('.placeholder-text');

        // Remove placeholder if it exists
        if (placeholder) {
            placeholder.remove();
        }

        // Create the card element
        const noteCard = document.createElement('div');
        noteCard.className = 'note-card';

        // Create the content paragraph
        const noteContent = document.createElement('p');
        noteContent.className = 'note-content';
        noteContent.textContent = text;

        // Create the actions container
        const noteActions = document.createElement('div');
        noteActions.className = 'note-actions';
        
        // Create the copy button
        const copyButton = document.createElement('button');
        copyButton.className = 'action-btn';
        copyButton.textContent = 'Salin';
        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(text).then(() => {
                alert('Teks berhasil disalin!');
            }).catch(err => {
                console.error('Gagal menyalin teks: ', err);
            });
        });

        // Add elements to the card
        noteActions.appendChild(copyButton);
        noteCard.appendChild(noteContent);
        noteCard.appendChild(noteActions);

        // Add the new card to the container
        notesContainer.prepend(noteCard); // prepend to add new notes at the top
    }
});