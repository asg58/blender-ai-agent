// Main App Component
const App = () => {
    // State
    const [activeTab, setActiveTab] = React.useState('commandCenter');
    const [sidebarOpen, setSidebarOpen] = React.useState(true);
    const [isConnected, setIsConnected] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const [code, setCode] = React.useState('');
    const [output, setOutput] = React.useState(null);
    const [history, setHistory] = React.useState([]);
    const [sceneData, setSceneData] = React.useState(null);
    const [settings, setSettings] = React.useState({
        blenderWsUrl: 'ws://localhost:9877',
        apiUrl: 'http://localhost:8000',
    });
    
    // WebSocket connection reference
    const wsRef = React.useRef(null);
    
    // Connect to the WebSocket server
    const connectToWebSocketServer = React.useCallback(() => {
        setIsConnected(false);
        
        try {
            // Create WebSocket connection
            const socket = new WebSocket(settings.blenderWsUrl);
            
            // Connection opened
            socket.addEventListener('open', (event) => {
                console.log('Connected to Blender WebSocket Server');
                setIsConnected(true);
            });
            
            // Listen for messages
            socket.addEventListener('message', (event) => {
                const data = JSON.parse(event.data);
                console.log('Message from server:', data);
                
                if (data.error) {
                    setOutput({ error: data.error });
                } else if (data.result) {
                    setOutput({ result: data.result });
                }
                
                setIsLoading(false);
            });
            
            // Listen for errors
            socket.addEventListener('error', (event) => {
                console.error('WebSocket error:', event);
                setIsConnected(false);
                setOutput({ error: 'Connection error. Please check if the WebSocket server is running.' });
                setIsLoading(false);
            });
            
            // Connection closed
            socket.addEventListener('close', (event) => {
                console.log('Connection closed:', event);
                setIsConnected(false);
                setIsLoading(false);
            });
            
            wsRef.current = socket;
        } catch (error) {
            console.error('Failed to connect:', error);
            setIsConnected(false);
            setOutput({ error: `Failed to connect: ${error.message}` });
            setIsLoading(false);
        }
    }, [settings.blenderWsUrl]);
    
    // Connect to WebSocket on component mount
    React.useEffect(() => {
        connectToWebSocketServer();
        
        // Cleanup on unmount
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [connectToWebSocketServer]);
    
    // Handle command execution
    const handleExecuteCommand = (commandData) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            setOutput({ error: 'WebSocket connection is not open. Please reconnect.' });
            return;
        }
        
        setIsLoading(true);
        
        // Add to history
        setHistory(prev => [
            {
                id: Date.now(),
                prompt: commandData.command,
                timestamp: new Date().toISOString()
            },
            ...prev
        ]);
        
        // Send to WebSocket server
        wsRef.current.send(JSON.stringify({
            command: 'execute_code',
            params: {
                code: `
import bpy

# Create a red cube
bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, 0))
cube = bpy.context.active_object
cube.name = "RedCube"

# Create a red material
mat = bpy.data.materials.new(name="Red_Material")
mat.use_nodes = True
mat.diffuse_color = (1, 0, 0, 1)  # RGBA (Red)

# Assign the material to the cube
if cube.data.materials:
    cube.data.materials[0] = mat
else:
    cube.data.materials.append(mat)

print("Red cube created successfully!")
result = "Red cube created at the origin"
`
            }
        }));
        
        // In a real app, we would wait for the AI to generate code
        // For demo purposes, set a dummy code after a delay
        setTimeout(() => {
            setCode(`import bpy

# Create a red cube
bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, 0))
cube = bpy.context.active_object
cube.name = "RedCube"

# Create a red material
mat = bpy.data.materials.new(name="Red_Material")
mat.use_nodes = True
mat.diffuse_color = (1, 0, 0, 1)  # RGBA (Red)

# Assign the material to the cube
if cube.data.materials:
    cube.data.materials[0] = mat
else:
    cube.data.materials.append(mat)

print("Red cube created successfully!")
result = "Red cube created at the origin"
`);
        }, 1000);
    };
    
    // Handle direct code execution
    const handleExecuteCode = (codeToExecute) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            setOutput({ error: 'WebSocket connection is not open. Please reconnect.' });
            return;
        }
        
        setIsLoading(true);
        
        // Send to WebSocket server
        wsRef.current.send(JSON.stringify({
            command: 'execute_code',
            params: {
                code: codeToExecute
            }
        }));
    };
    
    // Toggle sidebar on mobile
    const toggleSidebar = () => {
        setSidebarOpen(prev => !prev);
    };
    
    // Render component based on active tab
    const renderActiveComponent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div>
                        <h1>Dashboard</h1>
                        <p>Overview of recent activity and quick actions.</p>
                    </div>
                );
            
            case 'commandCenter':
                return (
                    <div>
                        <CommandInput onExecute={handleExecuteCommand} isLoading={isLoading} />
                        <div className="row">
                            <div className="col-md-6">
                                <CodeEditor 
                                    code={code} 
                                    onCodeChange={setCode} 
                                    onExecute={handleExecuteCode}
                                    isLoading={isLoading}
                                />
                            </div>
                            <div className="col-md-6">
                                <ExecutionOutput output={output} />
                            </div>
                        </div>
                    </div>
                );
            
            case 'templates':
                return (
                    <div>
                        <h1>Templates</h1>
                        <p>Choose from pre-made templates.</p>
                    </div>
                );
            
            case 'history':
                return (
                    <div>
                        <h1>Command History</h1>
                        <ul className="history-list">
                            {history.map(item => (
                                <li key={item.id} className="history-item">
                                    <p className="history-prompt">{item.prompt}</p>
                                    <span className="history-time">
                                        {new Date(item.timestamp).toLocaleTimeString()}
                                    </span>
                                </li>
                            ))}
                            {history.length === 0 && (
                                <li className="history-item" style={{ justifyContent: 'center' }}>
                                    <p>No command history yet</p>
                                </li>
                            )}
                        </ul>
                    </div>
                );
            
            case 'scene':
                return (
                    <div>
                        <h1>Scene Viewer</h1>
                        <div className="scene-viewer">
                            <p>3D Scene Viewer (Coming Soon)</p>
                        </div>
                    </div>
                );
            
            case 'settings':
                return (
                    <div>
                        <h1>Settings</h1>
                        <div className="card">
                            <div className="card-header">
                                <h2 className="card-title">Connection Settings</h2>
                            </div>
                            <div className="card-body">
                                <div className="settings-form">
                                    <div className="form-group">
                                        <label className="form-label">Blender WebSocket URL</label>
                                        <input 
                                            type="text" 
                                            className="form-control"
                                            value={settings.blenderWsUrl}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                blenderWsUrl: e.target.value
                                            })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">API URL</label>
                                        <input 
                                            type="text" 
                                            className="form-control"
                                            value={settings.apiUrl}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                apiUrl: e.target.value
                                            })}
                                        />
                                    </div>
                                    <button 
                                        className="btn btn-primary"
                                        onClick={connectToWebSocketServer}
                                    >
                                        <i className="fas fa-sync"></i>
                                        Reconnect
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            
            default:
                return (
                    <div>
                        <h1>Page Not Found</h1>
                        <p>The requested page does not exist.</p>
                    </div>
                );
        }
    };
    
    return (
        <div className="app-container">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="main-content">
                <Header toggleSidebar={toggleSidebar} />
                <div className="container-fluid">
                    {renderActiveComponent()}
                </div>
            </div>
        </div>
    );
};

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />); 