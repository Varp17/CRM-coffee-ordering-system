import React, { useState, useEffect } from 'react';
import './Notifications.css';
import Button from '../../../components/Button/Button';
import Card from '../../../components/Card/Card';
import Input from '../../../components/Input/Input';
import { notificationService } from '../../../services/notifications';
import { unwrapList } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';

const Notifications = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  // Broadcast campaign states
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignBody, setCampaignBody] = useState('');
  const [campaignChannel, setCampaignChannel] = useState('WhatsApp');

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const res = await notificationService.getTemplates();
      const list = unwrapList(res);
      const mapped = list.map(t => ({
        ...t,
        active: t.is_active === 1 || t.is_active === true
      }));
      setTemplates(mapped);
      if (mapped.length > 0) {
        setSelectedTemplate(mapped[0]);
        setEditedContent(mapped[0].content);
      }
    } catch (err) {
      toast.error('Failed to load notification templates: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleSelectTemplate = (temp) => {
    setSelectedTemplate(temp);
    setEditedContent(temp.content);
    setIsEditing(false);
  };

  const handleToggleTemplate = async (id) => {
    try {
      const target = templates.find(t => t.id === id);
      if (!target) return;
      
      const newActiveState = target.active ? 0 : 1;
      await notificationService.updateTemplate(id, { is_active: newActiveState });
      
      toast.success(`Template ${newActiveState ? 'Enabled 🟢' : 'Disabled 🔴'}`);
      loadTemplates();
    } catch (err) {
      toast.error('Failed to toggle template status: ' + err.message);
    }
  };

  const handleSaveTemplate = async () => {
    try {
      await notificationService.updateTemplate(selectedTemplate.id, { content: editedContent });
      toast.success('Notification template updated successfully! 💬');
      setIsEditing(false);
      loadTemplates();
    } catch (err) {
      toast.error('Failed to update template content: ' + err.message);
    }
  };

  const handleLaunchCampaign = (e) => {
    e.preventDefault();
    if (!campaignTitle || !campaignBody) {
      toast.error('Please enter a campaign name and message content.');
      return;
    }

    toast.success(`Launching marketing broadcast "${campaignTitle}" to all registered Indian mobile numbers! 🚀`);
    setCampaignTitle('');
    setCampaignBody('');
  };

  // Helper to preview dynamic string
  const renderPreview = (txt) => {
    if (!txt) return '';
    return txt
      .replace(/{name}/g, 'Rahul Sharma')
      .replace(/{orderId}/g, 'ORD-1001')
      .replace(/{token}/g, 'DC-8930')
      .replace(/{trackingLink}/g, 'dcoffee.in/t/ord-1001');
  };

  if (isLoading && templates.length === 0) {
    return (
      <div className="notifications-view flex-center" style={{ height: '70vh' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading notification manager...</p>
      </div>
    );
  }

  return (
    <div className="notifications-view animate-fade-in">
      <div className="view-header">
        <div>
          <h2 className="section-title">💬 WhatsApp & Marketing Broadcasts</h2>
          <p className="section-subtitle">Configure real-time delivery alerts, SMS transaction hooks, and custom campaigns</p>
        </div>
      </div>

      <div className="notifications-layout-grid">
        {/* Left Side: Templates index */}
        <div className="templates-list-card ">
          <h3>Alert Triggers</h3>
          <div className="templates-stack">
            {templates.map(temp => (
              <div
                key={temp.id}
                className={`template-item-row ${selectedTemplate?.id === temp.id ? 'active' : ''}`}
                onClick={() => handleSelectTemplate(temp)}
              >
                <div className="item-row-left">
                  <span className={`channel-badge ${temp.channel.toLowerCase()}`}>
                    {temp.channel === 'WhatsApp' ? '💬' : temp.channel === 'SMS' ? '📱' : '✉️'} {temp.channel}
                  </span>
                  <strong>{temp.name}</strong>
                </div>
                <div className="item-row-right" onClick={(e) => e.stopPropagation()}>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={temp.active}
                      onChange={() => handleToggleTemplate(temp.id)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Template Customizer Workspace */}
        {selectedTemplate && (
          <div className="template-composer-panel ">
            <div className="composer-card-header">
              <h3>Configure Content: {selectedTemplate.name}</h3>
              {!isEditing ? (
                <Button variant="outline" onClick={() => setIsEditing(true)}>Edit Message Template 📝</Button>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button variant="outline" onClick={() => { setIsEditing(false); setEditedContent(selectedTemplate.content); }}>Cancel</Button>
                  <Button variant="primary" onClick={handleSaveTemplate}>Save Template 💾</Button>
                </div>
              )}
            </div>

            <div className="editor-grid">
              <div className="editor-area">
                <label className="editor-label">Raw Template Markup</label>
                <textarea
                  className="styled-textarea"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  disabled={!isEditing}
                  rows={5}
                />
                <span className="editor-tokens-hint">
                  Available parameters: <code>{'{name}'}</code>, <code>{'{orderId}'}</code>, <code>{'{token}'}</code>, <code>{'{trackingLink}'}</code>
                </span>
              </div>

              {/* Preview device mockup */}
              <div className="device-mockup-wrap">
                <label className="editor-label">Rendered Preview (Indian D2C Customer View)</label>
                <div className="phone-screen-mockup">
                  <div className="chat-bubble-header">
                    <span className="chat-avatar">☕</span>
                    <div className="chat-header-info">
                      <strong>Digital Coffee Live</strong>
                      <span>WhatsApp Verified Business</span>
                    </div>
                  </div>
                  <div className="chat-bubble-body">
                    <p>{renderPreview(editedContent)}</p>
                    <span className="chat-timestamp">14:32</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Campaign Broadcast Section */}
      <div className="campaign-broadcast-card  animate-slide-up">
        <h3>🚀 Broadcast Marketing Campaign</h3>
        <p className="campaign-subtitle">Send micro-batch promos, subscription benefits, or holiday collections announcements</p>

        <form className="campaign-form" onSubmit={handleLaunchCampaign}>
          <div className="campaign-input-group">
            <Input
              label="Campaign Name"
              placeholder="e.g. Summer Mango Cold Brew Promo"
              value={campaignTitle}
              onChange={(e) => setCampaignTitle(e.target.value)}
            />
            <div className="form-group select-group">
              <label className="input-label">Marketing Channel</label>
              <select
                className="styled-select"
                value={campaignChannel}
                onChange={(e) => setCampaignChannel(e.target.value)}
              >
                <option>WhatsApp</option>
                <option>SMS</option>
                <option>Email</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ margin: '1rem 0' }}>
            <label className="input-label">Marketing Message Body</label>
            <textarea
              className="styled-textarea"
              placeholder="Hi {name}! Treat yourself this summer with 20% off on cold brews..."
              value={campaignBody}
              onChange={(e) => setCampaignBody(e.target.value)}
              rows={4}
            />
          </div>

          <div className="campaign-actions">
            <Button variant="primary" type="submit" disabled={!campaignTitle || !campaignBody}>
              Trigger Broadcast to All Customers 📢
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Notifications;
