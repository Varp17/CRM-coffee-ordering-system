/**
 * Sidebar.jsx — Enterprise Admin Sidebar
 * Features: Accordion groups, collapse/expand, search, pinned items, tooltips
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Coffee, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  LogOut, Search, Pin, PinOff, X, Star
} from 'lucide-react';
import useSidebarStore from '../../store/useSidebarStore';
import { useAuthStore } from '../../store/useAuthStore';
import { MENU_CONFIG, ALL_MENU_ITEMS, filterByRole, findGroupByPath } from '../../constants/menuConfig';
import Logo from '../../components/Logo/Logo';
import './Sidebar.css';

// ─────────────────────────────────────────────────────────────────────────────
// TOOLTIP (shown when sidebar is collapsed)
// ─────────────────────────────────────────────────────────────────────────────
const Tooltip = ({ label, badge, children }) => (
  <div className="sb-tooltip-wrap">
    {children}
    <div className="sb-tooltip">
      {label}
      {badge > 0 && <span className="sb-tooltip-badge">{badge}</span>}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE MENU ITEM
// ─────────────────────────────────────────────────────────────────────────────
const SidebarItem = React.memo(({ item, collapsed, onNavigate }) => {
  const badges = useSidebarStore((s) => s.badges);
  const pinnedItems = useSidebarStore((s) => s.pinnedItems);
  const togglePin = useSidebarStore((s) => s.togglePin);
  const visit = useSidebarStore((s) => s.visit);

  const badge = item.badgeKey ? badges[item.badgeKey] || 0 : 0;
  const isPinned = pinnedItems.includes(item.key);

  const handleClick = useCallback(() => {
    visit(item);
    onNavigate?.();
  }, [item, visit, onNavigate]);

  const handlePinClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    togglePin(item.key);
  }, [item.key, togglePin]);

  const content = (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={handleClick}
      className={({ isActive }) => `sb-item ${isActive ? 'active' : ''}`}
      aria-label={item.label}
    >
      <span className="sb-item-icon">
        <item.icon size={20} strokeWidth={2} />
        {badge > 0 && <span className="sb-badge">{badge > 99 ? '99+' : badge}</span>}
      </span>
      {!collapsed && (
        <>
          <span className="sb-item-label">{item.label}</span>
          {/* <button
            className={`sb-pin-btn ${isPinned ? 'pinned' : ''}`}
            onClick={handlePinClick}
            aria-label={isPinned ? `Unpin ${item.label}` : `Pin ${item.label}`}
            tabIndex={-1}
          >
            {isPinned ? <PinOff size={11} /> : <Pin size={11} />}
          </button> */}
        </>
      )}
    </NavLink>
  );

  if (collapsed) {
    return <Tooltip label={item.label} badge={badge}>{content}</Tooltip>;
  }

  return content;
});
SidebarItem.displayName = 'SidebarItem';

