import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FableEditor } from '../src/react/FableEditor';

describe('FableEditor React wrapper — controlled value sync', () => {
  it('does not overwrite the DOM while the editor is focused, even if value diverges from the last emitted content', () => {
    function Harness() {
      const [value, setValue] = React.useState('<p>initial</p>');
      return (
        <div>
          <FableEditor value={value} onChange={setValue} />
          <button onClick={() => setValue('<p>externally replaced</p>')}>external-update</button>
        </div>
      );
    }
    render(<Harness />);
    const ed = document.querySelector('.earea') as HTMLElement;
    expect(ed).toBeTruthy();

    // Simulate the user focusing/typing inside the editor.
    ed.focus();
    fireEvent.focus(ed);

    // An external value change arrives while the user is still focused (e.g. the
    // reporter's app re-derives `value` from something other than a pure passthrough).
    fireEvent.click(screen.getByText('external-update'));

    // The DOM must NOT have been clobbered mid-edit — the caret-destroying
    // setContent() call should have been deferred.
    expect(ed.innerHTML).toContain('initial');
    expect(ed.innerHTML).not.toContain('externally replaced');

    // Once focus leaves the editor, the deferred external value is applied.
    fireEvent.focusOut(ed, { relatedTarget: document.body });
    expect(ed.innerHTML).toContain('externally replaced');
  });

  it('still applies external value updates immediately when the editor is not focused', () => {
    function Harness() {
      const [value, setValue] = React.useState('<p>initial</p>');
      return (
        <div>
          <FableEditor value={value} onChange={setValue} />
          <button onClick={() => setValue('<p>replaced</p>')}>external-update</button>
        </div>
      );
    }
    render(<Harness />);
    const ed = document.querySelector('.earea') as HTMLElement;
    fireEvent.click(screen.getByText('external-update'));
    expect(ed.innerHTML).toContain('replaced');
  });
});
