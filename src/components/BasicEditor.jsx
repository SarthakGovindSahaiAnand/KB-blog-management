import React, { useRef, useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';

const TextEditorContainer = styled.div`
    border: 1px solid var(--color-border);
    border-radius: 8px; /* Slightly more rounded corners */
    margin-top: 20px; /* Increased top margin for better separation */
    background-color: var(--color-background-card);
    display: flex;
    flex-direction: column;
    box-shadow: rgba(0, 0, 0, 0.08) 0px 4px 12px; /* Subtle shadow for depth */
`;

const Toolbar = styled.div`
    padding: 10px 15px; /* Increased padding */
    border-bottom: 1px solid var(--color-border);
    display: flex;
    gap: 12px; /* Increased gap between items */
    align-items: center;
    flex-wrap: wrap;
`;

const EditorButton = styled.button`
    background-color: #f0f2f5; /* Light grey background */
    color: #343a40; /* Darker text */
    border: 1px solid #ced4da; /* Soft grey border */
    padding: 8px 14px; /* Adjusted padding */
    border-radius: 6px; /* Slightly more rounded corners */
    cursor: pointer;
    font-size: 0.95rem; /* Slightly larger font */
    transition: all 0.2s ease-in-out;

    &:hover {
        background-color: #e2e6ea; /* Darker grey on hover */
        border-color: #adb5bd;
    }

    &:active {
        background-color: #007bff; /* Primary blue on active */
        color: white;
        border-color: #007bff;
    }
`;

const HiddenFileInput = styled.input`
    display: none;
`;

const EditorContent = styled.div`
    flex-grow: 1;
    padding: 20px; /* Increased padding */
    min-height: 250px; /* Increased min-height */
    max-height: 450px; /* Adjusted max-height */
    overflow-y: auto;
    outline: none;
    cursor: text;
    font-size: 1rem;
    line-height: 1.6;
    color: var(--color-text-dark);

    /* Default font styles */
    font-family: Arial, sans-serif;
`;

const FontSizeSelect = styled.select`
    padding: 8px 12px; /* Adjusted padding */
    border: 1px solid #ced4da; /* Soft grey border */
    border-radius: 6px; /* Slightly more rounded corners */
    background-color: #f0f2f5;
    color: #343a40;
    cursor: pointer;
    font-size: 0.95rem;
`;

const FontFamilySelect = styled.select`
    padding: 8px 12px; /* Adjusted padding */
    border: 1px solid #ced4da; /* Soft grey border */
    border-radius: 6px; /* Slightly more rounded corners */
    background-color: #f0f2f5;
    color: #343a40;
    cursor: pointer;
    font-size: 0.95rem;
`;

const FONT_SIZES = [
    { label: '14px', value: '14px' },
    { label: '16px', value: '16px' },
    { label: '18px', value: '18px' },
    { label: '20px', value: '20px' },
    { label: '24px', value: '24px' }
];

const FONT_FAMILIES = [
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Verdana', value: 'Verdana, sans-serif' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Times New Roman', value: '"Times New Roman", serif' },
    { label: 'Courier New', value: '"Courier New", monospace' }
];