// ─────────────────────────────────────────────────────────────────────────────
// ACCORDION GROUP
// ─────────────────────────────────────────────────────────────────────────────
const SidebarGroup = React.memo(({ group, collapsed, onNavigate }) => {
  const expandedGroups = useSidebarStore((s) => s.expandedGroups);
  const toggleGroup = useSidebarStore((s) => s.toggleGroup);
  const isOpen = expandedGroups.includes(group.key);

  const handleGroupClick = useCallback(() => {
    if (!collapsed) toggleGroup(group.key);
  }, [collapsed, group.key, toggleGroup]);

  const groupContent = (
    <div className={`sb-group ${isOpen && !collapsed ? 'open' : ''}`}>
      <button
        className="sb-group-header"
        onClick={handleGroupClick}
        aria-expanded={isOpen}
        aria-label={group.label}
        title={collapsed ? group.label : undefined}
      >
        <span className="sb-group-icon">
          <group.icon size={14} strokeWidth={2} />
        </span>
        {!collapsed && (
          <>
            <span className="sb-group-label">{group.label.toUpperCase()}</span>
            <span className="sb-group-chevron">
              {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </span>
          </>
        )}
      </button>

      {!collapsed && isOpen && (
        <div className="sb-group-items" role="list">
          {group.items.map((item) => (
            <SidebarItem
              key={item.key}
              item={item}
              collapsed={false}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}

      {/* In collapsed mode, show items as icons (no accordion) */}
      {collapsed && (
        <div className="sb-group-items-collapsed" role="list">
          {group.items.map((item) => (
            <SidebarItem
              key={item.key}
              item={item}
              collapsed={true}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );

  return groupContent;
});
SidebarGroup.displayName = 'SidebarGroup';

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH OVERLAY
// ─────────────────────────────────────────────────────────────────────────────
const SidebarSearch = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const visit = useSidebarStore((s) => s.visit);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return ALL_MENU_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.groupLabel.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [query]);

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter' && results[selected]) {
      visit(results[selected]);
      navigate(results[selected].to);
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="sb-search-overlay" role="dialog" aria-label="Search navigation">
      <div className="sb-search-backdrop" onClick={onClose} />
      <div className="sb-search-panel">
        <div className="sb-search-input-row">
          <Search size={16} className="sb-search-icon" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pages… (e.g. Orders, Production)"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
            onKeyDown={handleKey}
            className="sb-search-input"
            aria-label="Search navigation"
          />
          <button className="sb-search-close" onClick={onClose} aria-label="Close search">
            <X size={14} />
          </button>
        </div>

        {results.length > 0 && (
          <div className="sb-search-results" role="listbox">
            {results.map((item, idx) => (
              <button
                key={item.key}
                className={`sb-search-result ${idx === selected ? 'selected' : ''}`}
                onClick={() => { visit(item); navigate(item.to); onClose(); }}
                role="option"
                aria-selected={idx === selected}
              >
                <span className="sb-search-result-icon">
                  <item.icon size={14} strokeWidth={1.8} />
                </span>
                <span className="sb-search-result-label">{item.label}</span>
                <span className="sb-search-result-group">{item.groupLabel}</span>
              </button>
            ))}
          </div>
        )}

        {query && results.length === 0 && (
          <div className="sb-search-empty">No pages found for "{query}"</div>
        )}

        {!query && (
          <div className="sb-search-hint">
            Type to search · ↑↓ to navigate · Enter to go · Esc to close
          </div>
        )}
      </div>
    </div>
  );
};



// ─────────────────────────────────────────────────────────────────────────────
// PINNED ITEMS SECTION
// ─────────────────────────────────────────────────────────────────────────────
const PinnedItems = ({ collapsed, onNavigate }) => {
  const pinnedItems = useSidebarStore((s) => s.pinnedItems);
  const visit = useSidebarStore((s) => s.visit);

  if (!pinnedItems.length) return null;

  const items = pinnedItems
    .map((key) => ALL_MENU_ITEMS.find((m) => m.key === key))
    .filter(Boolean);

  if (!items.length) return null;

  return (
    <div className="sb-pinned-section">
      {!collapsed && (
        <span className="sb-recent-label">
          <Star size={10} style={{ marginRight: 4 }} />
          Pinned
        </span>
      )}
      {items.map((item) => {
        if (collapsed) {
          return (
            <Tooltip key={item.key} label={item.label} badge={0}>
              <NavLink
                to={item.to}
                end={item.end}
                onClick={() => { visit(item); onNavigate?.(); }}
                className={({ isActive }) => `sb-item sb-pinned-item ${isActive ? 'active' : ''}`}
              >
                <span className="sb-item-icon">
                  <item.icon size={15} strokeWidth={1.8} />
                </span>
              </NavLink>
            </Tooltip>
          );
        }
        return (
          <NavLink
            key={item.key}
            to={item.to}
            end={item.end}
            onClick={() => { visit(item); onNavigate?.(); }}
            className={({ isActive }) => `sb-item sb-pinned-item ${isActive ? 'active' : ''}`}
          >
            <span className="sb-item-icon">
              <item.icon size={15} strokeWidth={1.8} />
            </span>
            <span className="sb-item-label">{item.label}</span>
          </NavLink>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────
const Sidebar = ({ onNavigate }) => {
  const mode = useSidebarStore((s) => s.mode);
  const toggleSidebar = useSidebarStore((s) => s.toggleSidebar);
  const searchOpen = useSidebarStore((s) => s.searchOpen);
  const openSearch = useSidebarStore((s) => s.openSearch);
  const closeSearch = useSidebarStore((s) => s.closeSearch);
  const expandGroup = useSidebarStore((s) => s.expandGroup);

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const location = useLocation();
  const navigate = useNavigate();

  const collapsed = mode === 'collapsed';

  // Auto-expand the group that contains the current route
  useEffect(() => {
    const group = findGroupByPath(location.pathname);
    if (group && !group.isSingle) expandGroup(group.key);
  }, [location.pathname, expandGroup]);

  // Keyboard shortcut: Ctrl+K / Cmd+K to open search
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openSearch]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/');
  }, [logout, navigate]);

  // Get role-filtered menu
  const filteredMenu = useMemo(
    () => filterByRole(user?.role || 'admin', user?.permissions || []),
    [user?.role, user?.permissions]
  );

  return (
    <>
      <aside
        className={`sb-sidebar ${collapsed ? 'collapsed' : 'expanded'}`}
        role="navigation"
        aria-label="Admin navigation"
      >
        {/* ── Brand Header ── */}
        <div className="sb-brand">
          <button
            className="sb-brand-link"
            onClick={toggleSidebar}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <div className="sb-brand-icon">
              <Coffee size={16} strokeWidth={2.5} />
            </div>
            {!collapsed && (
              <div className="sb-brand-text" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Logo color="#007AFF" width={74} height="auto" style={{ marginBottom: 2 }} />
                <span className="sb-brand-tagline" style={{ fontFamily: "'Author', 'Inter', sans-serif" }}>Website CRM</span>
              </div>
            )}
          </button>

          <button
            className="sb-toggle"
            onClick={toggleSidebar}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>
        </div>

        {/* ── Search Trigger ── */}
        <div className="sb-search-trigger-wrap">
          {collapsed ? (
            <Tooltip label="Search (Ctrl+K)" badge={0}>
              <button
                className="sb-search-trigger collapsed"
                onClick={openSearch}
                aria-label="Open search"
              >
                <Search size={15} />
              </button>
            </Tooltip>
          ) : (
            <button
              className="sb-search-trigger"
              onClick={openSearch}
              aria-label="Open search (Ctrl+K)"
            >
              <Search size={13} />
              <span className="sb-search-trigger-label">Search pages…</span>
              <kbd className="sb-search-kbd">⌘K</kbd>
            </button>
          )}
        </div>

        {/* ── Nav Body ── */}
        <nav className="sb-nav" aria-label="Main navigation">
          {/* ── Main groups ── */}
          {filteredMenu.map((group) => {
            if (group.isSingle) {
              return (
                <div key={group.key} className="sb-single-item-wrap">
                  <SidebarItem
                    item={group}
                    collapsed={collapsed}
                    onNavigate={onNavigate}
                  />
                </div>
              );
            }
            return (
              <SidebarGroup
                key={group.key}
                group={group}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            );
          })}
        </nav>

        {/* ── Sidebar Footer ── */}
        <div className="sb-footer">
          <div className="sb-user-row">
            <div className="sb-user-avatar" title={user?.name}>
              {(user?.name || 'A').charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="sb-user-info">
                <span className="sb-user-name">{user?.name || 'Admin'}</span>
                <span className="sb-user-role">{user?.role?.replace('_', ' ') || 'Administrator'}</span>
              </div>
            )}
            <button
              className="sb-logout-btn"
              onClick={handleLogout}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* Search Overlay */}
      {searchOpen && <SidebarSearch onClose={closeSearch} />}
    </>
  );
};

export default Sidebar;
