import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import {
  ActionParams,
  BulkActionParams,
  RecordActionParams,
  ResourceActionParams,
} from '../../backend/utils/view-helpers/view-helpers'

/* eslint-disable no-alert */
import { RecordJSON } from '../interfaces'
import { ActionResponse, BulkActionResponse, RecordActionResponse } from '../../backend/actions/action.interface'
import { CsrfTokenInterface } from '../interfaces/csrf-token.interface'

let globalAny: any = {}

try {
  globalAny = window
} catch (error) {
  if (error.message !== 'window is not defined') {
    throw error
  } else {
    globalAny = { isOnServer: true }
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

const checkResponse = (response: AxiosResponse): void => {
  if (globalAny.isOnServer) { return }
  const loginUrl = [globalAny.location.origin, globalAny.REDUX_STATE.paths.loginPath].join('')
  // if response has redirect to loginUrl
  if (response.request.responseURL
      && response.request.responseURL.match(loginUrl)
  ) {
    // eslint-disable-next-line no-undef
    alert('Your session expired. You will be redirected to login screen')
    globalAny.location.assign(loginUrl)
  }
}

/**
 * Extends {@link AxiosRequestConfig}
 *
 * @alias ActionAPIParams
 * @memberof ApiClient
 * @property {any}   ...    any property supported by {@link AxiosRequestConfig}
 */
export type ActionAPIParams = AxiosRequestConfig & ActionParams

/**
 * Extends {@link ActionAPIParams}
 *
 * @alias ResourceActionAPIParams
 * @memberof ApiClient
 * @property {any}   ...    any property supported by {@link AxiosRequestConfig}
 */
export type ResourceActionAPIParams = AxiosRequestConfig & ResourceActionParams & {
  query?: string;
}
/**
 * Extends {@link ActionAPIParams}
 *
 * @alias RecordActionAPIParams
 * @memberof ApiClient
 * @property {any}   ...    any property supported by {@link ActionAPIParams}
 */
export type RecordActionAPIParams = AxiosRequestConfig & RecordActionParams

/**
 * Extends {@link ActionAPIParams}
 *
 * @alias BulkActionAPIParams
 * @memberof ApiClient
 * @see https://github.com/axios/axios/blob/master/index.d.ts#L43
 * @property {any}   ...    any property supported by {@link ActionAPIParams}
 */
export type BulkActionAPIParams = AxiosRequestConfig & BulkActionParams

/**
 * Extends {@link AxiosRequestConfig}
 *
 * @alias GetPageAPIParams
 * @memberof ApiClient
 * @property {any}   ...    any property supported by {@link AxiosRequestConfig}
 */
export type GetPageAPIParams = AxiosRequestConfig & {
  /**
   * Unique page name
   */
  pageName: string;
}

type CookieOptions = {
  path?: string;
  expires?: Date | string;
  'max-age'?: number;
}

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
  private baseURL: string

  private client: AxiosInstance

  private csrfClient: AxiosInstance

  constructor() {
    this.baseURL = ApiClient.getBaseUrl()
    this.client = axios.create({
      baseURL: this.baseURL,
    })
    this.csrfClient = axios.create({ baseURL: '/csrf_token' })
  }

  static getBaseUrl(): string {
    if (globalAny.isOnServer) { return '' }
    return [globalAny.location.origin, globalAny.REDUX_STATE?.paths.rootPath].join('')
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
  async searchRecords({ resourceId, query, searchProperty }: {
    resourceId: string;
    query: string;
    searchProperty?: string;
  }): Promise<Array<RecordJSON>> {
    if (globalAny.isOnServer) { return [] }
    const actionName = 'search'
    const response = await this.resourceAction({
      resourceId,
      actionName,
      query,
      ...(searchProperty ? { params: { searchProperty } } : undefined),
    })
    checkResponse(response)
    return response.data.records
  }

  /**
   * Invokes given resource {@link Action} on the backend.
   *
   * @param   {ResourceActionAPIParams}     options
   * @return  {Promise<ActionResponse>}     response from an {@link Action}
   */
  async resourceAction(options: ResourceActionAPIParams): Promise<AxiosResponse<ActionResponse>> {
    const { resourceId, actionName, data, query, ...axiosParams } = options
    let url = `/api/resources/${resourceId}/actions/${actionName}`
    const method = data ? 'POST' : 'GET'
    if (method === 'POST') {
      const csrfToken: string = (await this.getToken())
      axiosParams.headers = {
        ...axiosParams.headers,
        'X-Csrf-Token': csrfToken,
      }
    }
    if (query) {
      const q = encodeURIComponent(query)
      url = [url, q].join('/')
    }
    const response = await this.client.request({
      url,
      method,
      ...axiosParams,
      data,
    })
    checkResponse(response)
    return response
  }

  /**
   * Invokes given record {@link Action} on the backend.
   *
   * @param   {RecordActionAPIParams} options
   * @return  {Promise<RecordActionResponse>}            response from an {@link Action}
   */
  async recordAction(options: RecordActionAPIParams): Promise<AxiosResponse<RecordActionResponse>> {
    const { resourceId, recordId, actionName, data, ...axiosParams } = options
    const method = data ? 'POST' : 'GET'
    if (method === 'POST') {
      const csrfToken: string = (await this.getToken())
      axiosParams.headers = {
        ...axiosParams.headers,
        'X-Csrf-Token': csrfToken,
      }
    }
    const response = await this.client.request({
      url: `/api/resources/${resourceId}/records/${recordId}/${actionName}`,
      method,
      ...axiosParams,
      data,
    })
    checkResponse(response)
    return response
  }

  /**
   * Invokes given bulk {@link Action} on the backend.
   *
   * @param   {BulkActionAPIParams} options
   * @return  {Promise<BulkActionResponse>}            response from an {@link Action}
   */
  async bulkAction(options: BulkActionAPIParams): Promise<AxiosResponse<BulkActionResponse>> {
    const { resourceId, recordIds, actionName, data, ...axiosParams } = options
    const method = axiosParams.method || data ? 'POST' : 'GET'
    if (method.toUpperCase() === 'POST') {
      const csrfToken: string = (await this.getToken())
      axiosParams.headers = {
        ...axiosParams.headers,
        'X-Csrf-Token': csrfToken,
      }
    }
    const params = new URLSearchParams()
    params.set('recordIds', (recordIds || []).join(','))

    const response = await this.client.request({
      url: `/api/resources/${resourceId}/bulk/${actionName}`,
      method,
      ...axiosParams,
      data,
      params,
    })
    checkResponse(response)
    return response
  }

  /**
   * Invokes dashboard handler.
   *
   * @param   {AxiosRequestConfig}       options
   * @return  {Promise<AxiosResponse<any>>} response from the handler function defined in
   *                                     {@link AdminJSOptions#dashboard}
   */
  async getDashboard(options: AxiosRequestConfig = {}): Promise<AxiosResponse<any>> {
    const response = await this.client.get('/api/dashboard', options)
    checkResponse(response)
    return response
  }

  /**
   * Invokes handler function of given page and returns its response.
   *
   * @param   {GetPageAPIParams}                options
   * @return  {Promise<AxiosResponse<any>>}     response from the handler of given page
   *                                            defined in {@link AdminJSOptions#pages}
   */
  async getPage(options: GetPageAPIParams): Promise<AxiosResponse<any>> {
    const { pageName, ...axiosParams } = options
    const response = await this.client.request({
      url: `/api/pages/${pageName}`,
      ...axiosParams,
    })
    checkResponse(response)
    return response
  }

  async getToken(): Promise<string> {
    const tokenFromCookie = this.getCookie('sk');
    console.log('tokenFromCookie ' + tokenFromCookie);
    if (tokenFromCookie) return tokenFromCookie

    try {
      const response = await this.csrfClient.get('')

      const csrfTokenResponse: CsrfTokenInterface = response.data;
      this.setCookie('sk', csrfTokenResponse.sk, {"max-age": csrfTokenResponse["max-age-seconds"]});
      console.log('got new token, set token ' + document.cookie);
      return csrfTokenResponse.sk;
    } catch (error) {
      throw new Error(`CSRF token error: ${error}`)
    }
  }

   getCookie(name: string): string | undefined {
    let matches = document.cookie.match(new RegExp(
        "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
  }

  setCookie(name: string, value: string, options: CookieOptions = {}) {

    options = {
      path: '/',
      ...options
    };

    if (options.expires instanceof Date) {
      options.expires = options.expires.toUTCString();
    }

    let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);

    for (let optionKey in options) {
      updatedCookie += "; " + optionKey;
      let optionValue = options[optionKey];
      if (optionValue !== true) {
        updatedCookie += "=" + optionValue;
      }
    }

    document.cookie = updatedCookie;
  }
}

export {
  ApiClient as default,
  ApiClient,
}
