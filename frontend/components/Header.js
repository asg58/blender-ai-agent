class Header extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentTime: new Date().toLocaleTimeString(),
      connectionStatus: 'Disconnected',
      statusClass: 'danger'
    };
  }

  componentDidMount() {
    // Update clock every second
    this.clockInterval = setInterval(() => {
      this.setState({
        currentTime: new Date().toLocaleTimeString()
      });
    }, 1000);

    // Simulate connection status change
    // In a real application, this would be based on actual WebSocket connection status
    setTimeout(() => {
      this.setState({
        connectionStatus: 'Connected',
        statusClass: 'success'
      });
    }, 2000);

    // Add event listener for the connection status from the main app
    window.addEventListener('connectionStatusChanged', (e) => {
      this.setState({
        connectionStatus: e.detail.status,
        statusClass: e.detail.status === 'Connected' ? 'success' : 'danger'
      });
    });
  }

  componentWillUnmount() {
    clearInterval(this.clockInterval);
    window.removeEventListener('connectionStatusChanged', this.handleConnectionChange);
  }

  render() {
    return (
      <header className="header">
        <div className="logo">
          <img src="./img/logo.svg" alt="Blender AI Agent" />
          <h1>Blender AI Agent</h1>
        </div>
        
        <div className="header-center">
          <div className="connection-status">
            <span className={`status-indicator ${this.state.statusClass}`}></span>
            <span className="status-text">{this.state.connectionStatus} to Blender</span>
          </div>
        </div>
        
        <div className="header-right">
          <div className="current-time">{this.state.currentTime}</div>
          <div className="user-menu">
            <div className="user-avatar">AB</div>
            <div className="user-dropdown">
              <a href="#settings">Settings</a>
              <a href="#help">Help</a>
              <a href="#logout">Logout</a>
            </div>
          </div>
        </div>
      </header>
    );
  }
}

// Additional CSS for header that might be missing from main CSS
const headerStyle = document.createElement('style');
headerStyle.textContent = `
  .header-center {
    display: flex;
    align-items: center;
  }
  
  .connection-status {
    display: flex;
    align-items: center;
    padding: 5px 10px;
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 20px;
  }
  
  .status-indicator {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-right: 8px;
  }
  
  .status-indicator.success {
    background-color: var(--success-color);
  }
  
  .status-indicator.danger {
    background-color: var(--danger-color);
  }
  
  .header-right {
    display: flex;
    align-items: center;
    gap: 20px;
  }
  
  .user-menu {
    position: relative;
    cursor: pointer;
  }
  
  .user-avatar {
    width: 36px;
    height: 36px;
    background-color: var(--primary-color);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
  }
  
  .user-dropdown {
    position: absolute;
    right: 0;
    top: 100%;
    background: white;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    border-radius: var(--border-radius);
    min-width: 150px;
    z-index: 100;
    display: none;
  }
  
  .user-menu:hover .user-dropdown {
    display: block;
  }
  
  .user-dropdown a {
    display: block;
    padding: 10px 15px;
    color: var(--dark-color);
    text-decoration: none;
    border-bottom: 1px solid #eee;
  }
  
  .user-dropdown a:hover {
    background-color: #f5f5f5;
  }
  
  .user-dropdown a:last-child {
    border-bottom: none;
  }
`;
document.head.appendChild(headerStyle); 