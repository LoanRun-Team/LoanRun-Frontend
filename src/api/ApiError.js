export class ApiError extends Error {
  constructor(message,{kind,status=0,code=null,data=null,errors={},cause}={}) {
    super(message,{cause})
    this.name='ApiError';this.kind=kind;this.status=status;this.code=code;this.data=data;this.errors=errors
  }
}
export function errorMessage(error) {
  const fields=Object.values(error?.errors || {}).flat().filter(value=>typeof value==='string')
  return [error?.message || '요청을 처리하지 못했습니다.',...fields].join(' ')
}

