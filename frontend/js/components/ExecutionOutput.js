const ExecutionOutput = ({ output }) => {
    const hasOutput = output && (output.result || output.error);
    const isError = output && output.error;
    const isSuccess = output && output.result;
    
    // Function to format the output for better readability
    const formatOutput = (text) => {
        if (!text) return '';
        
        // Replace newlines with HTML breaks for proper display
        return text.replace(/\n/g, '<br />');
    };
    
    // Auto-scroll to bottom when output changes
    const outputRef = React.useRef();
    React.useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [output]);
    
    // Function to clear console
    const clearConsole = () => {
        // This would be implemented via a prop passed from the parent
        console.log('Clear console requested');
    };
    
    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">Execution Output</h2>
                {hasOutput && (
                    <button 
                        className="btn btn-secondary btn-icon"
                        onClick={clearConsole}
                        title="Clear Console"
                    >
                        <i className="fas fa-trash"></i>
                    </button>
                )}
            </div>
            
            <div className="card-body">
                <div 
                    ref={outputRef}
                    className={`output-panel ${isError ? 'output-error' : isSuccess ? 'output-success' : ''}`}
                >
                    {!hasOutput && (
                        <div style={{ 
                            color: '#888', 
                            display: 'flex', 
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%'
                        }}>
                            <i className="fas fa-terminal" style={{ marginRight: '10px', fontSize: '1.2rem' }}></i>
                            Output will appear here after executing code
                        </div>
                    )}
                    
                    {isError && (
                        <div>
                            <div style={{ 
                                color: 'var(--danger-color)', 
                                fontWeight: 'bold', 
                                marginBottom: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}>
                                <i className="fas fa-exclamation-triangle"></i>
                                Error
                            </div>
                            <div dangerouslySetInnerHTML={{ __html: formatOutput(output.error) }} />
                        </div>
                    )}
                    
                    {isSuccess && (
                        <div>
                            <div style={{ 
                                color: 'var(--success-color)', 
                                fontWeight: 'bold', 
                                marginBottom: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}>
                                <i className="fas fa-check-circle"></i>
                                Success
                            </div>
                            <div>
                                <strong>Message:</strong> {output.result.message}<br />
                                <strong>Output:</strong><br />
                                <div 
                                    style={{ marginTop: '10px', whiteSpace: 'pre-wrap' }}
                                    dangerouslySetInnerHTML={{ __html: formatOutput(output.result.output) }} 
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}; 