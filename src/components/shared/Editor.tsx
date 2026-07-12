'use client';

import { useQuill } from 'react-quilljs';
import 'quill/dist/quill.snow.css'; // Add css for snow theme
import React from 'react';

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
    ['link'],
    ['clean']
  ],
};

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const Editor = ({ value, onChange }: EditorProps) => {
  const { quill, quillRef } = useQuill({ modules });

  React.useEffect(() => {
    if (quill) {
      quill.on('text-change', () => {
        onChange(quill.root.innerHTML);
      });
    }
  }, [quill, onChange]);

  React.useEffect(() => {
     if (quill && value !== quill.root.innerHTML) {
      // Set initial content or update when external value changes
      quill.clipboard.dangerouslyPasteHTML(value);
    }
  }, [quill, value]);

  return (
    <div className="bg-background rounded-md">
       <div ref={quillRef} className='[&_.ql-container]:min-h-80 [&_.ql-container]:text-base [&_.ql-editor]:prose' />
    </div>
  );
};

Editor.displayName = 'Editor';
