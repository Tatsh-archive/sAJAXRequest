/**
 * AJAX functions. Depends on fJSON.
 * @constructor
 */
var sAJAXRequest = function () {};
/**
 * If this browser supports XMLHttpRequest natively.
 * @type boolean
 * @private
 */
sAJAXRequest._supportsXHR = (function () {
  return typeof XMLHttpRequest !== 'undefined';
})();
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
 * @param {Object|null} postData POST data or null for GET requests.
 * @param {function(string,XMLHttpRequest)} cb Callback.
 * @param {string} [requestType='get'] Request type. 'get' or 'post'.
 * @param {function((XMLHttpRequest|string))} [errorCb] Error callback.
 * @param {boolean} [isFileUpload=false] If this is is a file upload.
 * @returns {XMLHttpRequest|null} XMLHttpRequest or null if the browser does
 *   not support AJAX.
 */
sAJAXRequest._perform = function (url, postData, cb, requestType, errorCb, isFileUpload) {
  requestType === undefined && (requestType = 'GET');
  /**
   * @private
   * @type function()
   */
  errorCb === undefined && (errorCb = function () {});
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

  var postDataStr;
  if (requestType === 'POST') {
    if (!isFileUpload) {
      xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    }
    else {
      xhr.setRequestHeader('Content-type', 'multipart/form-data');
    }
    postDataStr = sAJAXRequest._makeParameters(postData);
    //xhr.setRequestHeader('Content-length', postData.length);
    //xhr.setRequestHeader('Connection', 'close');
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
        cb(xhr.responseText, xhr);
      }
      else {
        errorCb(xhr.statusText);
      }
    }
  };
  xhr.send(postDataStr);

  return xhr;
};
/**
 * Default error handler.
 * @param {XMLHttpRequest|string} xhrOrString
 */
sAJAXRequest._defaultErrorCb = function (xhrOrString) {
  window.console && window.console.log('Caught exception: ', xhrOrString);
};
/**
 * Perform an AJAX request to a local URL (same domain) and return the JSON
 *   data as a JavaScript object.
 * @param {string} url URI.
 * @param {function(*,XMLHttpRequest)} cb Callback. Receives the JSON
 *   decoded JavaScript object as the first argument.
 * @param {function(string)} [errorCb] Error handler callback.
 * @param {Object} [data] Data to send in object key value format for
 *   the query string.
 * @returns {XMLHttpRequest} The XMLHttpRequest object.
 */
sAJAXRequest.getJSON = function (url, cb, errorCb, data) {
  if (errorCb === undefined) {
    errorCb = sAJAXRequest._defaultErrorCb;
  }

  if (data !== undefined) {
    url += '?' + sAJAXRequest._makeParameters(data);
  }

  return sAJAXRequest._perform(url, null, function (responseText, xhr) {
    try {
      cb(fJSON.decode(responseText), xhr);
    }
    catch (e) {
      errorCb(e.message ? e.message : 'Unknown error');
    }
  }, 'get', errorCb);
};
/**
 * Posts an AJAX request.
 * @param {string} url URI.
 * @param {Object} data Object of data.
 * @param {function((*|string),string)} cb Callback. If the dataType is
 *   JSON, then the first argument will be the JSON data unserialised.
 *   Otherwise, it will be a string.
 * @param {function(string,XMLHttpRequest)} [errorCb] Error callback.
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

  return sAJAXRequest._perform(url, data, function (responseText, xhr) {
    try {
      if (dataType === 'json') {
        responseText = fJSON.decode(responseText);
      }
      cb(responseText, xhr);
    }
    catch (e) {
      errorCb(e.message ? e.message : 'Unknown error', xhr);
    }
  }, 'POST', errorCb, isFileUpload);
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