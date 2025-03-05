import React from 'react';
import renderer, { act } from 'react-test-renderer';
import ProgressBar from '../ProgressBar';

describe('ProgressBar Component', () => {
  it('renders correctly with default props', () => {
    let tree;
    act(() => {
      tree = renderer.create(
        <ProgressBar current={5} total={10} />
      ).toJSON();
    });
    expect(tree).toMatchSnapshot();
  });

  it('renders correctly at 0%', () => {
    let tree;
    act(() => {
      tree = renderer.create(
        <ProgressBar current={0} total={10} />
      ).toJSON();
    });
    expect(tree).toMatchSnapshot();
  });

  it('renders correctly at 100%', () => {
    let tree;
    act(() => {
      tree = renderer.create(
        <ProgressBar current={10} total={10} />
      ).toJSON();
    });
    expect(tree).toMatchSnapshot();
  });

  it('renders without percentage text when showPercentage is false', () => {
    let tree;
    act(() => {
      tree = renderer.create(
        <ProgressBar current={5} total={10} showPercentage={false} />
      ).toJSON();
    });
    expect(tree).toMatchSnapshot();
  });
});
