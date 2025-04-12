const CodeEditor = ({ code, onCodeChange, onExecute, isLoading }) => {
    const [editorMode, setEditorMode] = React.useState('view'); // 'view' or 'edit'
    const [editableCode, setEditableCode] = React.useState(code || '');
    
    React.useEffect(() => {
        if (code) {
            setEditableCode(code);
            // Highlight code when in view mode
            if (editorMode === 'view' && window.Prism) {
                window.Prism.highlightAll();
            }
        }
    }, [code, editorMode]);
    
    const handleCodeExecution = () => {
        onExecute(editorMode === 'edit' ? editableCode : code);
    };
    
    const copyToClipboard = () => {
        navigator.clipboard.writeText(editorMode === 'edit' ? editableCode : code);
        // Show toast or notification
        alert('Code copied to clipboard!');
    };
    
    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">Generated Python Code</h2>
                <div style={{ display: 'flex', gap: '5px' }}>
                    <button 
                        className={`btn btn-${editorMode === 'view' ? 'primary' : 'secondary'}`}
                        onClick={() => setEditorMode('view')}
                        title="View Mode"
                    >
                        <i className="fas fa-eye"></i>
                    </button>
                    <button 
                        className={`btn btn-${editorMode === 'edit' ? 'primary' : 'secondary'}`}
                        onClick={() => setEditorMode('edit')}
                        title="Edit Mode"
                    >
                        <i className="fas fa-edit"></i>
                    </button>
                </div>
            </div>
            
            <div className="card-body">
                <div className="code-editor">
                    <div className="code-actions">
                        <button 
                            className="btn btn-secondary btn-icon"
                            onClick={copyToClipboard}
                            title="Copy to Clipboard"
                        >
                            <i className="fas fa-copy"></i>
                        </button>
                        <button 
                            className="btn btn-primary btn-icon"
                            onClick={handleCodeExecution}
                            disabled={isLoading || !code}
                            title="Execute in Blender"
                        >
                            {isLoading ? (
                                <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                                <i className="fas fa-play"></i>
                            )}
                        </button>
                    </div>
                    
                    {editorMode === 'view' ? (
                        <pre><code className="language-python">{code || '# No code generated yet.\n# Enter your command above and click "Execute".'}</code></pre>
                    ) : (
                        <textarea
                            value={editableCode}
                            onChange={(e) => {
                                setEditableCode(e.target.value);
                                if (onCodeChange) {
                                    onCodeChange(e.target.value);
                                }
                            }}
                            style={{
                                width: '100%',
                                height: '400px',
                                padding: '15px',
                                fontFamily: 'Consolas, Monaco, monospace',
                                fontSize: '14px',
                                backgroundColor: '#2d2d2d',
                                color: '#eee',
                                border: 'none',
                                borderRadius: '6px',
                                resize: 'vertical'
                            }}
                        ></textarea>
                    )}
                </div>
            </div>
        </div>
    );
}; 