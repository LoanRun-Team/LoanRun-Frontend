export class ApiError extends Error {
  constructor(message, { kind, status = 0, code = null, data = null, cause } = {}) {
    super(message, { cause })
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
    this.code = code
    this.data = data
  }
}
