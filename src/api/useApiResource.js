import { useCallback, useEffect, useEffectEvent, useState } from 'react'
export function useApiResource(key,loader) {
  const load=useEffectEvent(signal=>loader(signal))
  const [revision,setRevision]=useState(0)
  const [state,setState]=useState({key:null,status:'loading',data:null,error:null})
  const reload=useCallback(()=>setRevision(n=>n+1),[])
  useEffect(()=>{
    const controller=new AbortController()
    Promise.resolve().then(()=>{
      if(controller.signal.aborted)return
      setState(previous=>({...previous,key,status:'loading',error:null}))
      return load(controller.signal)
    }).then(data=>{
      if(!controller.signal.aborted)setState({key,status:'success',data,error:null})
    },error=>{
      if(!controller.signal.aborted)setState({key,status:'error',data:null,error})
    })
    return()=>controller.abort()
  },[key,revision])
  return {...state,status:state.key===key?state.status:'loading',reload}
}

