import { ErrorTypeEnum } from '../../../utils/error-type.enum'
import RecordError from './record-error'

/**
 * Error which can be thrown by developer in custom actions/hooks/components
 *
 * @category Errors
 */
export class AppError extends Error {
  /**
   * HTTP Status code, defaults to 400
   */
  public statusCode: number

  /**
   * Base error message and type which is stored in the record
   */
  public baseError: RecordError

  /**
   * Any custom message which should be seen in the UI
   */
  public baseMessage?: string

  /**
   * Any additional error information
   */
  public data?: Record<string, unknown>

  /**
   * @param {string} message    a message to be shared with the client
   * @param {string} data       additional data to be shared with the client
   */
  constructor(message: string, data?: Record<string, unknown>) {
    super(message)
    this.statusCode = 400
    this.baseMessage = message
    this.baseError = {
      message,
      type: ErrorTypeEnum.App,
    }
    this.data = data
    this.name = ErrorTypeEnum.App
  }
}

export default AppError
