import React, {useState} from 'react'
import {generateTrack} from './api'

export default function App(){
  const [tracks,setTracks]=useState([])
  const add = async ()=>{
    const instrument = 'piano'
    const r = await generateTrack({instrument,length:4})
    setTracks(t=>[...t,{id:r.id, url:r.url, name:'Track '+(t.length+1)}])
  }
  return (
    <div style={{display:'flex',height:'100vh'}}>
      <div style={{width:260,background:'#111',color:'#fff',padding:12}}>
        <h3>Tracks</h3>
        <button onClick={add}>Generate Track</button>
        <ul>
          {tracks.map(t=> <li key={t.id}>{t.name} - <audio src={t.url} controls /></li>)}
        </ul>
      </div>
      <div style={{flex:1,background:'#071028',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>Workspace</div>
    </div>
  )
}
