const Header = ({ toggleSidebar }) => {
    return (
        <header className="header">
            <button className="mobile-menu-toggle" onClick={toggleSidebar}>
                <i className="fas fa-bars"></i>
            </button>
            <h1 className="header-title">Blender AI Agent Pro Dashboard</h1>
            <div className="header-controls">
                <div className="connection-status">
                    <span className="connection-indicator" style={{ 
                        display: 'inline-block',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: '#52b788',
                        marginRight: '5px'
                    }}></span>
                    <span>Connected to Blender</span>
                </div>
                <button className="btn btn-secondary btn-icon" title="Settings">
                    <i className="fas fa-cog"></i>
                </button>
                <button className="btn btn-secondary btn-icon" title="Help">
                    <i className="fas fa-question"></i>
                </button>
            </div>
        </header>
    );
}; 