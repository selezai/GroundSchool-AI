/* global jest, describe, beforeEach, afterEach, it, expect, test */

import React from 'react';
import { Image } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import SafeImageComponent from '../SafeImageComponent';

// Mock Logger
jest.mock('../../utils/Logger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('SafeImageComponent', () => {
  const defaultProps = {
    source: { uri: 'https://example.com/image.jpg' },
    style: { width: 100, height: 100 },
  };

  beforeEach(() => {
    // Clear mock calls between tests
    jest.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    const tree = renderer.create(
      <SafeImageComponent {...defaultProps} />
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('handles image load success', () => {
    let component;
    act(() => {
      component = renderer.create(
        <SafeImageComponent {...defaultProps} />
      );
    });

    const image = component.root.findByType(Image);
    
    act(() => {
      image.props.onLoad();
    });

    expect(component.toJSON()).toMatchSnapshot();
  });

  it('handles image load error', () => {
    const onError = jest.fn();
    const fallbackSource = { uri: 'https://example.com/fallback.jpg' };
    let component;

    act(() => {
      component = renderer.create(
        <SafeImageComponent 
          {...defaultProps}
          onError={onError}
          fallbackSource={fallbackSource}
        />
      );
    });

    const image = component.root.findByType(Image);
    const error = { nativeEvent: { error: 'Failed to load image' } };

    act(() => {
      image.props.onError(error);
    });

    // Should call onError callback
    expect(onError).toHaveBeenCalledWith(error);
    
    // Should use fallback image
    expect(image.props.source).toBe(fallbackSource);
    
    expect(component.toJSON()).toMatchSnapshot();
  });

  it('handles error in onError callback', () => {
    const onError = jest.fn().mockImplementation(() => {
      throw new Error('Callback error');
    });

    let component;
    act(() => {
      component = renderer.create(
        <SafeImageComponent 
          {...defaultProps}
          onError={onError}
        />
      );
    });

    const image = component.root.findByType(Image);
    const error = { nativeEvent: { error: 'Failed to load image' } };

    act(() => {
      image.props.onError(error);
    });

    // Should still render despite callback error
    expect(component.toJSON()).toMatchSnapshot();
  });

  it('applies custom container style', () => {
    const containerStyle = { backgroundColor: 'red' };
    const tree = renderer.create(
      <SafeImageComponent 
        {...defaultProps}
        containerStyle={containerStyle}
      />
    ).toJSON();

    expect(tree.props.style).toContainEqual(containerStyle);
    expect(tree).toMatchSnapshot();
  });

  it('applies custom resize mode', () => {
    const resizeMode = 'cover';
    const component = renderer.create(
      <SafeImageComponent 
        {...defaultProps}
        resizeMode={resizeMode}
      />
    );

    const image = component.root.findByType(Image);
    expect(image.props.resizeMode).toBe(resizeMode);
    expect(component.toJSON()).toMatchSnapshot();
  });
});
