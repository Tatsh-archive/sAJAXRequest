/*jshint expr:true */

/**
 * @license sAJAXRequest | http://www.opensource.org/licenses/mit-license.php
 */

/**
 * AJAX functions. Depends on fJSON.
 * @constructor
 */
var sAJAXRequest = function () {};
/**
 * Parameters to add to every request.
 *
 * @type Object
 * @private
 */
sAJAXRequest._params = {};
/**
 * If this browser supports XMLHttpRequest natively.
 * @type boolean
 * @private
 */
sAJAXRequest._supportsXHR = typeof XMLHttpRequest !== 'undefined';
/**
 * Makes string of parameters for a request.
 * @private
 * @param {Object} params Parameters in object key value format.
 * @returns {string} String of parameters.
 */
sAJAXRequest._makeParameters = function (params) {
  var ret = [];
  for (var key in params) {
    if (params.hasOwnProperty(key)) {
      ret.push(key + '=' + encodeURIComponent(params[key]));
    }
  }
  return ret.join('&');
};
/**
 * Perform a request.
 * @private
 * @param {string} url URL including query string.
 * @param {Object|null|FormData} postData POST data or null for GET requests.
 * @param {function(string,string=,(XMLHttpRequest|null)=):undefined} cb
 *   Callback.
 * @param {string} [requestType='get'] Request type. 'get' or 'post'.
 * @param {function(string,string=,(XMLHttpRequest|null)=):undefined} [errorCb]
 *   Error callback.
 * @param {boolean} [isFileUpload=false] If this is is a file upload.
 * @returns {XMLHttpRequest|null} XMLHttpRequest or null if the browser does
 *   not support AJAX.
 */
sAJAXRequest._perform = function (url, postData, cb, requestType, errorCb, isFileUpload) {
  requestType === undefined && (requestType = 'GET');
  isFileUpload === undefined && (isFileUpload = false);
  requestType = requestType.toUpperCase();
  if (requestType === 'POST' && (postData === undefined || postData === null)) {
    postData = {};
  }

  /**
   * @private
   * @type function()
   */
  var getXHR = function () {
    if (!sAJAXRequest._supportsXHR) {
      if (window.ActiveXObject) {
        var activeXVersions = ['Msxml2', 'Microsoft'];
        for (var i = 0; i < activeXVersions.length; i++) {
          try {
            return new ActiveXObject(activeXVersions[i] + '.XMLHTTP');
          }
          catch (e) {}
        }
      }
    }
    else if (window.XMLHttpRequest) {
      return new XMLHttpRequest();
    }
    return null;
  };

  /**
   * @type XMLHttpRequest
   * @private
   */
  var xhr = getXHR();
  if (!xhr) {
    errorCb('No support for AJAX request.');
    return xhr;
  }

  xhr.open(requestType, url, true);

  /** @type {string|FormData|null} */
  var postDataStr = '';
  
  if (requestType === 'POST') {
    if (!isFileUpload) {
      xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
      postDataStr = sAJAXRequest._makeParameters(postData);
    }
    else {
      // Assume postData is FormData or an object usable with xhr.send()
      postDataStr = /** @type {FormData} */ postData;
    }
  }
  else {
    postDataStr = null;
  }

  xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  /**
   * @type function()
   * @private
   */
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        cb(xhr.responseText, xhr.statusText, xhr);
      }
      else {
        if (errorCb) {
          errorCb(xhr.responseText, xhr.statusText, xhr);
        }
      }
    }
  };
  xhr.send(postDataStr);

  return xhr;
};
/**
 * Default error handler.
 * @param {string|number|Array|Object|null} responseText Response text.
 * @param {string} [statusText] Status text.
 * @param {XMLHttpRequest} [xhr] The XMLHttpRequest instance.
 */
sAJAXRequest._defaultErrorCb = function (responseText, statusText, xhr) {
  window.console && window.console.log('Caught exception: ', responseText);
};
/**
 * Perform an AJAX request to a local URL (same domain) and return the JSON
 *   data as a JavaScript object.
 * @param {string} url URI.
 * @param {function(*,string,XMLHttpRequest)} [cb] Callback. Receives the JSON
 *   decoded JavaScript object as the first argument.
 * @param {function(string)} [errorCb] Error handler callback.
 * @param {Object} [data] Data to send in object key value format for the query
 *   string.
 * @returns {XMLHttpRequest} The XMLHttpRequest object.
 */
sAJAXRequest.getJSON = function (url, cb, errorCb, data) {
  if (errorCb === undefined) {
    errorCb = sAJAXRequest._defaultErrorCb;
  }
  if (cb === undefined) {
    cb = function () {};
  }

  if (data !== undefined) {
    url += '?' + sAJAXRequest._makeParameters(data) + '&' + sAJAXRequest._makeParameters(sAJAXRequest._params);
  }

  return sAJAXRequest._perform(url, null, function (responseText, statusText, xhr) {
    cb(fJSON.decode(responseText), statusText ? statusText : '', xhr ? xhr : null);
  }, 'get', errorCb);
};
/**
 * Posts an AJAX request.
 * @param {string} url URI.
 * @param {Object|FormData} data Object of data.
 * @param {function((string|number|Array|Object|null),string=,(XMLHttpRequest|null)=):undefined}
 *   cb Callback. If the dataType is JSON, then the first argument will be the
 *   JSON data unserialised. Otherwise, it will be a string.
 * @param {function((string|number|Array|Object|null),string=,(XMLHttpRequest|null)=):undefined}
 *   [errorCb] Error callback.
 * @param {string} [dataType] Data type. One of 'text', 'xml', 'json',
 *   'script', 'html'.
 * @param {boolean} [isFileUpload=false] Whether or not this is a file upload.
 * @returns {XMLHttpRequest} The XMLHttpRequest object.
 */
sAJAXRequest.post = function (url, data, cb, errorCb, dataType, isFileUpload) {
  dataType === undefined && (dataType = 'xml');
  dataType = dataType.toLowerCase();

  if (errorCb === undefined) {
    errorCb = sAJAXRequest._defaultErrorCb;
  }

  return sAJAXRequest._perform(url, data, function (responseText, statusText, xhr) {
    var data = responseText;
    
    if (dataType === 'json') {
      data = /** @type {(string|number|Array|Object|null)} */ fJSON.decode(responseText);
    }
    
    cb(data, statusText, xhr);
  }, 'POST', function (responseText, statusText, xhr) {
    var data = responseText;
    if (dataType === 'json') {
      data = /** @type {(string|number|Array|Object|null)} */ fJSON.decode(responseText);
    }
    errorCb(data, statusText, xhr);
  }, isFileUpload);
};
/**
 * Fetch a script, then run a callback.
 * @param {string} url The URI.
 * @param {function()} cb The callback.
 */
sAJAXRequest.getScript = function (url, cb) {
  var script = document.createElement('script');
  script.async = true;
  script.src = url;
  script.type = 'text/javascript';
  script.onload = cb;
  script.onreadystatechange = function () {
    if (script.readyState === 'loaded' || script.readyState === 'complete') {
      cb();
    }
  };
  document.body.appendChild(script);
};
/**
 * Add a query parameter to be added to every GET request.
 * @param {string} key The parameter name.
 * @param {string} value The value of the parameter.
 */
sAJAXRequest.addParameter = function (key, value) {
  sAJAXRequest._params[key] = value;
};
