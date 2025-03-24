import React, { useState } from 'react';
import { Image, View, StyleSheet } from 'react-native';
import Logger from '../utils/Logger';

/**
 * SafeImageComponent provides error-resistant image loading
 * to prevent app crashes due to image loading failures
 * 
 * @param {Object} props - Component props
 * @param {any} props.source - Image source (require or uri)
 * @param {Object} props.style - Style for the image
 * @param {string} props.resizeMode - Image resize mode
 * @param {Function} props.onError - Optional callback for error handling
 * @param {Object} props.fallbackSource - Optional fallback image to show on error
 * @param {Object} props.containerStyle - Optional style for the container
 */
const SafeImageComponent = ({
  source,
  style,
  resizeMode = 'contain',
  onError,
  fallbackSource,
  containerStyle,
  ...otherProps
}) => {
  const [hasError, setHasError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const handleError = (error) => {
    const errorMessage = error?.nativeEvent?.error || 'Unknown image error';
    Logger.warn(`Image load error: ${errorMessage}`);
    setHasError(true);
    
    if (onError) {
      try {
        onError(error);
      } catch (callbackError) {
        Logger.error('Error in image onError callback', callbackError);
      }
    }
  };
  
  const handleLoad = () => {
    setImageLoaded(true);
  };
  
  // If we have an error and a fallback source, show the fallback
  const imageSource = hasError && fallbackSource ? fallbackSource : source;
  
  // Safely render the image with error handling
  try {
    return (
      <View style={[styles.container, containerStyle]}>
        <Image
          source={imageSource}
          style={[
            styles.image,
            style,
            !imageLoaded && styles.hidden
          ]}
          resizeMode={resizeMode}
          onError={handleError}
          onLoad={handleLoad}
          {...otherProps}
        />
      </View>
    );
  } catch (error) {
    // Catch any synchronous errors during render
    Logger.error('Critical error rendering image', error);
    
    // Return empty view as fallback
    return <View style={[styles.container, containerStyle]} />;
  }
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  hidden: {
    opacity: 0,
  },
});

export default SafeImageComponent;
