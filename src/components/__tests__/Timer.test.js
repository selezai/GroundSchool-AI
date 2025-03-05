import React from 'react';
import renderer, { act } from 'react-test-renderer';
import Timer from '../Timer';

jest.useFakeTimers();

describe('Timer Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('renders correctly with minutes and seconds', () => {
    let tree;
    act(() => {
      tree = renderer.create(
        <Timer duration={300} onTimeUp={() => {}} />
      ).toJSON();
    });
    expect(tree).toMatchSnapshot();
  });

  it('renders correctly with hours format', () => {
    let tree;
    act(() => {
      tree = renderer.create(
        <Timer duration={3600} showHours={true} onTimeUp={() => {}} />
      ).toJSON();
    });
    expect(tree).toMatchSnapshot();
  });

  it('shows warning color when time is under 5 minutes', () => {
    let tree;
    act(() => {
      tree = renderer.create(
        <Timer duration={299} onTimeUp={() => {}} />
      ).toJSON();
    });
    expect(tree).toMatchSnapshot();
  });

  it('shows danger color when time is under 1 minute', () => {
    let tree;
    act(() => {
      tree = renderer.create(
        <Timer duration={59} onTimeUp={() => {}} />
      ).toJSON();
    });
    expect(tree).toMatchSnapshot();
  });

  it('calls onTimeUp when timer reaches zero', () => {
    const onTimeUp = jest.fn();
    act(() => {
      renderer.create(
        <Timer duration={2} onTimeUp={onTimeUp} />
      );
    });

    // Fast-forward until all timers have been executed
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(onTimeUp).toHaveBeenCalled();
  });

  it('stops counting when isRunning is false', () => {
    let component;
    act(() => {
      component = renderer.create(
        <Timer duration={10} isRunning={false} onTimeUp={() => {}} />
      );
    });

    const initialTime = component.root.findByProps({ testID: 'timer-text' }).props.children;

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    const timeAfterDelay = component.root.findByProps({ testID: 'timer-text' }).props.children;
    expect(timeAfterDelay).toBe(initialTime);
  });
});
