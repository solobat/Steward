
export function autoFormat(editor) {
  setTimeout(function() {
      editor.getAction('editor.action.formatDocument').run();
  }, 300);
}