(function (root, factory) {
  'use strict';

  if ( typeof module !== 'undefined' ) {
    module.exports = factory(root);
  } else {
    if ( root.define ) {
      root.define('$storage',factory);
    } else if ( root.angular ) {
        root.angular.module('jstools.storage', []).constant('$storage', factory() );
    } else if( !root.$storage ) {
      root.$storage = factory();
    }
  }

})(this, function (root) {
  'use strict';

  function extend (dest, src) {
    for( var key in src ) {
      dest[key] = src[key];
    }
  }

  // curring type checker
  function _isType (type) {
      return function (o) {
          return (typeof o === type);
      };
  }

  // curring instance checker
  function _instanceOf (_constructor) {
      return function (o) {
          return ( o instanceof _constructor );
      };
  }

  var _isString = _isType('string'),
      _isFunction = _instanceOf(Function),
      _isArray = _instanceOf(Array);

  var $storage = function (key, data, meta) {
      if( data !== undefined ) {
          $storage.setItem(key, data, meta);
          return this;
      } else {
          return $storage.getItem(key);
      }
  }, loopback = {}, listeners = {};

  $storage.setItem = function (key, data, meta){
      var newValue = { data: data },
          oldValue = localStorage.getItem(key) ? ( JSON.parse(localStorage.getItem(key)) || {} ) : {};

      extend( newValue, meta || {} );

      localStorage.setItem( key, JSON.stringify(newValue) );

      if( loopback[key] ) {
          $storage.trigger(key, newValue, oldValue);
      }

      return $storage;
  };

  $storage.getItem = function (key) {
      return (JSON.parse(localStorage.getItem(key)) || {}).data;
  };

  $storage.removeItem = function (key) {
      localStorage.removeItem(key);
      return $storage;
  };

  $storage.getMeta = function (key, metaKey) {
      if( metaKey === undefined ) {
          return (JSON.parse(localStorage.getItem(key)) || {});
      } else {
          return (JSON.parse(localStorage.getItem(key)) || {})[metaKey];
      }
  };

  $storage.loopback = function (key, value) {
      loopback[key] = ( value === undefined || value );
      return $storage;
  };

  $storage.on = function (key, listener, context) {
      if( _isString(key) && _isFunction(listener)  ) {
          listeners[key] = listeners[key] || [];
          listeners[key].push({ listener: listener, context: context });
      }
      return $storage;
  };

  $storage.off = function (key, listener) {
      if( _isString(key) ) {

          if( _isArray(listeners[key]) ) {

              if( _isFunction(listener) ) {

                  var listenerList = listeners[key];

                  for( var i = 0, len = listenerList.length; i < len; i++ ) {
                      if( listenerList[i].listener === listener ) {
                          listenerList.splice(i, 1);
                          return true;
                      }
                  }

              } else if( !listener ) {
                  listeners[key] = [];
              }

          }
      }
      return $storage;
  };

  $storage.onAny = function (listener, context) {
      if( _isFunction(listener)  ) {
          listeners[''] = listeners[''] || [];
          listeners[''].push({ listener: listener, context: context });
      }
      return $storage;
  };

  $storage.offAny = function (listener) {
      if( listeners[''] && _isFunction(listener)  ) {
          var listenerList = listeners[''];
          for( var i = 0, len = listenerList.length; i < len; i++ ) {
              if( listenerList[i].listener === listener ) {
                  listenerList.splice(i, 1);
                  return true;
              }
          }
      }
      else {
          listeners[''] = [];
      }
      return $storage;
  };

  $storage.trigger = function (key, newValue, oldValue) {
      var keyListeners = listeners[key] || [], i, len,
          eventArgs = [ newValue.data, oldValue.data, { newValue: newValue, oldValue: oldValue } ];

      for( i = 0, len = keyListeners.length; i < len; i++ ) {
          keyListeners[i].listener.apply(keyListeners[i].context, eventArgs);
      }

      keyListeners = listeners[''] || [];
      eventArgs.unshift(key);
      for( i = 0, len = keyListeners.length; i < len; i++ ) {
          keyListeners[i].listener.apply(keyListeners[i].context, eventArgs);
      }
      return $storage;
  };

  function handleStorageEvent (e) {
    if( /^{.*}$/.test(e.newValue) ) {
      $storage.trigger( e.key, JSON.parse(e.newValue) || {}, JSON.parse(e.oldValue) || {} );
    }
  }

  if (window.addEventListener) {
		window.addEventListener('storage', handleStorageEvent, false);
	} else if (window.attachEvent) {
		window.attachEvent('onstorage', handleStorageEvent);
	}

  return $storage;

});
