import React, { useEffect, useState } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export default function App(){
  const [students, setStudents] = useState([])
  const [form, setForm] = useState({ name:'', email:'', program:'', notes:'' })
  const [question, setQuestion] = useState('What are the enrollment deadlines?')
  const [answer, setAnswer] = useState('')

  const load = async() => {
    const r = await fetch(`${API}/api/students`)
    setStudents(await r.json())
  }
  useEffect(()=>{ load() },[])

  const save = async(e)=>{
    e.preventDefault()
    await fetch(`${API}/api/students`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
    setForm({ name:'', email:'', program:'', notes:'' })
    load()
  }

  const remove = async(id)=>{
    await fetch(`${API}/api/students/${id}`, { method:'DELETE' })
    load()
  }

  const ask = async()=>{
    setAnswer('...thinking')
    const r = await fetch(`${API}/api/chat`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ question }) })
    const data = await r.json()
    setAnswer(data.answer || 'No answer')
  }

  return (
    <div style={{maxWidth:1000, margin:'40px auto', padding:'0 16px'}}>
      <h1>AI Student Helper</h1>
      <p style={{opacity:.8}}>Tiny full‑stack app: manage students + ask an AI assistant questions.</p>

      <div className="row">
        <div className="card">
          <h2 style={{marginTop:0}}>Students</h2>
          <form onSubmit={save} style={{display:'grid', gap:8}}>
            <input placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required />
            <input placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
            <input placeholder="Program" value={form.program} onChange={e=>setForm({...form, program:e.target.value})} />
            <textarea placeholder="Notes" rows="3" value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})}></textarea>
            <button type="submit">Add Student</button>
          </form>
          <table style={{marginTop:12}}>
            <thead><tr><th>Name</th><th>Email</th><th>Program</th><th>Notes</th><th></th></tr></thead>
            <tbody>
              {students.map(s=> (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.email}</td>
                  <td>{s.program}</td>
                  <td>{s.notes}</td>
                  <td><button onClick={()=>remove(s.id)} style={{background:'#ef4444'}}>Delete</button></td>
                </tr>
              ))}
              {students.length===0 && <tr><td colSpan="5" style={{opacity:.7}}>No students yet</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2 style={{marginTop:0}}>AI Chat</h2>
          <textarea rows="5" value={question} onChange={e=>setQuestion(e.target.value)}></textarea>
          <div style={{marginTop:8}}>
            <button onClick={ask}>Ask</button>
          </div>
          <p style={{whiteSpace:'pre-wrap', marginTop:12}}>{answer}</p>
        </div>
      </div>
    </div>
  )
}
