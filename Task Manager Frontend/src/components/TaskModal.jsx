import { useState } from 'react';
import { X } from 'lucide-react';

export default function TaskModal({ isOpen, mode, task, onClose, onSubmit }) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [isCompleted, setIsCompleted] = useState(Boolean(task?.isCompleted));
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Task title is required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit({
        title: trimmedTitle,
        isCompleted,
      });
      onClose();
    } catch (submitError) {
      setError(submitError.message || 'Unable to save the task right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Task</p>
            <h3>{mode === 'edit' ? 'Edit task' : 'Create task'}</h3>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close task modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="task-form">
          <label className="field-label">
            <span>Title</span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Finish onboarding checklist"
              maxLength={120}
            />
          </label>

          <label className="checkbox-row" htmlFor="task-status">
            <input
              id="task-status"
              type="checkbox"
              checked={isCompleted}
              onChange={(event) => setIsCompleted(event.target.checked)}
            />
            <span>Mark as completed</span>
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <div className="modal-actions">
            <button type="button" className="button button-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button button-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update task' : 'Create task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