function BasicEditor({ initialContent, onContentChange }) {
    const editorRef = useRef(null);
    const fileInputRef = useRef(null); // Ref for hidden file input
    const [currentFontSize, setCurrentFontSize] = useState(FONT_SIZES[1].value); // Default to Medium
    const [currentFontFamily, setCurrentFontFamily] = useState(FONT_FAMILIES[0].value); // Default to Arial

    // Update contentEditable div when initialContent changes externally
    useEffect(() => {
        if (editorRef.current && initialContent !== editorRef.current.innerHTML) {
            editorRef.current.innerHTML = initialContent;
        }
    }, [initialContent]);

    // Restore selection after re-render or content change to maintain cursor position
    const restoreSelection = useRef(null);
    useEffect(() => {
        if (editorRef.current && restoreSelection.current) {
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(restoreSelection.current);
            restoreSelection.current = null;
        }
    }, [initialContent]); // Only re-apply if initialContent changes


    const handleInput = useCallback(() => {
        if (onContentChange && editorRef.current) {
            onContentChange(editorRef.current.innerHTML);
        }
    }, [onContentChange]);

    // Function to insert HTML at the current cursor position
    const insertHtmlAtCaret = (html) => {
        if (editorRef.current) {
            editorRef.current.focus();
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                const el = document.createElement('div');
                el.innerHTML = html;
                let frag = document.createDocumentFragment(), node, lastNode;
                while ((node = el.firstChild)) {
                    lastNode = frag.appendChild(node);
                }
                range.insertNode(frag);

                // Set cursor after the inserted content
                if (lastNode) {
                    range.setStartAfter(lastNode);
                    range.setEndAfter(lastNode);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            }
            handleInput(); // Update parent state
        }
    };

    // Handle image file selection from hidden input
    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64Image = e.target.result;
                insertHtmlAtCaret(`<img src="${base64Image}" alt="Uploaded Image" style="max-width:100%; height:auto;">`);
            };
            reader.readAsDataURL(file);
        }
        if (fileInputRef.current) { // Clear the file input to allow re-uploading the same file
            fileInputRef.current.value = '';
        }
    };

    // Handle paste events to detect and embed images
    const handlePaste = (event) => {
        const items = (event.clipboardData || event.originalEvent.clipboardData).items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    event.preventDefault(); // Prevent default paste behavior
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const base64Image = e.target.result;
                        insertHtmlAtCaret(`<img src="${base64Image}" alt="Pasted Image" style="max-width:100%; height:auto;">`);
                    };
                    reader.readAsDataURL(file);
                    return; // Stop after handling the first image
                }
            }
        }
    };

    const applyFormat = (command, value = null) => {
        if (editorRef.current) {
            // Save current selection before command to restore focus
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                restoreSelection.current = selection.getRangeAt(0);
            }

            if (command === 'fontSize') {
                // document.execCommand('fontSize') expects 1-7, map pixel values
                let sizeValue = parseInt(value);
                let execCommandSize = 3; // Default to medium

                if (sizeValue < 15) execCommandSize = 1; // Small
                else if (sizeValue < 17) execCommandSize = 2; // Medium-small
                else if (sizeValue < 19) execCommandSize = 3; // Medium
                else if (sizeValue < 21) execCommandSize = 4; // Large
                else if (sizeValue < 25) execCommandSize = 5; // X-Large
                else execCommandSize = 6; // XX-Large and beyond
                
                document.execCommand(command, false, execCommandSize);
            } else {
                document.execCommand(command, false, value);
            }
            
            editorRef.current.focus();
            handleInput();
        }
    };

    const handleFontSizeChange = (e) => {
        const newSize = e.target.value;
        setCurrentFontSize(newSize);
        applyFormat('fontSize', newSize);
    };

    const handleFontFamilyChange = (e) => {
        const newFont = e.target.value;
        setCurrentFontFamily(newFont);
        applyFormat('fontName', newFont);
    };

    return (
        <TextEditorContainer>
            <Toolbar>
                <EditorButton type="button" onClick={() => applyFormat('bold')}>Bold</EditorButton>
                <EditorButton type="button" onClick={() => applyFormat('italic')}>Italic</EditorButton>
                <EditorButton type="button" onClick={() => applyFormat('underline')}>Underline</EditorButton>
                <FontSizeSelect value={currentFontSize} onChange={handleFontSizeChange}>
                    {FONT_SIZES.map(size => (
                        <option key={size.value} value={size.value}>{size.label}</option>
                    ))}
                </FontSizeSelect>
                <FontFamilySelect value={currentFontFamily} onChange={handleFontFamilyChange}>
                    {FONT_FAMILIES.map(family => (
                        <option key={family.value} value={family.value}>{family.label}</option>
                    ))}
                </FontFamilySelect>
                <EditorButton type="button" onClick={() => fileInputRef.current.click()}>Insert Image</EditorButton>
                <HiddenFileInput
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                />
            </Toolbar>
            <EditorContent
                ref={editorRef}
                contentEditable="true"
                onInput={handleInput}
                onPaste={handlePaste} /* Add paste event listener */
            />
        </TextEditorContainer>
    );
}

export default BasicEditor;