class Sidebar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collapsed: false,
      activeTab: 'history',
      history: [
        { id: 1, text: "Create a red cube", time: "10:23 AM" },
        { id: 2, text: "Scale it to 2x", time: "10:24 AM" },
        { id: 3, text: "Add a blue sphere", time: "10:26 AM" }
      ],
      favorites: [
        { id: 1, text: "Create default scene" },
        { id: 2, text: "Add rigged character" },
        { id: 3, text: "Setup lighting rig" }
      ]
    };
  }

  toggleSidebar = () => {
    this.setState(prevState => ({
      collapsed: !prevState.collapsed
    }));
  }

  setActiveTab = (tab) => {
    this.setState({ activeTab: tab });
  }

  renderContent() {
    const { activeTab, history, favorites } = this.state;
    
    if (activeTab === 'history') {
      return (
        <div className="sidebar-content">
          <h3>Command History</h3>
          <ul className="history-list">
            {history.map(item => (
              <li key={item.id} className="history-item">
                <div className="history-text">{item.text}</div>
                <div className="history-time">{item.time}</div>
                <div className="history-actions">
                  <button className="icon-button" title="Run again">
                    <i className="fas fa-play"></i>
                  </button>
                  <button className="icon-button" title="Add to favorites">
                    <i className="far fa-star"></i>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      );
    } else if (activeTab === 'favorites') {
      return (
        <div className="sidebar-content">
          <h3>Favorite Commands</h3>
          <ul className="favorites-list">
            {favorites.map(item => (
              <li key={item.id} className="favorite-item">
                <div className="favorite-text">{item.text}</div>
                <div className="favorite-actions">
                  <button className="icon-button" title="Run">
                    <i className="fas fa-play"></i>
                  </button>
                  <button className="icon-button" title="Remove from favorites">
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      );
    } else if (activeTab === 'docs') {
      return (
        <div className="sidebar-content">
          <h3>Documentation</h3>
          <div className="docs-search">
            <input type="text" placeholder="Search documentation..." />
            <button><i className="fas fa-search"></i></button>
          </div>
          <div className="docs-categories">
            <h4>Categories</h4>
            <ul>
              <li><a href="#modeling">Modeling</a></li>
              <li><a href="#materials">Materials & Shading</a></li>
              <li><a href="#animation">Animation</a></li>
              <li><a href="#rendering">Rendering</a></li>
              <li><a href="#physics">Physics & Simulation</a></li>
            </ul>
          </div>
        </div>
      );
    }
  }

  render() {
    const { collapsed, activeTab } = this.state;
    const sidebarClass = collapsed ? 'sidebar collapsed' : 'sidebar';
    
    return (
      <div className={sidebarClass}>
        <div className="sidebar-toggle" onClick={this.toggleSidebar}>
          <i className={collapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left'}></i>
        </div>
        
        <div className="sidebar-tabs">
          <button 
            className={activeTab === 'history' ? 'active' : ''} 
            onClick={() => this.setActiveTab('history')}
            title="History"
          >
            <i className="fas fa-history"></i>
            {!collapsed && <span>History</span>}
          </button>
          <button 
            className={activeTab === 'favorites' ? 'active' : ''} 
            onClick={() => this.setActiveTab('favorites')}
            title="Favorites"
          >
            <i className="fas fa-star"></i>
            {!collapsed && <span>Favorites</span>}
          </button>
          <button 
            className={activeTab === 'docs' ? 'active' : ''} 
            onClick={() => this.setActiveTab('docs')}
            title="Documentation"
          >
            <i className="fas fa-book"></i>
            {!collapsed && <span>Docs</span>}
          </button>
        </div>
        
        {!collapsed && this.renderContent()}
      </div>
    );
  }
}

// Additional CSS for sidebar that might be missing from main CSS
const sidebarStyle = document.createElement('style');
sidebarStyle.textContent = `
  .sidebar {
    width: 280px;
    transition: width 0.3s ease;
  }
  
  .sidebar.collapsed {
    width: 60px;
    overflow: hidden;
  }
  
  .sidebar-toggle {
    position: absolute;
    top: 15px;
    right: 10px;
    width: 24px;
    height: 24px;
    background: var(--light-bg-color);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    cursor: pointer;
    z-index: 10;
  }
  
  .sidebar-tabs {
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 15px 10px;
  }
  
  .sidebar-tabs button {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    border: none;
    background: none;
    border-radius: var(--border-radius);
    cursor: pointer;
    color: var(--text-color);
    text-align: left;
    font-weight: 500;
  }
  
  .sidebar-tabs button:hover {
    background: var(--hover-color);
  }
  
  .sidebar-tabs button.active {
    background: var(--primary-color);
    color: white;
  }
  
  .sidebar-tabs button i {
    width: 20px;
    text-align: center;
  }
  
  .sidebar-content {
    padding: 10px 15px;
  }
  
  .sidebar-content h3 {
    font-size: 1rem;
    margin-bottom: 15px;
    color: var(--dark-color);
  }
  
  .history-list, .favorites-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .history-item, .favorite-item {
    padding: 10px;
    border-radius: var(--border-radius);
    margin-bottom: 8px;
    background: var(--light-bg-color);
    position: relative;
  }
  
  .history-item:hover, .favorite-item:hover {
    background: var(--hover-color);
  }
  
  .history-text, .favorite-text {
    margin-bottom: 5px;
    word-break: break-word;
  }
  
  .history-time {
    font-size: 0.8rem;
    color: var(--text-secondary);
  }
  
  .history-actions, .favorite-actions {
    position: absolute;
    right: 10px;
    top: 10px;
    display: none;
  }
  
  .history-item:hover .history-actions,
  .favorite-item:hover .favorite-actions {
    display: flex;
    gap: 5px;
  }
  
  .icon-button {
    background: none;
    border: none;
    cursor: pointer;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .icon-button:hover {
    background: rgba(0, 0, 0, 0.1);
  }
  
  .docs-search {
    display: flex;
    margin-bottom: 15px;
  }
  
  .docs-search input {
    flex: 1;
    border: 1px solid #ddd;
    border-radius: var(--border-radius) 0 0 var(--border-radius);
    padding: 8px 12px;
    font-size: 0.9rem;
  }
  
  .docs-search button {
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: 0 var(--border-radius) var(--border-radius) 0;
    padding: 0 12px;
    cursor: pointer;
  }
  
  .docs-categories h4 {
    font-size: 0.9rem;
    margin-bottom: 10px;
  }
  
  .docs-categories ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .docs-categories ul li {
    margin-bottom: 8px;
  }
  
  .docs-categories ul li a {
    color: var(--primary-color);
    text-decoration: none;
    display: block;
    padding: 5px 0;
  }
  
  .docs-categories ul li a:hover {
    text-decoration: underline;
  }
`;
document.head.appendChild(sidebarStyle); 