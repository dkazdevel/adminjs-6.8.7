"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.ApiClient = void 0;

var _axios = _interopRequireDefault(require("axios"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let globalAny = {};

try {
  globalAny = window;
} catch (error) {
  if (error.message !== 'window is not defined') {
    throw error;
  } else {
    globalAny = {
      isOnServer: true
    };
  }
}
/**
 * Type of an [axios request]{@link https://github.com/axios/axios/blob/master/index.d.ts#L43}
 *
 * @typedef {object} AxiosRequestConfig
 * @alias AxiosRequestConfig
 * @memberof ApiClient
 * @see https://github.com/axios/axios/blob/master/index.d.ts#L43
 */


const checkResponse = response => {
  if (globalAny.isOnServer) {
    return;
  }

  const loginUrl = [globalAny.location.origin, globalAny.REDUX_STATE.paths.loginPath].join(''); // if response has redirect to loginUrl

  if (response.request.responseURL && response.request.responseURL.match(loginUrl)) {
    // eslint-disable-next-line no-undef
    alert('Your session expired. You will be redirected to login screen');
    globalAny.location.assign(loginUrl);
  }
};
/**
 * Extends {@link AxiosRequestConfig}
 *
 * @alias ActionAPIParams
 * @memberof ApiClient
 * @property {any}   ...    any property supported by {@link AxiosRequestConfig}
 */


/**
 * Client which access the admin API.
 * Use it to fetch data from auto generated AdminJS API.
 *
 * In the backend it uses [axios](https://github.com/axios/axios) client
 * library.
 *
 * Usage:
 * ```javascript
 * import { ApiClient } from 'adminjs'
 *
 * const api = new ApiClient()
 * // fetching all records
 * api.resourceAction({ resourceId: 'Comments', actionName: 'list' }).then(results => {...})
 * ```
 * @see https://github.com/axios/axios
 * @hideconstructor
 */
class ApiClient {
  constructor() {
    this.baseURL = ApiClient.getBaseUrl();
    this.client = _axios.default.create({
      baseURL: this.baseURL
    });
    this.csrfClient = _axios.default.create({
      baseURL: '/csrf_token'
    });
  }

  static getBaseUrl() {
    var _globalAny$REDUX_STAT;

    if (globalAny.isOnServer) {
      return '';
    }

    return [globalAny.location.origin, (_globalAny$REDUX_STAT = globalAny.REDUX_STATE) === null || _globalAny$REDUX_STAT === void 0 ? void 0 : _globalAny$REDUX_STAT.paths.rootPath].join('');
  }
  /**
   * Search by query string for records in a given resource.
   *
   * @param   {Object}  options
   * @param   {String}  options.resourceId     id of a {@link ResourceJSON}
   * @param   {String}  options.query          query string
   * @param   {String}  options.searchProperty optional property name
   *
   * @return  {Promise<SearchResponse>}
   */


  async searchRecords({
    resourceId,
    query,
    searchProperty
  }) {
    if (globalAny.isOnServer) {
      return [];
    }

    const actionName = 'search';
    const response = await this.resourceAction({
      resourceId,
      actionName,
      query,
      ...(searchProperty ? {
        params: {
          searchProperty
        }
      } : undefined)
    });
    checkResponse(response);
    return response.data.records;
  }
  /**
   * Invokes given resource {@link Action} on the backend.
   *
   * @param   {ResourceActionAPIParams}     options
   * @return  {Promise<ActionResponse>}     response from an {@link Action}
   */


  async resourceAction(options) {
    const {
      resourceId,
      actionName,
      data,
      query,
      ...axiosParams
    } = options;
    let url = `/api/resources/${resourceId}/actions/${actionName}`;
    const method = data ? 'POST' : 'GET';

    if (method === 'POST') {
      const csrfToken = await this.getToken();
      axiosParams.headers = { ...axiosParams.headers,
        'X-Csrf-Token': csrfToken
      };
    }

    if (query) {
      const q = encodeURIComponent(query);
      url = [url, q].join('/');
    }

    const response = await this.client.request({
      url,
      method,
      ...axiosParams,
      data
    });
    checkResponse(response);
    return response;
  }
  /**
   * Invokes given record {@link Action} on the backend.
   *
   * @param   {RecordActionAPIParams} options
   * @return  {Promise<RecordActionResponse>}            response from an {@link Action}
   */


  async recordAction(options) {
    const {
      resourceId,
      recordId,
      actionName,
      data,
      ...axiosParams
    } = options;
    const method = data ? 'POST' : 'GET';

    if (method === 'POST') {
      const csrfToken = await this.getToken();
      axiosParams.headers = { ...axiosParams.headers,
        'X-Csrf-Token': csrfToken
      };
    }

    const response = await this.client.request({
      url: `/api/resources/${resourceId}/records/${recordId}/${actionName}`,
      method,
      ...axiosParams,
      data
    });
    checkResponse(response);
    return response;
  }
  /**
   * Invokes given bulk {@link Action} on the backend.
   *
   * @param   {BulkActionAPIParams} options
   * @return  {Promise<BulkActionResponse>}            response from an {@link Action}
   */


  async bulkAction(options) {
    const {
      resourceId,
      recordIds,
      actionName,
      data,
      ...axiosParams
    } = options;
    const method = axiosParams.method || data ? 'POST' : 'GET';

    if (method.toUpperCase() === 'POST') {
      const csrfToken = await this.getToken();
      axiosParams.headers = { ...axiosParams.headers,
        'X-Csrf-Token': csrfToken
      };
    }

    const params = new URLSearchParams();
    params.set('recordIds', (recordIds || []).join(','));
    const response = await this.client.request({
      url: `/api/resources/${resourceId}/bulk/${actionName}`,
      method,
      ...axiosParams,
      data,
      params
    });
    checkResponse(response);
    return response;
  }
  /**
   * Invokes dashboard handler.
   *
   * @param   {AxiosRequestConfig}       options
   * @return  {Promise<AxiosResponse<any>>} response from the handler function defined in
   *                                     {@link AdminJSOptions#dashboard}
   */


  async getDashboard(options = {}) {
    const response = await this.client.get('/api/dashboard', options);
    checkResponse(response);
    return response;
  }
  /**
   * Invokes handler function of given page and returns its response.
   *
   * @param   {GetPageAPIParams}                options
   * @return  {Promise<AxiosResponse<any>>}     response from the handler of given page
   *                                            defined in {@link AdminJSOptions#pages}
   */


  async getPage(options) {
    const {
      pageName,
      ...axiosParams
    } = options;
    const response = await this.client.request({
      url: `/api/pages/${pageName}`,
      ...axiosParams
    });
    checkResponse(response);
    return response;
  }

  async getToken() {
    const tokenFromCookie = this.getCookie('sk');
    console.log('tokenFromCookie ' + tokenFromCookie);
    if (tokenFromCookie) return tokenFromCookie;

    try {
      const response = await this.csrfClient.get('');
      const csrfTokenResponse = response.data;
      console.log('csrfTokenResponse ' + csrfTokenResponse);
      this.setCookie('sk', csrfTokenResponse.sk, {
        "max-age": csrfTokenResponse["max-age-seconds"]
      });
      console.log('got new token, set token ' + document.cookie);
      return csrfTokenResponse.sk;
    } catch (error) {
      throw new Error(`CSRF token error: ${error}`);
    }
  }

  getCookie(name) {
    let matches = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"));
    return matches ? decodeURIComponent(matches[1]) : undefined;
  }

  setCookie(name, value, options = {}) {
    console.log('setCookie');
    options = {
      path: '/',
      ...options
    };

    if (options.expires instanceof Date) {
      options.expires = options.expires.toUTCString();
    }

    let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);
    console.log('updatedCookie');

    for (let optionKey in options) {
      updatedCookie += "; " + optionKey;
      let optionValue = options[optionKey];

      if (optionValue !== true) {
        updatedCookie += "=" + optionValue;
      }
    }

    console.log('updating cookie');
    document.cookie = updatedCookie;
  }

}

exports.ApiClient = exports.default = ApiClient;