const CommandInput = ({ onExecute, isLoading }) => {
    const [command, setCommand] = React.useState('');
    const [showOptions, setShowOptions] = React.useState(false);
    const [includeScene, setIncludeScene] = React.useState(true);
    const [advancedOptions, setAdvancedOptions] = React.useState({
        modelName: 'mistral:latest',
        temperature: 0.7,
        maxTokens: 1024
    });
    
    const handleExecute = () => {
        if (!command.trim()) return;
        
        onExecute({
            command: command.trim(),
            includeScene,
            ...advancedOptions
        });
    };
    
    const predefinedCommands = [
        "Create a red cube at the origin",
        "Make a simple animation of a spinning sphere",
        "Create a procedural landscape with mountains",
        "Set up a three-point lighting system",
        "Create a realistic water material"
    ];
    
    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">Command Center</h2>
                <button 
                    className="btn btn-secondary btn-icon"
                    onClick={() => setShowOptions(!showOptions)}
                    title={showOptions ? "Hide Options" : "Show Options"}
                >
                    <i className={`fas fa-${showOptions ? 'chevron-up' : 'sliders-h'}`}></i>
                </button>
            </div>
            
            <div className="card-body">
                {showOptions && (
                    <div className="alert alert-info mb-20">
                        <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
                            <i className="fas fa-info-circle" style={{ marginRight: '5px' }}></i>
                            Advanced Options
                        </div>
                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                            <div className="form-group" style={{ flex: '1', minWidth: '200px' }}>
                                <label className="form-label">Model</label>
                                <select 
                                    className="form-control"
                                    value={advancedOptions.modelName}
                                    onChange={(e) => setAdvancedOptions({
                                        ...advancedOptions,
                                        modelName: e.target.value
                                    })}
                                >
                                    <option value="mistral:latest">Mistral (Default)</option>
                                    <option value="llama3:8b">Llama 3 (8B)</option>
                                    <option value="llama3:70b">Llama 3 (70B)</option>
                                    <option value="codellama:13b">Code Llama (13B)</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ flex: '1', minWidth: '150px' }}>
                                <label className="form-label">Temperature</label>
                                <input 
                                    type="range" 
                                    min="0.1" 
                                    max="1.0" 
                                    step="0.1"
                                    value={advancedOptions.temperature}
                                    onChange={(e) => setAdvancedOptions({
                                        ...advancedOptions,
                                        temperature: parseFloat(e.target.value)
                                    })}
                                    className="form-control"
                                />
                                <div style={{ textAlign: 'center', fontSize: '0.8rem', marginTop: '5px' }}>
                                    {advancedOptions.temperature} 
                                    {advancedOptions.temperature <= 0.3 ? " (More precise)" : 
                                     advancedOptions.temperature >= 0.8 ? " (More creative)" : ""}
                                </div>
                            </div>
                            <div className="form-group" style={{ flex: '1', minWidth: '150px' }}>
                                <label className="form-label">
                                    <input 
                                        type="checkbox"
                                        checked={includeScene}
                                        onChange={() => setIncludeScene(!includeScene)}
                                        style={{ marginRight: '5px' }}
                                    />
                                    Include Scene Data
                                </label>
                                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
                                    Provides the current scene information to the AI
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="command-input">
                    <textarea 
                        className="command-textarea"
                        placeholder="Describe what you want to create in Blender. For example: 'Create a red cube at the origin'"
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                        rows={5}
                    ></textarea>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '5px' }}>
                            <i className="fas fa-lightbulb" style={{ marginRight: '5px' }}></i>
                            Try these examples:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                            {predefinedCommands.map((cmd, index) => (
                                <button 
                                    key={index} 
                                    className="btn btn-secondary"
                                    style={{ fontSize: '0.8rem', padding: '5px 10px' }}
                                    onClick={() => setCommand(cmd)}
                                >
                                    {cmd}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="command-buttons">
                        <button 
                            className="btn btn-primary"
                            onClick={handleExecute}
                            disabled={isLoading || !command.trim()}
                        >
                            {isLoading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-play"></i>
                                    Execute
                                </>
                            )}
                        </button>
                        <button 
                            className="btn btn-secondary"
                            onClick={() => setCommand('')}
                            disabled={isLoading || !command.trim()}
                        >
                            <i className="fas fa-times"></i>
                            Clear
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}; 