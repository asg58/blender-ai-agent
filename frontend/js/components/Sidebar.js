const Sidebar = ({ activeTab, setActiveTab }) => {
    const navItems = [
        { id: 'dashboard', icon: 'tachometer-alt', label: 'Dashboard' },
        { id: 'commandCenter', icon: 'terminal', label: 'Command Center' },
        { id: 'templates', icon: 'th-large', label: 'Templates' },
        { id: 'history', icon: 'history', label: 'History' },
        { id: 'scene', icon: 'cube', label: 'Scene Viewer' },
        { id: 'settings', icon: 'cog', label: 'Settings' }
    ];
    
    return (
        <div className="sidebar">
            <div className="sidebar-logo">
                <img src="img/blender-logo.png" alt="Blender Logo" />
                <h1>Blender AI Agent</h1>
            </div>
            
            <nav className="sidebar-nav">
                {navItems.map(item => (
                    <a 
                        key={item.id}
                        href={`#${item.id}`}
                        className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
                        onClick={(e) => {
                            e.preventDefault();
                            setActiveTab(item.id);
                        }}
                    >
                        <i className={`fas fa-${item.icon}`}></i>
                        <span>{item.label}</span>
                    </a>
                ))}
            </nav>
            
            <div style={{ padding: '20px', marginTop: 'auto' }}>
                <div style={{ 
                    fontSize: '0.8rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    textAlign: 'center'
                }}>
                    <p>Blender AI Agent Pro v1.0</p>
                    <p>© 2025 All Rights Reserved</p>
                </div>
            </div>
        </div>
    );
}; 