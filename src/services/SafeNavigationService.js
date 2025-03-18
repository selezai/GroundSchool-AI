import { router } from 'expo-router';
import Logger from '../utils/Logger';

// Reference to the drawer navigator instance
let drawerNavigatorRef = null;

/**
 * SafeNavigationService provides a wrapper around navigation functions
 * to prevent crashes from navigation-related errors
 */
class SafeNavigationService {
  /**
   * Navigate to a screen safely
   * @param {string} route - The route to navigate to
   * @param {Object} params - Optional parameters to pass to the route
   * @returns {boolean} - Whether the navigation was successful
   */
  navigate(route, params = {}) {
    try {
      if (!route) {
        Logger.warn('SafeNavigationService: Attempted to navigate with empty route');
        return false;
      }
      
      // Clean route format
      const cleanRoute = route.startsWith('/') ? route : `/${route}`;
      
      Logger.debug(`SafeNavigationService: Navigating to ${cleanRoute}`);
      router.push({
        pathname: cleanRoute,
        params
      });
      return true;
    } catch (error) {
      Logger.error(`SafeNavigationService: Navigation error to ${route}`, error);
      return false;
    }
  }
  
  /**
   * Replace the current screen safely
   * @param {string} route - The route to replace with
   * @param {Object} params - Optional parameters to pass to the route
   * @returns {boolean} - Whether the navigation was successful
   */
  replace(route, params = {}) {
    try {
      if (!route) {
        Logger.warn('SafeNavigationService: Attempted to replace with empty route');
        return false;
      }
      
      // Clean route format
      const cleanRoute = route.startsWith('/') ? route : `/${route}`;
      
      Logger.debug(`SafeNavigationService: Replacing with ${cleanRoute}`);
      router.replace({
        pathname: cleanRoute,
        params
      });
      return true;
    } catch (error) {
      Logger.error(`SafeNavigationService: Replace error for ${route}`, error);
      return false;
    }
  }
  
  /**
   * Go back safely
   * @returns {boolean} - Whether the navigation was successful
   */
  goBack() {
    try {
      Logger.debug('SafeNavigationService: Going back');
      router.back();
      return true;
    } catch (error) {
      Logger.error('SafeNavigationService: Error going back', error);
      
      // Fallback to home if back fails
      try {
        router.replace('/');
        return true;
      } catch (innerError) {
        Logger.error('SafeNavigationService: Critical navigation failure', innerError);
        return false;
      }
    }
  }
  
  /**
   * Reset navigation state and go to a route
   * @param {string} route - The route to reset to
   * @returns {boolean} - Whether the reset was successful
   */
  reset(route = '/') {
    try {
      Logger.debug(`SafeNavigationService: Resetting to ${route}`);
      router.replace(route);
      return true;
    } catch (error) {
      Logger.error(`SafeNavigationService: Reset error to ${route}`, error);
      return false;
    }
  }
  
  /**
   * Set the drawer navigator reference
   * @param {Object} ref - The drawer navigator reference
   */
  setDrawerNavigator(ref) {
    if (ref) {
      drawerNavigatorRef = ref;
      Logger.debug('SafeNavigationService: Drawer navigator reference set');
    }
  }
  
  /**
   * Open the drawer safely
   * @returns {boolean} - Whether the operation was successful
   */
  openDrawer() {
    try {
      if (drawerNavigatorRef?.openDrawer) {
        Logger.debug('SafeNavigationService: Opening drawer');
        drawerNavigatorRef.openDrawer();
        return true;
      } else {
        Logger.warn('SafeNavigationService: Drawer navigator not available');
        return false;
      }
    } catch (error) {
      Logger.error('SafeNavigationService: Error opening drawer', error);
      return false;
    }
  }
  
  /**
   * Close the drawer safely
   * @returns {boolean} - Whether the operation was successful
   */
  closeDrawer() {
    try {
      if (drawerNavigatorRef?.closeDrawer) {
        Logger.debug('SafeNavigationService: Closing drawer');
        drawerNavigatorRef.closeDrawer();
        return true;
      } else {
        Logger.warn('SafeNavigationService: Drawer navigator not available');
        return false;
      }
    } catch (error) {
      Logger.error('SafeNavigationService: Error closing drawer', error);
      return false;
    }
  }
}

// Export a singleton instance
const safeNavigation = new SafeNavigationService();
export default safeNavigation;
