export async function generateTrack(params){
  const res = await fetch('/api/generate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(params)})
  return res.json()
}
